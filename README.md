# AI Engineer Hackathon

Working name: **InterviewOS**

InterviewOS is an AI-native interview intelligence platform. It evaluates not only the code a candidate ships, but also how they think, communicate, verify, and collaborate with AI tools while building it.

## Core Thesis

The software engineering interview has changed.

Candidates now have access to Codex, Claude, Copilot, Cursor, Antigravity, and other AI-enabled development environments. The differentiator is no longer just whether someone can write code from memory. The real signal is whether they can:

- frame ambiguous problems clearly
- decompose work into executable steps
- use AI tools with judgment
- verify generated code instead of trusting it blindly
- communicate tradeoffs and decisions
- organize a codebase cleanly
- debug methodically
- understand security, reliability, and production risks

InterviewOS turns this into a measurable interview experience.

## Product Definition

InterviewOS is best thought of as an **AI interview harness**.

It wraps around the modern interview workflow, captures evidence from the candidate's process, and produces structured insights for interviewers. It is not just a coding platform and not just an AI code reviewer. It is a process intelligence layer for AI-era technical hiring.

InterviewOS is available through three integration surfaces:

- **REST API**: `POST /api/evaluations`
- **CLI**: `interviewos analyze --evidence evidence.json`
- **MCP server**: `interviewos_evaluate` and `interviewos_demo_evaluate`

The platform can ingest signals such as:

- final GitHub repository
- code diff
- commit history
- test runs
- terminal commands
- AI conversation history
- candidate notes
- interviewer observations
- final explanation or demo transcript

Then it produces evidence-backed insights like:

> Candidate ran tests only after final implementation and did not add coverage for edge cases. They accepted an AI-generated parser without validating malformed input.

## What The Platform Evaluates

- Problem framing
- Structured thinking
- Technical correctness
- AI tool orchestration
- Prompting and delegation quality
- Verification discipline
- Debugging strategy
- Communication clarity
- Code organization
- Security and reliability awareness
- Role-specific depth for SWE, MLE, DS, and DevOps roles
- Awareness of "vibe coding" risks and good AI supervision habits

## Hackathon MVP

The MVP should feel more like a **modern AI interview command center** than a plain dashboard.

## Local Demo

Run the backend:

```bash
npm start
```

Then visit `http://localhost:5173`.

You can also run the CLI evaluator:

```bash
npm run analyze:demo
```

The UI calls the backend at `POST /api/evaluations`. The backend runs specialist evaluators in parallel and returns a structured candidate readout.

Run the MCP server:

```bash
npm run mcp
```

Integration docs:

- `docs/API.md`
- `docs/MCP.md`
- `docs/AGENT_ARCHITECTURE.md`

Suggested flow:

1. Interviewer creates an interview using a role, task, rubric, and allowed AI tools.
2. Candidate completes the task using their AI-enabled IDE and submits a GitHub repo plus optional AI chat transcript.
3. Platform analyzes the repo, diff, tests, structure, and conversation history.
4. Platform generates a process intelligence report.
5. Interviewer reviews evidence cards, timeline, scores, and candidate comparison.

## Key Screens

### 1. Interview Setup

Create an interview harness for a role.

Inputs:

- role: SWE, MLE, DS, DevOps
- interview mode: build, debug, AI-review, system design, agent orchestration
- task brief
- allowed tools
- evaluation rubric
- scoring weights

### 2. Candidate Session Replay

A timeline view of how the candidate worked.

Signals:

- planning notes
- AI prompts
- file changes
- command runs
- test failures and fixes
- commits
- final submission

This should be the visual "wow" screen. It helps interviewers see the candidate's thinking process, not just the end state.

### 3. Evidence Cards

AI-generated, evidence-backed observations.

Examples:

- Strong problem framing: candidate clarified API behavior before coding.
- Weak verification: candidate accepted generated parsing logic without malformed-input tests.
- Good AI supervision: candidate rejected an incorrect AI suggestion and explained why.
- Risk: candidate introduced a dependency without checking maintenance or security concerns.

### 4. Candidate Scorecard

A structured evaluation across dimensions:

- Problem framing
- Decomposition
- Technical correctness
- AI tool use
- Verification discipline
- Debugging
- Communication
- Code quality
- Security awareness
- Delivery judgment

Each score should include supporting evidence, not just a number.

### 5. Candidate Comparison

A hiring team view that compares candidates across the same interview harness.

This should surface differences like:

- Candidate A shipped faster but verified less.
- Candidate B used AI heavily but supervised it well.
- Candidate C wrote less code but had stronger architecture judgment.

## Interview Modes

### Build Task

Candidate implements a feature or small product.

Best for evaluating decomposition, execution, and delivery quality.

### Debug Task

Candidate receives a broken codebase.

Best for evaluating root-cause analysis and debugging discipline.

### AI Review Task

Candidate reviews AI-generated code with subtle flaws.

Best for evaluating skepticism, technical depth, and safety awareness.

### System Design With AI

Candidate can use AI to generate options, but must defend their final architecture.

Best for evaluating tradeoffs and seniority.

### Agent Orchestration Task

Candidate may use multiple AI agents, skills, or tools.

Best for evaluating AI-native engineering workflow.

## Positioning

InterviewOS is not anti-AI and not a cheating detector.

It assumes candidates will use AI and asks the better question:

**How well does this person think with AI?**

## Possible Taglines

- The interview platform for the AI-native engineering era.
- Evaluate the engineer, not just the code.
- See how candidates think, verify, and ship with AI.
- A technical interview harness for modern AI-assisted development.

## Build Priorities

For the hackathon, prioritize:

1. A polished, interactive UI with a strong command-center feel.
2. Mock or real ingestion of GitHub repo data, diff, test logs, and AI transcript.
3. API, CLI, and MCP distribution cards that make the product feel integration-ready.
4. AI-generated evidence cards and structured candidate reports.
5. A timeline replay that makes the candidate process visible.
6. A comparison page that helps interviewers make better decisions.

Avoid spending too much time building a full IDE. The platform should sit around existing AI IDEs rather than replace them.
