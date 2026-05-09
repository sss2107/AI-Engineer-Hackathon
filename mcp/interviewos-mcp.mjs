#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { evaluateCandidate } from "../src/evaluator.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

let inputBuffer = "";

process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  inputBuffer += chunk;
  drainInput();
});

function drainInput() {
  let newlineIndex = inputBuffer.indexOf("\n");
  while (newlineIndex !== -1) {
    const raw = inputBuffer.slice(0, newlineIndex).trim();
    inputBuffer = inputBuffer.slice(newlineIndex + 1);
    if (raw) {
      handleMessage(raw).catch((error) => {
        sendError(null, -32603, error instanceof Error ? error.message : String(error));
      });
    }
    newlineIndex = inputBuffer.indexOf("\n");
  }
}

async function handleMessage(raw) {
  const message = JSON.parse(raw);

  if (message.method === "initialize") {
    sendResult(message.id, {
      protocolVersion: "2025-11-25",
      capabilities: {
        tools: {}
      },
      serverInfo: {
        name: "interviewos",
        version: "0.1.0"
      }
    });
    return;
  }

  if (message.method === "notifications/initialized") {
    return;
  }

  if (message.method === "tools/list") {
    sendResult(message.id, {
      tools: [
        {
          name: "interviewos_evaluate",
          title: "Evaluate AI-native interview evidence",
          description:
            "Runs InterviewOS specialist agents over an evidence packet and returns structured candidate insights.",
          inputSchema: evidenceInputSchema()
        },
        {
          name: "interviewos_demo_evaluate",
          title: "Evaluate the bundled demo packet",
          description:
            "Runs InterviewOS on data/demo-evidence.json so clients can verify the MCP server immediately.",
          inputSchema: {
            type: "object",
            additionalProperties: false,
            properties: {}
          }
        }
      ]
    });
    return;
  }

  if (message.method === "tools/call") {
    const { name, arguments: args = {} } = message.params || {};
    if (name === "interviewos_evaluate") {
      const evaluation = await evaluateCandidate(args);
      sendToolResult(message.id, evaluation);
      return;
    }
    if (name === "interviewos_demo_evaluate") {
      const demo = JSON.parse(await readFile(join(root, "data/demo-evidence.json"), "utf8"));
      const evaluation = await evaluateCandidate(demo);
      sendToolResult(message.id, evaluation);
      return;
    }
    sendError(message.id, -32602, `Unknown tool: ${name}`);
    return;
  }

  sendError(message.id, -32601, `Unsupported MCP method: ${message.method}`);
}

function evidenceInputSchema() {
  return {
    type: "object",
    additionalProperties: true,
    properties: {
      role: {
        type: "string",
        description: "Role being evaluated, for example SWE Platform, MLE Systems, Data Science, or DevOps Reliability."
      },
      mode: {
        type: "string",
        description: "Interview mode, for example AI-assisted build, debugging investigation, or agent orchestration."
      },
      candidate: {
        type: "object",
        additionalProperties: true,
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          title: { type: "string" }
        }
      },
      evidence: {
        type: "object",
        additionalProperties: true,
        properties: {
          aiTranscript: {
            oneOf: [
              { type: "string" },
              {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: true
                }
              }
            ]
          },
          gitDiff: { type: "string" },
          testLog: { type: "string" },
          commandTrace: {
            oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }]
          },
          finalExplanation: { type: "string" }
        }
      }
    }
  };
}

function sendToolResult(id, evaluation) {
  sendResult(id, {
    content: [
      {
        type: "text",
        text: JSON.stringify(evaluation, null, 2)
      }
    ],
    structuredContent: evaluation
  });
}

function sendResult(id, result) {
  write({
    jsonrpc: "2.0",
    id,
    result
  });
}

function sendError(id, code, message) {
  write({
    jsonrpc: "2.0",
    id,
    error: {
      code,
      message
    }
  });
}

function write(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}
