#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { evaluateCandidate } from "../src/evaluator.mjs";

async function main() {
  const [command, ...args] = process.argv.slice(2);

  if (!command || command === "help" || command === "--help") {
    printHelp();
    return;
  }

  if (command !== "analyze") {
    throw new Error(`Unknown command: ${command}`);
  }

  const options = parseArgs(args);
  let payload = {};

  if (options.evidence) {
    payload = JSON.parse(await readFile(options.evidence, "utf8"));
  } else {
    payload = {
      role: options.role || "SWE Platform",
      mode: options.mode || "AI-assisted build",
      candidate: {
        name: options.name || "CLI Candidate",
        title: options.task || "CLI evidence packet"
      },
      evidence: {
        aiTranscript: options.transcript ? await readFile(options.transcript, "utf8") : "",
        gitDiff: options.diff ? await readFile(options.diff, "utf8") : "",
        testLog: options.tests ? await readFile(options.tests, "utf8") : "",
        commandTrace: options.commands ? await readFile(options.commands, "utf8") : "",
        finalExplanation: options.explanation ? await readFile(options.explanation, "utf8") : ""
      }
    };
  }

  const evaluation = await evaluateCandidate(payload);
  process.stdout.write(`${JSON.stringify(evaluation, null, 2)}\n`);
}

function parseArgs(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    options[key] = args[index + 1];
    index += 1;
  }
  return options;
}

function printHelp() {
  process.stdout.write(`InterviewOS CLI

Usage:
  interviewos analyze --evidence data/demo-evidence.json
  interviewos analyze --transcript transcript.txt --diff diff.patch --tests test.log

Options:
  --evidence      JSON evidence packet
  --transcript    AI chat transcript file
  --diff          Git diff or patch file
  --tests         Test log file
  --commands      Command trace file
  --explanation   Candidate final explanation file
  --role          Role label
  --mode          Interview mode
  --name          Candidate name
  --task          Task title
`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
