# Prod Survivor — Datacenter Architect Simulator

Prod Survivor is an interactive production-architecture simulator where players design distributed systems, survive incidents, and learn SRE practices.

The product requirements are captured in [`docs/PRD.md`](docs/PRD.md). The repository includes a TypeScript implementation of the core simulation engine described by the PRD: scenarios, topology modeling, architecture review, incident generation, simulation ticks, scoring, coaching output, a runnable CLI demo, and Qwen Code SDK integration for AI architecture review.

## What Is Implemented

- **World model:** regions, availability zones, network latency, storage classes, failure probability, health states, node pools, and monthly cost.
- **Infrastructure components:** frontend, API gateway, backend, workers, cron jobs, databases, caches, messaging, storage, observability, and CDN components.
- **Scenarios:** beginner, intermediate, advanced, and expert scenarios with SLA targets, budgets, requirements, and progression unlocks.
- **Architecture editor data model:** component placement, service dependencies, network links, and replication links.
- **Incident system:** infrastructure, Kubernetes, database, traffic, and human-error incidents with severity, duration, blast radius, and customer impact.
- **Agent workflows:** deterministic architecture reviewer, chaos master, incident commander, and coach functions, plus a real `@qwen-code/sdk` Architect Reviewer integration.
- **Scoring system:** availability, data safety, scalability, observability, cost efficiency, and final score calculation.
- **Monitoring view data:** latency, throughput, error rate, CPU, memory, and replication lag samples are produced on each simulation tick.

## Install

```bash
npm install
```

## Run the Local Simulator

Run the deterministic simulator without external credentials:

```bash
npm run demo
```

Optionally pass the number of simulation ticks:

```bash
npm run demo -- 12
```

The command prints:

1. The selected scenario.
2. Architecture review findings.
3. Incident/event feed.
4. Latest monitoring metrics.
5. Score breakdown.
6. Coach lessons and hints.

## Run the Qwen Code SDK Architect Reviewer

The project now depends on `@qwen-code/sdk` and exposes a Qwen-backed review command:

```bash
npm run qwen:review
```

By default, the SDK uses `authType: "openai"`, so configure the OpenAI-compatible endpoint/model expected by your Qwen Code environment. A typical setup is:

```bash
export OPENAI_API_KEY="your-api-key"
export OPENAI_BASE_URL="https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
export QWEN_MODEL="qwen-max"
npm run qwen:review
```

If you use Qwen OAuth credentials already configured for Qwen Code, run:

```bash
export QWEN_AUTH_TYPE="qwen-oauth"
export QWEN_MODEL="qwen-max"
npm run qwen:review
```

The Qwen command first runs the deterministic architecture review, then sends the scenario, topology, and deterministic findings to Qwen Code SDK so the AI Architect Reviewer can produce human-readable critical issues, recommendations, SLA notes, blast-radius notes, and teaching guidance.

## Development Checks

```bash
npm run typecheck
```

## Programmatic Usage

```ts
import {
  coachPlayer,
  getScenario,
  resilientEcommerceTopology,
  reviewArchitecture,
  runQwenArchitectReviewer,
  runSimulation,
  scoreArchitecture,
} from "./src/index.js";

const scenario = getScenario("ecommerce");
const topology = resilientEcommerceTopology();
const review = reviewArchitecture(topology, scenario);
const state = runSimulation(topology, scenario, 9);
const score = scoreArchitecture(topology, scenario, state);
const advice = coachPlayer(review);
const qwen = await runQwenArchitectReviewer(topology, scenario);

console.log({ review, score, advice, qwen, events: state.events });
```

## How to Extend

- Add more scenarios in `src/scenarios.ts`.
- Add topology presets or generators in `src/presets.ts`.
- Extend deterministic simulator behavior in `src/simulator.ts`.
- Customize the Qwen prompt and SDK options in `src/qwen.ts`.
- Connect the exported functions from `src/index.ts` to a React/React Flow UI.
