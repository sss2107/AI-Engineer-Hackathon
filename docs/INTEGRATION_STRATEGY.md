# InterviewOS Integration Strategy

The hackathon demo should lead with the UI, but the real product should be **API-first**.

## Recommended Shape

Build InterviewOS as:

1. **Hosted REST API** for platforms like HackerRank, LeetCode, CodeSignal, and internal company interview tools.
2. **CLI collector** for local take-homes and live interviews.
3. **MCP server** so AI IDEs, internal copilots, and interview agents can call the evaluator directly.
4. **Open-source SDK/package** for evidence schemas, collectors, and rubric plugins.
5. **Hosted dashboard** for interviewer review, candidate comparison, and hiring packet export.

The UI is the demo and decision surface. The API is the business.

## Why API-First

Large interview platforms will not want to send users to a separate product for the core workflow. They need an integration layer.

An API lets them submit:

- AI transcript
- repo diff
- commit history
- test logs
- terminal command trace
- task metadata
- rubric configuration
- candidate final explanation

InterviewOS returns:

- critical candidate insights
- evidence-backed scorecard
- risk flags
- transcript excerpts
- role-specific evaluation
- interviewer summary
- machine-readable JSON for ATS workflows

## CLI Role

The CLI should be an adapter, not the core product.

Example:

```bash
interviewos collect \
  --repo . \
  --ai-transcript ./transcript.json \
  --test-log ./test.log \
  --out evidence.json

interviewos analyze evidence.json \
  --role swe-platform \
  --mode ai-assisted-build
```

The CLI is useful for:

- take-home assignments
- local interviews
- company-specific repos
- candidates using any AI IDE
- generating a single portable evidence bundle

## Open-Source Package Role

Open-source the parts that increase trust and adoption:

- evidence schema
- CLI collectors
- rubric templates
- redaction helpers
- platform adapters
- sample reports

Keep hosted:

- scoring models
- report generation
- interviewer dashboard
- candidate comparison
- enterprise audit logs
- integrations and admin controls

## Minimal API Sketch

```http
POST /v1/evaluations
Content-Type: application/json
```

```json
{
  "role": "swe-platform",
  "mode": "ai-assisted-build",
  "candidate": {
    "id": "cand_123",
    "name": "Maya Chen"
  },
  "evidence": {
    "ai_transcript": [],
    "git_diff": "...",
    "test_log": "...",
    "command_trace": [],
    "final_explanation": "..."
  },
  "rubric": {
    "weights": {
      "agent_workflow": 0.2,
      "evidence_timing": 0.2,
      "technical_correctness": 0.25,
      "communication": 0.15,
      "delivery_risk": 0.2
    }
  }
}
```

Response:

```json
{
  "recommendation": "next_round_with_probe",
  "confidence": 0.92,
  "critical_insights": [
    {
      "title": "Validated only after the implementation was effectively done",
      "evidence": "Tests were added after parser integration; malformed nested payloads were not covered.",
      "severity": "medium"
    }
  ],
  "signals": {
    "agent_workflow_maturity": "needs_structure",
    "evidence_timing": "late",
    "communication": "strong",
    "delivery_risk": "medium"
  }
}
```

## Product Opinion

Do not choose between CLI, API, MCP, and package.

The right wedge is:

**API-first product, CLI as evidence collector, MCP as AI-agent integration, open-source package as adoption layer.**
