import type { ChatMessage, LlmConfig } from "@/lib/api/llm-config.server";
import { logEvent } from "@/lib/api/logs.server";

export const DEFAULT_PRIMARY_MODEL = "openai/gpt-4o-mini";

/** Modelos estáveis no OpenRouter quando model_2/model_3 não estão configurados no banco. */
export const DEFAULT_FALLBACK_MODELS = [
  "google/gemini-2.0-flash-001",
  "meta-llama/llama-3.1-8b-instruct",
] as const;

export type OpenRouterCallOptions = {
  jsonMode?: boolean;
  source?: string;
  userId?: string;
  /** Timeout da primeira tentativa (ms). */
  primaryTimeoutMs?: number;
  /** Timeout dos fallbacks (ms). */
  fallbackTimeoutMs?: number;
};

export type OpenRouterSuccess = {
  ok: true;
  content: string;
  model: string;
  usedJsonMode: boolean;
  attempt: number;
};

export type OpenRouterFailure = {
  ok: false;
  error: string;
  attempts: number;
};

export type OpenRouterResult = OpenRouterSuccess | OpenRouterFailure;

const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504, 520, 529]);

export function resolveApiKey(config: LlmConfig): string {
  return (config.api_key ?? "").trim();
}

export function resolveModelChain(config: LlmConfig): string[] {
  const fromDb = [config.model, config.model_2, config.model_3]
    .map((m) => m?.trim())
    .filter(Boolean) as string[];

  const chain: string[] = [];
  for (const model of fromDb) {
    if (!chain.includes(model)) chain.push(model);
  }

  for (const fallback of DEFAULT_FALLBACK_MODELS) {
    if (chain.length >= 3) break;
    if (!chain.includes(fallback)) chain.push(fallback);
  }

  return chain.length > 0 ? chain : [DEFAULT_PRIMARY_MODEL, ...DEFAULT_FALLBACK_MODELS];
}

/** Preserva mensagens system; limita histórico user/assistant mais antigo. */
export function trimMessagesForContext(messages: ChatMessage[], maxChars = 28_000): ChatMessage[] {
  const total = messages.reduce((n, m) => n + m.content.length, 0);
  if (total <= maxChars) return messages;

  const system = messages.filter((m) => m.role === "system");
  const dialog = messages.filter((m) => m.role !== "system");
  const systemChars = system.reduce((n, m) => n + m.content.length, 0);
  let budget = maxChars - systemChars;

  const kept: ChatMessage[] = [];
  for (let i = dialog.length - 1; i >= 0; i--) {
    const msg = dialog[i];
    if (msg.content.length <= budget) {
      kept.unshift(msg);
      budget -= msg.content.length;
    } else if (kept.length === 0 && msg.role === "user") {
      kept.unshift({
        ...msg,
        content: msg.content.slice(-Math.max(500, budget)),
      });
      break;
    } else {
      break;
    }
  }

  return [...system, ...kept];
}

async function anonymizedUserTag(userId: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(userId));
  const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  return `mmc_${hex.slice(0, 16)}`;
}

function extractMessageContent(content: unknown): string {
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((part: { text?: string } | string) => (typeof part === "string" ? part : (part?.text ?? "")))
      .join("")
      .trim();
  }
  return "";
}

function buildHeaders(source: string, apiKey: string): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  if (source.startsWith("chat-ai")) {
    headers["HTTP-Referer"] = "https://zellu.app";
    headers["X-Title"] = "Mundo Mental Companion";
  }
  return headers;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function callOpenRouterChat(
  messages: ChatMessage[],
  config: LlmConfig,
  options: OpenRouterCallOptions = {},
): Promise<OpenRouterResult> {
  const apiKey = resolveApiKey(config);
  if (!apiKey) {
    return { ok: false, error: "OPENROUTER_API_KEY não configurada", attempts: 0 };
  }

  const source = options.source ?? "llm";
  const models = resolveModelChain(config);
  const trimmed = trimMessagesForContext(messages);
  const headers = buildHeaders(source, apiKey);
  const userTag = options.userId ? await anonymizedUserTag(options.userId) : undefined;

  let lastError = "Todos os modelos falharam";
  let attempts = 0;

  for (let modelIndex = 0; modelIndex < models.length; modelIndex++) {
    const model = models[modelIndex];
    const timeoutMs =
      modelIndex === 0 ? (options.primaryTimeoutMs ?? 25_000) : (options.fallbackTimeoutMs ?? 18_000);
    const jsonAttempts = options.jsonMode ? [true, false] : [false];

    for (const jsonMode of jsonAttempts) {
      const maxAttempts = 2;
      for (let retry = 0; retry < maxAttempts; retry++) {
        attempts++;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers,
            body: JSON.stringify({
              model,
              messages: trimmed,
              max_tokens: jsonMode || options.jsonMode ? Math.max(config.max_tokens, 720) : config.max_tokens,
              temperature: config.temperature,
              ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
              user: userTag,
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const json = await response.json();
            const text = extractMessageContent(json.choices?.[0]?.message?.content);
            if (text) {
              if (modelIndex > 0 || retry > 0 || (options.jsonMode && !jsonMode)) {
                void logEvent(
                  "info",
                  `${source}.openrouter`,
                  "Fallback/recuperação LLM bem-sucedida",
                  { primary: models[0], used: model, jsonMode, retry, attempt: attempts },
                  options.userId,
                );
              }
              return {
                ok: true,
                content: text,
                model,
                usedJsonMode: jsonMode,
                attempt: attempts,
              };
            }
            lastError = "Resposta vazia da IA";
            break;
          }

          const errBody = await response.text();
          lastError = `HTTP ${response.status}: ${errBody.slice(0, 240)}`;

          if (jsonMode && (response.status === 400 || response.status === 422)) {
            void logEvent(
              "warn",
              `${source}.openrouter`,
              "JSON mode recusado — tentando sem response_format",
              { status: response.status, model },
              options.userId,
            );
            break;
          }

          if (RETRYABLE_STATUSES.has(response.status) && retry < maxAttempts - 1) {
            void logEvent(
              "warn",
              `${source}.openrouter`,
              `Erro recuperável ${response.status} — retry`,
              { model, retry: retry + 1 },
              options.userId,
            );
            await sleep(400 * (retry + 1));
            continue;
          }

          if (response.status === 429 || response.status >= 500) {
            void logEvent(
              "warn",
              `${source}.openrouter`,
              `Modelo ${model} indisponível (${response.status}) — próximo modelo`,
              { status: response.status, model },
              options.userId,
            );
            break;
          }

          void logEvent(
            "error",
            `${source}.openrouter`,
            "Erro não recuperável na LLM",
            { status: response.status, body: errBody.slice(0, 500), model },
            options.userId,
          );
          return { ok: false, error: lastError, attempts };
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") {
            lastError = `Timeout após ${Math.round(timeoutMs / 1000)}s`;
            void logEvent(
              "warn",
              `${source}.openrouter`,
              `Timeout no modelo ${model}`,
              { model, attempt: attempts },
              options.userId,
            );
            break;
          }

          const message = err instanceof Error ? err.message : String(err);
          lastError = `Erro de conexão: ${message}`;
          void logEvent(
            "warn",
            `${source}.openrouter`,
            "Exceção na chamada — tentando próximo modelo",
            { error: message, model },
            options.userId,
          );
          break;
        }
      }
    }
  }

  void logEvent(
    "error",
    `${source}.openrouter`,
    "Todos os modelos falharam",
    { models, lastError, attempts },
    options.userId,
  );

  return { ok: false, error: lastError, attempts };
}
