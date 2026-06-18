import { isSDKResultMessage, query } from "@qwen-code/sdk";
import type { ArchitectureReview, ArchitectureTopology, Scenario } from "./domain.js";
import { reviewArchitecture } from "./simulator.js";

export interface QwenAgentOptions {
  cwd?: string;
  model?: string;
  authType?: "openai" | "qwen-oauth";
  maxTurns?: number;
}

export interface QwenAgentResult {
  deterministicReview: ArchitectureReview;
  qwenSummary: string;
  sessionId?: string;
}

const buildArchitectPrompt = (topology: ArchitectureTopology, scenario: Scenario, deterministicReview: ArchitectureReview): string => `
You are the Architect Reviewer agent for Prod Survivor — Datacenter Architect Simulator.

Scenario:
${JSON.stringify(scenario, null, 2)}

Topology:
${JSON.stringify(topology, null, 2)}

Deterministic engine review:
${JSON.stringify(deterministicReview, null, 2)}

Return a concise production architecture review with these sections:
- Critical Issues
- Warnings
- Recommendations
- SLA Prediction
- Estimated Blast Radius
- Teaching Notes
`;

export const runQwenArchitectReviewer = async (
  topology: ArchitectureTopology,
  scenario: Scenario,
  options: QwenAgentOptions = {},
): Promise<QwenAgentResult> => {
  const deterministicReview = reviewArchitecture(topology, scenario);
  const result = query({
    prompt: buildArchitectPrompt(topology, scenario, deterministicReview),
    options: {
      cwd: options.cwd ?? process.cwd(),
      model: options.model ?? process.env.QWEN_MODEL,
      authType: options.authType ?? "openai",
      permissionMode: "plan",
      maxSessionTurns: options.maxTurns ?? 1,
      systemPrompt: {
        type: "preset",
        preset: "qwen_code",
        append: "You review infrastructure simulator topologies. Do not edit files. Be specific and actionable.",
      },
    },
  });

  let qwenSummary = "";
  let sessionId: string | undefined;
  try {
    for await (const message of result) {
      sessionId = message.session_id;
      if (isSDKResultMessage(message) && !message.is_error) {
        qwenSummary = message.result;
      }
      if (isSDKResultMessage(message) && message.is_error) {
        qwenSummary = `Qwen SDK error: ${message.error?.message ?? message.subtype}`;
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    qwenSummary = `Qwen SDK could not complete the review. Check credentials and Qwen Code configuration. Details: ${message}`;
  } finally {
    await result.close();
  }

  return {
    deterministicReview,
    qwenSummary: qwenSummary || "Qwen SDK returned no text result.",
    sessionId,
  };
};
