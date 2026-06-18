#!/usr/bin/env node
import { getScenario } from "./scenarios.js";
import { resilientEcommerceTopology } from "./presets.js";
import { coachPlayer, reviewArchitecture, runSimulation, scoreArchitecture } from "./simulator.js";
import { runQwenArchitectReviewer } from "./qwen.js";

const printJson = (title: string, value: unknown): void => {
  console.log(`\n## ${title}`);
  console.log(JSON.stringify(value, null, 2));
};

const runDemo = (ticks: number): void => {
  const scenario = getScenario("ecommerce");
  const topology = resilientEcommerceTopology();
  const review = reviewArchitecture(topology, scenario);
  const state = runSimulation(topology, scenario, ticks);
  const score = scoreArchitecture(topology, scenario, state);
  const advice = coachPlayer(review);

  printJson("Scenario", scenario);
  printJson("Architecture Review", review);
  printJson("Simulation Events", state.events);
  printJson("Latest Metrics", state.metrics.at(-1));
  printJson("Score", score);
  printJson("Coach", advice);
};

const runQwenReview = async (): Promise<void> => {
  const scenario = getScenario("ecommerce");
  const topology = resilientEcommerceTopology();
  const result = await runQwenArchitectReviewer(topology, scenario, {
    model: process.env.QWEN_MODEL,
    authType: process.env.QWEN_AUTH_TYPE === "qwen-oauth" ? "qwen-oauth" : "openai",
  });

  printJson("Deterministic Review", result.deterministicReview);
  console.log("\n## Qwen Architect Reviewer");
  console.log(result.qwenSummary);
  if (result.sessionId) {
    console.log(`\nSession: ${result.sessionId}`);
  }
};

const command = process.argv[2] ?? "demo";
const ticks = Number(process.argv[3] ?? 9);

if (command === "demo") {
  runDemo(Number.isFinite(ticks) ? ticks : 9);
} else if (command === "qwen-review") {
  await runQwenReview();
} else {
  console.error(`Unknown command: ${command}`);
  console.error("Usage: npm run demo -- [ticks] | npm run qwen:review");
  process.exitCode = 1;
}
