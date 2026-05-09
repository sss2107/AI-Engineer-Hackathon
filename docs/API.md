# InterviewOS API

InterviewOS is API-first. The UI is the demo surface, while integrations should use the structured API, CLI, or MCP server.

## Evaluate Evidence

```http
POST /api/evaluations
Content-Type: application/json
```

### Request

```json
{
  "role": "SWE Platform",
  "mode": "AI-assisted build",
  "candidate": {
    "id": "cand_123",
    "name": "Maya Chen",
    "title": "Realtime parser"
  },
  "evidence": {
    "aiTranscript": [
      {
        "role": "Candidate",
        "content": "Before I code, I want to clarify expected behavior."
      }
    ],
    "gitDiff": "diff --git ...",
    "testLog": "PASS parser.test.ts",
    "commandTrace": [
      "npm test"
    ],
    "finalExplanation": "I chose a local parser to avoid a questionable dependency."
  }
}
```

### Structured Response

The response is intentionally machine-readable so platforms like HackerRank, LeetCode, CodeSignal, and internal ATS workflows can ingest it directly.

```json
{
  "api_version": "2026-05-09",
  "object": "interviewos.evaluation",
  "evaluation": {
    "id": "eval_123",
    "status": "complete",
    "generated_at": "2026-05-09T00:00:00.000Z",
    "duration_ms": 12,
    "role": "SWE Platform",
    "mode": "AI-assisted build",
    "recommendation": "Next round with probe",
    "confidence": 0.79,
    "input_summary": {
      "candidate_id": "cand_123",
      "candidate_name": "Maya Chen",
      "task_title": "Realtime parser",
      "has_ai_transcript": true,
      "has_git_diff": true,
      "has_test_log": true,
      "has_command_trace": true,
      "has_final_explanation": true,
      "evidence_characters": 1800
    }
  },
  "critical_insights": [
    {
      "id": "insight_1",
      "label": "Code risk",
      "title": "Fallback parsing behavior is under-specified.",
      "summary": "The code/evidence references parser fallback behavior, but the packet does not prove malformed payload handling.",
      "evidence": "+ if (parsed.unknownFields) return fallbackParse(parsed); Source: Code Reviewer.",
      "tone": "#ff7769"
    }
  ],
  "signals": {
    "agent_workflow_maturity": {
      "rating": "Needs structure",
      "explanation": "No clear planner/reviewer/tester workflow or acceptance criteria before delegation."
    },
    "evidence_timing": {
      "rating": "Late",
      "explanation": "Tests appear after implementation was already integrated."
    },
    "communication": {
      "rating": "Strong",
      "explanation": "Explained decisions, tradeoffs, or uncertainty in a way an interviewer can evaluate."
    },
    "delivery_risk": {
      "rating": "Medium",
      "explanation": "Some useful checks exist, but residual risks should be discussed."
    }
  },
  "scorecard": [
    {
      "dimension": "Builds agent workflow",
      "score": 38,
      "scale": 100
    }
  ],
  "evidence_trail": [
    {
      "step": "01",
      "title": "Clarified ambiguous behavior before committing to code.",
      "summary": "The transcript shows the candidate pausing to define expected behavior and constraints before implementation.",
      "tone": "#b9f251"
    }
  ],
  "transcript_excerpts": [
    {
      "speaker": "Candidate",
      "quote": "Before I code, I want to clarify expected behavior."
    }
  ],
  "specialist_reports": [
    {
      "id": "agent-workflow",
      "label": "Agent Workflow Auditor",
      "status": "complete",
      "duration_ms": 2,
      "summary": "Checks whether the candidate can orchestrate AI work instead of dumping broad prompts into the IDE.",
      "finding_count": 1,
      "findings": [],
      "scores": [],
      "signals": {}
    }
  ],
  "integrations": {
    "rest_api": {
      "method": "POST",
      "path": "/api/evaluations"
    },
    "cli": {
      "command": "interviewos analyze --evidence evidence.json"
    },
    "mcp": {
      "server": "node mcp/interviewos-mcp.mjs",
      "tools": [
        "interviewos_evaluate",
        "interviewos_demo_evaluate"
      ]
    }
  }
}
```

## Health Check

```http
GET /api/health
```

## Response Schema

```http
GET /api/schema/evaluation-response
```

## Demo Evidence

```http
GET /api/demo-evidence
```
