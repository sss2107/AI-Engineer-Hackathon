import { includesAny, makeAgentResult } from "../evidence.mjs";

export async function deliveryRiskAgent(context) {
  const startedAt = Date.now();
  await Promise.resolve();

  const highRisk = includesAny(context.lower, [
    "not covered",
    "failing",
    "failed",
    "todo",
    "fixme",
    "malformed nested",
    "unknown field",
    "security"
  ]);
  const lowRisk = includesAny(context.lower, [
    "rollback",
    "regression",
    "smoke",
    "verified",
    "compatibility",
    "all tests pass"
  ]);
  const risk = highRisk && !lowRisk ? "High" : highRisk ? "Medium" : lowRisk ? "Low" : "Medium";
  const detail =
    risk === "High"
      ? "Unresolved correctness or security concerns remain in the evidence packet."
      : risk === "Low"
        ? "Evidence includes regression, rollback, or compatibility checks."
        : "Some useful checks exist, but residual risks should be discussed.";

  return makeAgentResult("delivery-risk", "Delivery Risk Assessor", startedAt, {
    summary: "Converts unresolved evidence gaps into interviewer-facing delivery risk.",
    findings: [
      {
        label: "Delivery risk",
        tone: risk === "Low" ? "#55e4b2" : risk === "Medium" ? "#ffd166" : "#ff7769",
        severity: risk === "Low" ? "low" : risk === "Medium" ? "medium" : "high",
        title: `${risk} delivery risk based on the submitted evidence.`,
        copy: detail,
        evidence:
          risk === "Low"
            ? "Regression, rollback, smoke, or compatibility evidence was detected."
            : "The evaluator found unresolved gaps or risk language in the packet."
      }
    ],
    signals: {
      deliveryRisk: [risk, detail]
    }
  });
}
