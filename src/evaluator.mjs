import { agentWorkflowAgent } from "./agents/agentWorkflowAgent.mjs";
import { codeReviewAgent } from "./agents/codeReviewAgent.mjs";
import { communicationAgent } from "./agents/communicationAgent.mjs";
import { conversationScannerAgent } from "./agents/conversationScannerAgent.mjs";
import { deliveryRiskAgent } from "./agents/deliveryRiskAgent.mjs";
import { technicalDepthAgent } from "./agents/technicalDepthAgent.mjs";
import { verificationAgent } from "./agents/verificationAgent.mjs";
import { normalizeEvidence, severityWeight } from "./evidence.mjs";

const specialistAgents = [
  conversationScannerAgent,
  agentWorkflowAgent,
  codeReviewAgent,
  technicalDepthAgent,
  verificationAgent,
  communicationAgent,
  deliveryRiskAgent
];

export async function evaluateCandidate(payload) {
  const context = normalizeEvidence(payload);
  const startedAt = Date.now();
  const agents = await Promise.all(specialistAgents.map((agent) => agent(context)));
  const candidateReadout = synthesizeCandidate(context, agents);
  const durationMs = Date.now() - startedAt;
  const id = `eval_${Date.now()}`;
  const specialistReports = agents.map((agent) => ({
    id: agent.id,
    label: agent.label,
    status: agent.status,
    duration_ms: agent.durationMs,
    summary: agent.summary,
    finding_count: agent.findings.length,
    findings: agent.findings,
    scores: (agent.scores || []).map(([dimension, score]) => ({
      dimension,
      score,
      scale: 100
    })),
    signals: agent.signals || {}
  }));
  const structuredSignals = buildStructuredSignals(candidateReadout);
  const generatedAt = new Date().toISOString();

  return {
    api_version: "2026-05-09",
    object: "interviewos.evaluation",
    evaluation: {
      id,
      status: "complete",
      generated_at: generatedAt,
      duration_ms: durationMs,
      role: context.role,
      mode: context.mode,
      recommendation: candidateReadout.cohort[4],
      confidence: parseInt(candidateReadout.confidence, 10) / 100,
      input_summary: {
        candidate_id: context.candidate.id,
        candidate_name: context.candidate.name,
        task_title: context.candidate.title,
        has_ai_transcript: Boolean(context.transcript),
        has_git_diff: Boolean(context.gitDiff),
        has_test_log: Boolean(context.testLog),
        has_command_trace: Boolean(context.commandTrace),
        has_final_explanation: Boolean(context.finalExplanation),
        evidence_characters: context.allText.length
      }
    },
    candidate_readout: candidateReadout,
    critical_insights: candidateReadout.insights.map((insight, index) => ({
      id: `insight_${index + 1}`,
      label: insight.label,
      title: insight.title,
      summary: insight.copy,
      evidence: insight.evidence,
      tone: insight.tone
    })),
    signals: structuredSignals,
    scorecard: candidateReadout.scores.map(([dimension, score]) => ({
      dimension,
      score,
      scale: 100
    })),
    evidence_trail: candidateReadout.timeline.map(([step, title, summary, tone]) => ({
      step,
      title,
      summary,
      tone
    })),
    transcript_excerpts: candidateReadout.quotes.map(([speaker, quote]) => ({
      speaker,
      quote
    })),
    specialist_reports: specialistReports,
    integrations: {
      rest_api: {
        method: "POST",
        path: "/api/evaluations"
      },
      cli: {
        command: "interviewos analyze --evidence evidence.json"
      },
      mcp: {
        server: "node mcp/interviewos-mcp.mjs",
        tools: ["interviewos_evaluate", "interviewos_demo_evaluate"]
      }
    },
    // Backwards-compatible aliases used by the hackathon UI.
    id,
    generatedAt,
    durationMs,
    mode: context.mode,
    role: context.role,
    candidate: candidateReadout,
    agents: specialistReports.map((agent) => ({
      id: agent.id,
      label: agent.label,
      status: agent.status,
      durationMs: agent.duration_ms,
      summary: agent.summary,
      findingCount: agent.finding_count
    }))
  };
}

function synthesizeCandidate(context, agents) {
  const findings = agents
    .flatMap((agent) =>
      agent.findings.map((finding) => ({
        ...finding,
        sourceAgent: agent.label
      }))
    )
    .sort((a, b) => severityWeight(b.severity) - severityWeight(a.severity));

  const topFindings = prioritizeFindings(findings).slice(0, 3);
  const scores = mergeScores(agents);
  const scoreAverage = Math.round(scores.reduce((sum, [, value]) => sum + value, 0) / Math.max(scores.length, 1));
  const confidence = Math.max(72, Math.min(96, scoreAverage + topFindings.length * 2));

  return {
    id: context.candidate.id,
    name: context.candidate.name,
    title: context.candidate.title,
    confidence: `${confidence}% evidence confidence`,
    signals: {
      agent: pickSignal(agents, "agentWorkflow", ["Needs structure", "No agent-workflow evidence found."]),
      evidence: pickSignal(agents, "evidenceTiming", ["Thin", "Little verification evidence was found."]),
      comm: pickSignal(agents, "communication", ["Clear", "Communication evidence was limited."]),
      risk: pickSignal(agents, "deliveryRisk", ["Medium", "Residual risk should be discussed."])
    },
    insights: topFindings.map((finding) => ({
      label: finding.label,
      tone: finding.tone,
      title: finding.title,
      copy: finding.copy,
      evidence: `${finding.evidence} Source: ${finding.sourceAgent}.`
    })),
    timeline: buildTimeline(agents),
    quotes: buildQuotes(agents),
    scores,
    cohort: [
      context.candidate.name,
      pickSignal(agents, "evidenceTiming", ["Thin"])[0],
      pickSignal(agents, "agentWorkflow", ["Needs structure"])[0],
      pickSignal(agents, "communication", ["Clear"])[0],
      recommendationFromSignals(agents)
    ]
  };
}

function prioritizeFindings(findings) {
  const seen = new Set();
  const result = [];
  for (const finding of findings) {
    const key = finding.label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(finding);
  }
  return result;
}

function mergeScores(agents) {
  const preferredOrder = [
    "Clarifies ambiguity",
    "Controls AI delegation",
    "Builds agent workflow",
    "Proves correctness",
    "Role-specific depth",
    "Code judgment",
    "Explains tradeoffs"
  ];
  const scoreMap = new Map();
  for (const agent of agents) {
    for (const [label, value] of agent.scores || []) {
      scoreMap.set(label, value);
    }
  }

  if (!scoreMap.has("Controls AI delegation")) {
    const workflow = scoreMap.get("Builds agent workflow") || 55;
    const clarity = scoreMap.get("Clarifies ambiguity") || 55;
    scoreMap.set("Controls AI delegation", Math.round((workflow + clarity) / 2));
  }

  return preferredOrder
    .filter((label) => scoreMap.has(label))
    .map((label) => [label, scoreMap.get(label)]);
}

function pickSignal(agents, key, fallback) {
  for (const agent of agents) {
    if (agent.signals && agent.signals[key]) return agent.signals[key];
  }
  return fallback;
}

function buildTimeline(agents) {
  const mapped = [];
  for (const agent of agents) {
    for (const finding of agent.findings) {
      mapped.push([
        `${String(mapped.length + 1).padStart(2, "0")}`,
        finding.title,
        finding.copy,
        finding.tone
      ]);
    }
  }
  return mapped.slice(0, 5);
}

function buildQuotes(agents) {
  const scanner = agents.find((agent) => agent.id === "conversation-scanner");
  const quotes = (scanner?.quotes || []).slice(0, 3).map((line) => {
    const [speaker, ...rest] = line.split(":");
    return [speaker || "Transcript", rest.join(":").trim() || line];
  });

  if (quotes.length) return quotes;

  return [
    ["Evaluator", "Transcript had limited quoteable evidence; ask the candidate to narrate decisions during the interview."],
    ["Evaluator", "Attach AI chat history to improve process-level signal."]
  ];
}

function recommendationFromSignals(agents) {
  const risk = pickSignal(agents, "deliveryRisk", ["Medium"])[0];
  const workflow = pickSignal(agents, "agentWorkflow", ["Needs structure"])[0];
  const evidence = pickSignal(agents, "evidenceTiming", ["Thin"])[0];

  if (risk === "Low" && (workflow === "Mature" || evidence === "Evidence-led")) return "Strong hire signal";
  if (risk === "High" || workflow === "Needs structure") return "Next round with probe";
  return "Maybe";
}

function buildStructuredSignals(candidateReadout) {
  return {
    agent_workflow_maturity: {
      rating: candidateReadout.signals.agent[0],
      explanation: candidateReadout.signals.agent[1]
    },
    evidence_timing: {
      rating: candidateReadout.signals.evidence[0],
      explanation: candidateReadout.signals.evidence[1]
    },
    communication: {
      rating: candidateReadout.signals.comm[0],
      explanation: candidateReadout.signals.comm[1]
    },
    delivery_risk: {
      rating: candidateReadout.signals.risk[0],
      explanation: candidateReadout.signals.risk[1]
    }
  };
}
