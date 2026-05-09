export function normalizeEvidence(payload = {}) {
  const evidence = payload.evidence || {};
  const candidate = payload.candidate || {};
  const role = payload.role || "SWE Platform";
  const mode = payload.mode || "AI-assisted build";

  const transcript = toTranscriptText(
    evidence.aiTranscript ||
      evidence.ai_transcript ||
      evidence.transcript ||
      payload.aiTranscript ||
      payload.transcript ||
      ""
  );

  const gitDiff = toText(evidence.gitDiff || evidence.git_diff || payload.gitDiff || "");
  const testLog = toText(evidence.testLog || evidence.test_log || payload.testLog || "");
  const commandTrace = toTranscriptText(
    evidence.commandTrace || evidence.command_trace || payload.commandTrace || ""
  );
  const finalExplanation = toText(
    evidence.finalExplanation || evidence.final_explanation || payload.finalExplanation || ""
  );

  const allText = [transcript, gitDiff, testLog, commandTrace, finalExplanation]
    .join("\n")
    .trim();

  return {
    candidate: {
      id: candidate.id || "uploaded-candidate",
      name: candidate.name || extractCandidateName(transcript) || "Uploaded Candidate",
      title: candidate.title || evidence.task || payload.task || "Uploaded transcript"
    },
    role,
    mode,
    transcript,
    gitDiff,
    testLog,
    commandTrace,
    finalExplanation,
    allText,
    lower: allText.toLowerCase()
  };
}

export function toText(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

export function toTranscriptText(value) {
  if (Array.isArray(value)) {
    return value
      .map((turn) => {
        if (typeof turn === "string") return turn;
        const speaker = turn.speaker || turn.role || turn.author || "Turn";
        const content = turn.content || turn.text || turn.message || "";
        return `${speaker}: ${content}`;
      })
      .join("\n");
  }
  return toText(value);
}

export function includesAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

export function countAny(text, terms) {
  return terms.reduce((count, term) => count + (text.includes(term) ? 1 : 0), 0);
}

export function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function extractLines(text, terms, limit = 3) {
  const lowerTerms = terms.map((term) => term.toLowerCase());
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => {
      const lower = line.toLowerCase();
      return lowerTerms.some((term) => lower.includes(term));
    })
    .slice(0, limit);
}

export function severityWeight(severity) {
  if (severity === "high") return 3;
  if (severity === "medium") return 2;
  return 1;
}

export function makeAgentResult(id, label, startedAt, result) {
  return {
    id,
    label,
    status: "complete",
    durationMs: Date.now() - startedAt,
    findings: [],
    scores: [],
    quotes: [],
    timeline: [],
    signals: {},
    ...result
  };
}

function extractCandidateName(transcript) {
  const match = transcript.match(/candidate\s*name\s*:\s*([a-z\s.'-]+)/i);
  return match ? titleCase(match[1].trim()) : "";
}

function titleCase(value) {
  return value
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
