import { clamp, extractLines, includesAny, makeAgentResult } from "../evidence.mjs";

export async function conversationScannerAgent(context) {
  const startedAt = Date.now();
  await Promise.resolve();

  const clarified = includesAny(context.lower, [
    "clarify",
    "assumption",
    "before i code",
    "before coding",
    "what should happen",
    "expected behavior",
    "fail closed",
    "constraints"
  ]);
  const skepticism = includesAny(context.lower, [
    "not real",
    "does not seem real",
    "verify",
    "checked docs",
    "hallucinated",
    "doesn't exist",
    "avoid the dependency"
  ]);
  const broadDelegation = includesAny(context.lower, [
    "generate the full",
    "build the entire",
    "write the whole",
    "implement everything",
    "full pipeline"
  ]);

  const score = clamp(58 + (clarified ? 22 : 0) + (skepticism ? 16 : 0) - (broadDelegation ? 18 : 0));
  const findings = [];

  if (clarified) {
    findings.push({
      label: "Problem framing",
      tone: "#b9f251",
      severity: "low",
      title: "Clarified ambiguous behavior before committing to code.",
      copy:
        "The transcript shows the candidate pausing to define expected behavior and constraints before implementation.",
      evidence: firstEvidence(context.transcript, ["clarify", "expected", "fail closed", "assumption"])
    });
  } else {
    findings.push({
      label: "Framing gap",
      tone: "#ffd166",
      severity: "medium",
      title: "Moved into implementation without making assumptions explicit.",
      copy:
        "The transcript has little evidence of clarifying questions, success criteria, or constraint-setting before coding.",
      evidence: "No clear assumption or expected-behavior checkpoint was found in the transcript."
    });
  }

  if (skepticism) {
    findings.push({
      label: "AI skepticism",
      tone: "#55e4b2",
      severity: "low",
      title: "Verified AI output instead of accepting it blindly.",
      copy:
        "The candidate challenged at least one AI suggestion and checked whether it was valid before using it.",
      evidence: firstEvidence(context.transcript, ["not real", "checked docs", "verify", "dependency"])
    });
  }

  return makeAgentResult("conversation-scanner", "Conversation History Scanner", startedAt, {
    summary: "Scans AI transcript for framing, skepticism, and passive acceptance patterns.",
    findings,
    scores: [["Clarifies ambiguity", score]],
    quotes: extractLines(context.transcript, ["candidate:", "assistant:"], 5),
    signals: {
      communicationBasis: clarified ? "Explicit assumptions" : "Implicit assumptions"
    }
  });
}

function firstEvidence(text, terms) {
  return extractLines(text, terms, 1)[0] || "Evidence found in transcript.";
}
