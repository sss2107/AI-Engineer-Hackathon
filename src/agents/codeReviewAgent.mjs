import { clamp, extractLines, includesAny, makeAgentResult } from "../evidence.mjs";

export async function codeReviewAgent(context) {
  const startedAt = Date.now();
  await Promise.resolve();

  const lowerDiff = context.gitDiff.toLowerCase();
  const touchesParser = includesAny(lowerDiff + context.lower, ["parser", "parse", "json", "payload"]);
  const hasFallback = includesAny(lowerDiff + context.lower, ["fallback", "unknown field", "unknown fields"]);
  const hasValidation = includesAny(lowerDiff, ["validate", "schema", "invalid"]);
  const malformedNotCovered = includesAny(context.lower, [
    "malformed nested payloads are not covered",
    "malformed nested payload coverage",
    "malformed payloads are not covered",
    "not covered yet"
  ]);
  const suspiciousDependency = includesAny(context.lower, [
    "stream-safe-parser",
    "nonexistent",
    "does not seem real",
    "doesn't exist"
  ]);
  const hasTodo = includesAny(lowerDiff, ["todo", "fixme"]);

  const score = clamp(72 + (hasValidation ? 10 : 0) + (suspiciousDependency ? 8 : 0) - (hasFallback && malformedNotCovered ? 22 : 0) - (hasFallback && !hasValidation ? 14 : 0) - (hasTodo ? 8 : 0));
  const findings = [];

  if (touchesParser && hasFallback && (malformedNotCovered || !hasValidation)) {
    findings.push({
      label: "Code risk",
      tone: "#ff7769",
      severity: "high",
      title: "Fallback parsing behavior is under-specified.",
      copy:
        "The code/evidence references parser fallback behavior, but the packet does not prove malformed payload handling.",
      evidence:
        extractLines(context.gitDiff || context.transcript, ["fallback", "unknown field", "malformed"], 1)[0] ||
        "Parser fallback was detected without matching validation evidence."
    });
  }

  if (suspiciousDependency) {
    findings.push({
      label: "Dependency judgment",
      tone: "#55e4b2",
      severity: "low",
      title: "Caught a questionable AI-suggested dependency.",
      copy:
        "The candidate noticed a dependency suggestion might be hallucinated or unsuitable and avoided blindly adding it.",
      evidence: extractLines(context.transcript, ["stream-safe-parser", "not real", "dependency"], 1)[0]
    });
  }

  if (!findings.length) {
    findings.push({
      label: "Code review",
      tone: "#55d8ff",
      severity: "low",
      title: "No major code-review risk surfaced from the provided diff.",
      copy:
        "The diff did not expose obvious unsafe dependencies, TODOs, or unvalidated parser behavior.",
      evidence: "Code review agent found no high-severity issue in the submitted evidence."
    });
  }

  return makeAgentResult("code-review", "Code Reviewer", startedAt, {
    summary: "Reviews diff and code-adjacent evidence for concrete implementation risk.",
    findings,
    scores: [["Code judgment", score]]
  });
}
