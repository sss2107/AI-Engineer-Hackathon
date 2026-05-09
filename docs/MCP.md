# InterviewOS MCP Server

InterviewOS includes a dependency-free MCP server that exposes the evaluator to AI tools.

## Run

```bash
node mcp/interviewos-mcp.mjs
```

## Example MCP Client Config

Copy `mcp/config.example.json` and replace the absolute path with your local repo path.

```json
{
  "mcpServers": {
    "interviewos": {
      "command": "node",
      "args": [
        "/Users/sahilsharma/Downloads/AI-engineer-hackathon/mcp/interviewos-mcp.mjs"
      ]
    }
  }
}
```

## Tools

### `interviewos_evaluate`

Runs the full specialist-agent evaluation over an evidence packet.

Input:

```json
{
  "role": "SWE Platform",
  "mode": "AI-assisted build",
  "candidate": {
    "name": "Maya Chen",
    "title": "Realtime parser"
  },
  "evidence": {
    "aiTranscript": "Candidate: Before I code, I want to clarify...",
    "gitDiff": "diff --git ...",
    "testLog": "PASS parser.test.ts",
    "commandTrace": "npm test",
    "finalExplanation": "I chose a local parser..."
  }
}
```

### `interviewos_demo_evaluate`

Runs the evaluator on `data/demo-evidence.json`.

## Protocol Notes

The server uses JSON-RPC 2.0 over stdio and newline-delimited messages. It declares MCP protocol version `2025-11-25` and supports:

- `initialize`
- `notifications/initialized`
- `tools/list`
- `tools/call`
