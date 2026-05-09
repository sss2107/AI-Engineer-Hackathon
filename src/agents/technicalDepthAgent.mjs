import { clamp, includesAny, makeAgentResult } from "../evidence.mjs";

export async function technicalDepthAgent(context) {
  const startedAt = Date.now();
  await Promise.resolve();

  const roleText = `${context.role} ${context.lower}`.toLowerCase();
  const roleSpecificSignals = [
    "data leakage",
    "rollback",
    "idempotent",
    "race condition",
    "schema",
    "latency",
    "throughput",
    "eval",
    "observability",
    "blast radius",
    "security",
    "malformed",
    "edge case"
  ];
  const hasRoleDepth = includesAny(roleText, roleSpecificSignals);
  const mentionsTradeoff = includesAny(context.lower, ["tradeoff", "because", "risk", "residual", "production", "constraint"]);
  const handWavy = includesAny(context.lower, ["should be fine", "probably works", "good enough", "vibe"]);

  const score = clamp(60 + (hasRoleDepth ? 20 : 0) + (mentionsTradeoff ? 12 : 0) - (handWavy ? 16 : 0));

  return makeAgentResult("technical-depth", "Technical Depth Assessor", startedAt, {
    summary: "Looks for role-specific reasoning beyond generic implementation steps.",
    findings: [
      hasRoleDepth
        ? {
            label: "Technical depth",
            tone: "#b9f251",
            severity: "low",
            title: "Showed role-specific awareness rather than generic coding fluency.",
            copy:
              "The evidence includes domain-specific concerns such as edge cases, rollout behavior, leakage, or production risk.",
            evidence: "Role-specific technical signal detected in transcript, diff, or final explanation."
          }
        : {
            label: "Depth gap",
            tone: "#ffd166",
            severity: "medium",
            title: "Reasoning stayed generic for the target role.",
            copy:
              "The candidate evidence does not show much role-specific technical depth beyond implementation mechanics.",
            evidence: "No strong role-specific markers were detected."
          }
    ],
    scores: [["Role-specific depth", score]]
  });
}
