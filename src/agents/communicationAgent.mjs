import { clamp, includesAny, makeAgentResult } from "../evidence.mjs";

export async function communicationAgent(context) {
  const startedAt = Date.now();
  await Promise.resolve();

  const explainsWhy = includesAny(context.lower, ["because", "i chose", "tradeoff", "i'm choosing", "residual risk"]);
  const structured = includesAny(context.lower, ["first", "then", "next", "finally", "plan", "summary"]);
  const admitsUncertainty = includesAny(context.lower, ["i don't know", "need to verify", "assumption", "not sure", "i'll check"]);

  const score = clamp(58 + (explainsWhy ? 16 : 0) + (structured ? 12 : 0) + (admitsUncertainty ? 10 : 0));
  const strength = score >= 88 ? "Excellent" : score >= 74 ? "Strong" : score >= 60 ? "Clear" : "Thin";
  const detail =
    score >= 74
      ? "Explained decisions, tradeoffs, or uncertainty in a way an interviewer can evaluate."
      : "Final reasoning needs more explicit assumptions, tradeoffs, and decision rationale.";

  return makeAgentResult("communication", "Communication Evaluator", startedAt, {
    summary: "Checks whether the candidate made their reasoning inspectable.",
    findings: [
      {
        label: "Communication",
        tone: score >= 74 ? "#55e4b2" : "#ffd166",
        severity: score >= 74 ? "low" : "medium",
        title: score >= 74 ? "Made reasoning easy to inspect." : "Reasoning was not explicit enough.",
        copy: detail,
        evidence: explainsWhy
          ? "Candidate explained at least one why/tradeoff/risk in the transcript or final explanation."
          : "No strong tradeoff explanation was detected."
      }
    ],
    scores: [["Explains tradeoffs", score]],
    signals: {
      communication: [strength, detail]
    }
  });
}
