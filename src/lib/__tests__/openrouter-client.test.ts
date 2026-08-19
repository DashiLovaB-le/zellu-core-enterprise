import { describe, expect, it } from "vitest";
import {
  DEFAULT_FALLBACK_MODELS,
  resolveModelChain,
  trimMessagesForContext,
} from "@/lib/llm/openrouter-client";
import type { LlmConfig } from "@/lib/api/llm-config.server";

const baseConfig: LlmConfig = {
  model: "openai/gpt-4o-mini",
  temperature: 0.7,
  max_tokens: 520,
  system_prompt: "test",
  api_key: "sk-test",
  model_2: "",
  model_3: "",
};

describe("resolveModelChain", () => {
  it("adiciona fallbacks padrão quando model_2/3 estão vazios", () => {
    const chain = resolveModelChain(baseConfig);
    expect(chain[0]).toBe("openai/gpt-4o-mini");
    expect(chain.length).toBeGreaterThanOrEqual(2);
    expect(chain).toContain(DEFAULT_FALLBACK_MODELS[0]);
  });

  it("respeita modelos configurados no banco", () => {
    const chain = resolveModelChain({
      ...baseConfig,
      model_2: "anthropic/claude-3-haiku",
      model_3: "google/gemini-2.0-flash-001",
    });
    expect(chain).toEqual([
      "openai/gpt-4o-mini",
      "anthropic/claude-3-haiku",
      "google/gemini-2.0-flash-001",
    ]);
  });
});

describe("trimMessagesForContext", () => {
  it("preserva system e mantém mensagens recentes", () => {
    const messages = [
      { role: "system" as const, content: "sys".repeat(100) },
      { role: "user" as const, content: "antiga".repeat(2000) },
      { role: "assistant" as const, content: "ok" },
      { role: "user" as const, content: "recente" },
    ];
    const trimmed = trimMessagesForContext(messages, 5000);
    expect(trimmed[0].role).toBe("system");
    expect(trimmed.some((m) => m.content === "recente")).toBe(true);
    expect(trimmed.some((m) => m.content.includes("antiga"))).toBe(false);
  });
});
