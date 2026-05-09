# Project Memory

This repo is for a hackathon project currently called **InterviewOS**.

## Vision

Build an AI-native interview intelligence platform that evaluates candidates based on both their final code and their engineering process.

The product should inspect the candidate's:

- code
- GitHub repo
- diff
- tests
- terminal behavior
- AI conversation history
- planning notes
- communication
- final explanation

The goal is to help interviewers understand how the candidate thinks, verifies, communicates, and supervises AI tools.

## Core Product Idea

This is an **AI interview harness**, not just an AI code reviewer.

It wraps around existing AI-enabled development workflows and produces evidence-backed candidate insights.

Example target insight:

> Candidate ran tests only after final implementation and did not add coverage for edge cases. They accepted an AI-generated parser without validating malformed input.

## Important Product Principles

- Do not position this as anti-AI or cheating detection.
- Assume candidates are allowed to use Codex, Claude, Copilot, Cursor, Antigravity, and similar tools.
- The key question is: "How well does this person think with AI?"
- UI matters a lot for the hackathon. Avoid a plain dashboard if possible.
- Prefer a polished command-center style experience with timeline replay, evidence cards, scorecards, and candidate comparison.
- Do not build a full IDE for the MVP. Sit around existing IDEs and ingest repo/process artifacts.

## Evaluation Dimensions

- Problem framing
- Structured thinking
- Decomposition
- Technical correctness
- AI tool orchestration
- Prompting and delegation quality
- Verification discipline
- Debugging strategy
- Communication clarity
- Code organization
- Security and reliability awareness
- Role-specific depth for SWE, MLE, DS, and DevOps
- Awareness of vibe-coding risks

## MVP Screens

1. Interview setup
2. Candidate/session intake
3. Session replay timeline
4. Evidence cards
5. Candidate scorecard
6. Candidate comparison

## Hackathon Build Bias

The UI should make the product feel like a modern AI interview command center. The most important "wow" screen is the session replay timeline showing how the candidate moved from prompt to AI interaction to code changes to tests to final submission.

## Current Backend

The repo now includes a dependency-free Node backend:

- `server.mjs` serves the UI and exposes `POST /api/evaluations`
- `src/evaluator.mjs` runs specialist evaluators in parallel
- `src/agents/*` contains role-specific agents
- `data/demo-evidence.json` is the demo packet
- `bin/interviewos.mjs` is a CLI evaluator
- `mcp/interviewos-mcp.mjs` exposes the evaluator as an MCP server
- `docs/API.md` and `docs/MCP.md` describe the structured API and MCP integration surfaces

No API key is needed for the current demo. The architecture is ready to swap deterministic agents for LLM-backed agents later.
