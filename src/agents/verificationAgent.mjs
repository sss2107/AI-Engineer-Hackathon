import { clamp, extractLines, includesAny, makeAgentResult } from "../evidence.mjs";

export async function verificationAgent(context) {
  const startedAt = Date.now();
  await Promise.resolve();

  const hasTests = includesAny(context.lower, ["test", "pytest", "npm test", "regression", "fixture", "coverage"]);
  const lateLanguage = includesAny(context.lower, [
    "then come back and add",
    "after it runs",
    "after implementation",
    "add tests later",
    "wire it first"
  ]);
  const edgeCoverage = includesAny(context.lower, [
    "malformed",
    "edge case",
    "empty",
    "invalid",
    "rollback",
    "leakage",
    "regression"
  ]);
  const failingTests = includesAny(context.testLog.toLowerCase(), ["failed", "failing", "error", "exception"]);

  const score = clamp(48 + (hasTests ? 20 : 0) + (edgeCoverage ? 18 : 0) - (lateLanguage ? 20 : 0) - (failingTests ? 8 : 0));
  const timing = lateLanguage ? "Late" : hasTests ? "Evidence-led" : "Thin";
  const detail = lateLanguage
    ? "Tests appear after implementation was already integrated."
    : hasTests
      ? "Candidate left concrete verification evidence in transcript or logs."
      : "Little test or validation evidence was found.";

  const findings = [];
  if (lateLanguage) {
    findings.push({
      label: "Late proof",
      tone: "#ff7769",
      severity: "high",
      title: "Validated only after the implementation was effectively done.",
      copy:
        "The transcript suggests tests were deferred until after the core implementation path was already wired.",
      evidence: extractLines(context.transcript, ["come back", "after it runs", "wire it first"], 1)[0]
    });
  } else if (!hasTests) {
    findings.push({
      label: "Thin proof",
      tone: "#ffd166",
      severity: "medium",
      title: "No strong verification loop was visible.",
      copy:
        "The evidence packet does not include enough test output, regression cases, or manual validation detail.",
      evidence: "No test run or regression fixture was detected."
    });
  } else {
    findings.push({
      label: "Verification",
      tone: "#b9f251",
      severity: "low",
      title: "Left concrete evidence that the solution was tested.",
      copy:
        "The candidate included test logs or regression cases that tie the final solution back to expected behavior.",
      evidence: extractLines([context.transcript, context.testLog].join("\n"), ["test", "regression", "fixture"], 1)[0]
    });
  }

  return makeAgentResult("verification", "Verification Auditor", startedAt, {
    summary: "Audits when and how the candidate proved correctness.",
    findings,
    scores: [["Proves correctness", score]],
    signals: {
      evidenceTiming: [timing, detail]
    }
  });
}
