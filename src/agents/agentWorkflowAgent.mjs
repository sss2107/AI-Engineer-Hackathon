import { clamp, extractLines, includesAny, makeAgentResult } from "../evidence.mjs";

export async function agentWorkflowAgent(context) {
  const startedAt = Date.now();
  await Promise.resolve();

  const hasRoles = includesAny(context.lower, [
    "planner",
    "reviewer",
    "test writer",
    "tester",
    "critic",
    "subagent",
    "agent",
    "parallel",
    "acceptance criteria",
    "definition of done"
  ]);
  const hasReviewLoop = includesAny(context.lower, [
    "review the diff",
    "independent review",
    "critique",
    "red team",
    "check edge cases",
    "acceptance criteria"
  ]);
  const negativeWorkflow = includesAny(context.lower, [
    "did not set up separate",
    "no separate planner",
    "no reviewer agent",
    "no tester agent",
    "mostly used one implementation prompt",
    "one implementation prompt"
  ]);
  const broadPrompt = includesAny(context.lower, [
    "generate the full",
    "build the entire",
    "write the whole",
    "implement everything",
    "full pipeline"
  ]);

  const score = clamp(42 + (hasRoles ? 24 : 0) + (hasReviewLoop ? 20 : 0) - (broadPrompt ? 16 : 0) - (negativeWorkflow ? 28 : 0));
  const maturity = score >= 82 ? "Mature" : score >= 64 ? "Developing" : score >= 50 ? "Messy" : "Needs structure";
  const detail =
    score >= 82
      ? "Candidate separated planning, implementation, review, and verification loops."
      : score >= 64
        ? "Candidate created some review loop, but delegation could be more explicit."
        : "No clear planner/reviewer/tester workflow or acceptance criteria before delegation.";

  const findings = [];
  if (!hasRoles || broadPrompt || negativeWorkflow) {
    findings.push({
      label: "Agent workflow gap",
      tone: "#ffd166",
      severity: broadPrompt ? "high" : "medium",
      title: "Used AI as a generator, not as a managed engineering workflow.",
      copy:
        "The transcript does not show a crisp split between planner, implementer, reviewer, and test-writer responsibilities.",
      evidence:
        extractLines(context.transcript, ["did not set up", "one implementation prompt", "generate the full", "build the entire", "implement everything"], 1)[0] ||
        "No acceptance criteria or specialist review pass was detected before delegation."
    });
  } else {
    findings.push({
      label: "Agent workflow",
      tone: "#55d8ff",
      severity: "low",
      title: "Structured AI work into a reviewable workflow.",
      copy:
        "The candidate used AI for bounded subtasks and preserved a human review loop around implementation.",
      evidence: extractLines(context.transcript, ["review", "acceptance criteria", "planner", "tester"], 1)[0]
    });
  }

  return makeAgentResult("agent-workflow", "Agent Workflow Auditor", startedAt, {
    summary: "Checks whether the candidate can orchestrate AI work instead of dumping broad prompts into the IDE.",
    findings,
    scores: [["Builds agent workflow", score]],
    signals: {
      agentWorkflow: [maturity, detail]
    }
  });
}
