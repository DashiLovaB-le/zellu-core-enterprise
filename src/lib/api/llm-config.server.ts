import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import process from "node:process";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin.server";
import { logEvent } from "@/lib/api/logs.server";

export interface LlmConfig {
  model: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
  api_key: string;
  model_2: string;
  model_3: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function requireDevRole(
  accessToken: string,
): Promise<{ user: import("@supabase/supabase-js").User } | { error: string }> {
  const supabase = await createClient(accessToken);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "dev") {
    return { error: "Unauthorized — role dev required" };
  }

  return { user };
}

const DEFAULT_CONFIG: LlmConfig = {
  model: "openai/gpt-4o-mini",
  temperature: 0.7,
  max_tokens: 300,
  system_prompt: `Você é um assistente de bem-estar emocional corporativo. Seu tom é acolhedor, profissional e maduro — nunca infantil.

Diretrizes:
- Use linguagem calorosa porém profissional, como um coach de bem-estar.
- Referencie dados do usuário (sono, hidratação, humor) de forma natural.
- Sugira ações práticas: respiração, pausa, alongamento, hidratação.
- Mantenha respostas concisas (2-4 frases).
- Nunca finja ser um terapeuta ou médico. Se algo parecer grave, sugira buscar apoio profissional.
- Se o usuário parecer ansioso ou estressado, sugira o exercício de respiração.
- Use occasionalmente uma pergunta ao final para manter o diálogo.
- Varie as saudações conforme o período do dia (bom dia, boa tarde, boa noite).`,
  api_key: process.env.OPENROUTER_API_KEY ?? "",
  model_2: "",
  model_3: "",
};

export async function getActiveLlmConfig(accessToken?: string): Promise<LlmConfig> {
  const envApiKey = process.env.OPENROUTER_API_KEY;
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("llm_config").select("*").limit(1).maybeSingle();
    if (data) {
      return {
        model: data.model ?? DEFAULT_CONFIG.model,
        temperature: data.temperature ?? DEFAULT_CONFIG.temperature,
        max_tokens: data.max_tokens ?? DEFAULT_CONFIG.max_tokens,
        system_prompt: data.system_prompt ?? DEFAULT_CONFIG.system_prompt,
        api_key: data.api_key || envApiKey || "",
        model_2: data.model_2 ?? "",
        model_3: data.model_3 ?? "",
      };
    }
  } catch {
    // fall through to defaults
  }
  return { ...DEFAULT_CONFIG, api_key: DEFAULT_CONFIG.api_key || envApiKey || "" };
}

export async function callLlmWithFallback(
  messages: ChatMessage[],
  config: LlmConfig,
  source: string,
  userId?: string,
): Promise<{ content: string; model: string } | { error: string }> {
  const models = [config.model, config.model_2, config.model_3].filter(Boolean);

  if (models.length === 0) {
    return { error: "Nenhum modelo configurado" };
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.api_key}`,
    "Content-Type": "application/json",
  };
  if (source.startsWith("chat-ai")) {
    headers["HTTP-Referer"] = "https://zellu.app";
    headers["X-Title"] = "Mundo Mental Companion";
  }

  let lastError: string | null = null;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), i === 0 ? 15_000 : 10_000);

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          messages,
          max_tokens: config.max_tokens,
          temperature: config.temperature,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        const content = json.choices?.[0]?.message?.content;
        if (content) {
          if (i > 0) {
            await logEvent("info", `${source}.fallback`, `Fallback funcionou: ${model} (tentativa ${i + 1})`, { primary: models[0], used: model }, userId);
          }
          return { content, model };
        }
        lastError = "Resposta vazia da IA";
      } else if (response.status === 429 || response.status >= 500) {
        const errBody = await response.text();
        lastError = `HTTP ${response.status}: ${errBody.slice(0, 200)}`;
        await logEvent("warn", `${source}.fallback`, `Model ${model} falhou (${response.status}), tentando próximo`, { status: response.status, model, attempt: i + 1 }, userId);
      } else {
        const errBody = await response.text();
        await logEvent("error", `${source}.fallback`, `Erro não recuperável no model ${model}`, { status: response.status, body: errBody.slice(0, 500), model }, userId);
        return { error: `Erro na LLM (${response.status}): ${errBody.slice(0, 200)}` };
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        lastError = `Timeout após ${i === 0 ? 15 : 10}s`;
        await logEvent("warn", `${source}.fallback`, `Timeout no model ${model}, tentando próximo`, { model, attempt: i + 1 }, userId);
      } else {
        const message = err instanceof Error ? err.message : String(err);
        await logEvent("error", `${source}.fallback`, `Exceção no model ${model}`, { error: message, model }, userId);
        return { error: `Erro de conexão com a IA: ${message}` };
      }
    }
  }

  await logEvent("error", `${source}.fallback`, `Todos os modelos falharam`, { models, lastError }, userId);
  return { error: lastError || "Todos os modelos falharam" };
}

export const getLlmConfig = createServerFn({ method: "GET" })
  .inputValidator(z.object({ accessToken: z.string() }))
  .handler(async ({ data: { accessToken } }: { data: { accessToken: string } }) => {
    try {
      const auth = await requireDevRole(accessToken);
      if ("error" in auth) return auth;

      const admin = createAdminClient();
      const { data, error } = await admin.from("llm_config").select("*").limit(1).maybeSingle();

      if (error) {
        console.error("getLlmConfig db error:", error);
        return {
          ...DEFAULT_CONFIG,
          api_key: DEFAULT_CONFIG.api_key ? maskKey(DEFAULT_CONFIG.api_key) : "",
        };
      }

      if (!data) {
        return {
          ...DEFAULT_CONFIG,
          api_key: DEFAULT_CONFIG.api_key ? maskKey(DEFAULT_CONFIG.api_key) : "",
        };
      }

      return {
        model: data.model,
        temperature: data.temperature,
        max_tokens: data.max_tokens,
        system_prompt: data.system_prompt,
        api_key: data.api_key ? maskKey(data.api_key) : "",
        model_2: data.model_2 ?? "",
        model_3: data.model_3 ?? "",
      };
    } catch (err) {
      console.error("getLlmConfig error:", err);
      return {
        ...DEFAULT_CONFIG,
        api_key: DEFAULT_CONFIG.api_key ? maskKey(DEFAULT_CONFIG.api_key) : "",
      };
    }
  });

export const setLlmConfig = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      model: z.string().min(1),
      temperature: z.number().min(0).max(2),
      max_tokens: z.number().int().min(1).max(8192),
      system_prompt: z.string(),
      api_key: z.string(),
      model_2: z.string().optional(),
      model_3: z.string().optional(),
    }),
  )
  .handler(
    async ({
      data: { accessToken, model, temperature, max_tokens, system_prompt, api_key, model_2, model_3 },
    }: {
      data: {
        accessToken: string;
        model: string;
        temperature: number;
        max_tokens: number;
        system_prompt: string;
        api_key: string;
        model_2?: string;
        model_3?: string;
      };
    }) => {
      try {
        const auth = await requireDevRole(accessToken);
        if ("error" in auth) return auth;
        const { user } = auth;

        const admin = createAdminClient();

        const { data: existing, error: fetchError } = await admin
          .from("llm_config")
          .select("id, api_key")
          .limit(1)
          .maybeSingle();

        if (fetchError) {
          return { error: `Erro ao consultar configuração: ${fetchError.message}` };
        }

        const existingApiKey = existing?.api_key ?? "";
        const envApiKey = process.env.OPENROUTER_API_KEY ?? "";

        const isMasked = api_key.includes("…");

        let resolvedApiKey: string;
        if (isMasked) {
          resolvedApiKey = existingApiKey || envApiKey;
        } else if (api_key && !api_key.startsWith("sk-or-") && existingApiKey.startsWith("sk-or-")) {
          resolvedApiKey = existingApiKey;
        } else {
          resolvedApiKey = api_key;
        }

        const payload: Record<string, unknown> = {
          model,
          temperature,
          max_tokens,
          system_prompt,
          api_key: resolvedApiKey,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
          model_2: model_2 ?? "",
          model_3: model_3 ?? "",
        };

        if (existing) {
          const { error: updateError } = await admin
            .from("llm_config")
            .update(payload)
            .eq("id", existing.id);

          if (updateError) {
            await logEvent("error", "llm-config.setLlmConfig", `Erro ao atualizar LLM config`, { error: updateError.message }, user.id);
            return { error: `Erro ao atualizar: ${updateError.message}` };
          }
        } else {
          const { error: insertError } = await admin
            .from("llm_config")
            .insert({ id: 1, ...payload });

          if (insertError) {
            await logEvent("error", "llm-config.setLlmConfig", `Erro ao inserir LLM config`, { error: insertError.message }, user.id);
            return {
              error: `Erro ao salvar configuração. Verifique se a migration SQL foi aplicada no Supabase. Detalhes: ${insertError.message}`,
            };
          }
        }

        await logEvent("info", "llm-config.setLlmConfig", `LLM config atualizada por ${user.id}`, { model, model_2, model_3, temperature, max_tokens }, user.id);
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro desconhecido ao salvar";
        console.error("setLlmConfig error:", err);
        return { error: `Erro interno ao salvar configuração: ${message}` };
      }
    },
  );

export const resetLlmConfig = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string() }))
  .handler(async ({ data: { accessToken } }: { data: { accessToken: string } }) => {
    try {
      const auth = await requireDevRole(accessToken);
      if ("error" in auth) return auth;

      const admin = createAdminClient();
      const { data: existing, error: fetchError } = await admin
        .from("llm_config")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        await logEvent("error", "llm-config.resetLlmConfig", `Erro ao consultar config para reset`, { error: fetchError.message });
        return { error: `Erro ao consultar: ${fetchError.message}` };
      }

      if (existing) {
        const { error: deleteError } = await admin
          .from("llm_config")
          .delete()
          .eq("id", existing.id);

        if (deleteError) {
          await logEvent("error", "llm-config.resetLlmConfig", `Erro ao deletar LLM config`, { error: deleteError.message });
          return { error: `Erro ao resetar: ${deleteError.message}` };
        }
      }

      await logEvent("info", "llm-config.resetLlmConfig", `LLM config resetada para padrão`);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      console.error("resetLlmConfig error:", err);
      await logEvent("error", "llm-config.resetLlmConfig", `Exceção ao resetar config`, { error: message });
      return { error: `Erro interno: ${message}` };
    }
  });

export const testLlmConnection = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      model: z.string().min(1),
      api_key: z.string(),
    }),
  )
  .handler(
    async ({
      data: { accessToken, model, api_key },
    }: {
      data: { accessToken: string; model: string; api_key: string };
    }) => {
      try {
        const auth = await requireDevRole(accessToken);
        if ("error" in auth) return auth;

        const key = api_key.startsWith("sk-or-") ? api_key : (process.env.OPENROUTER_API_KEY ?? "");
        if (!key) {
          await logEvent("warn", "llm-config.testLlmConnection", `Teste de conexão falhou: API key não configurada`);
          return { error: "API key não configurada" };
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: "Responda apenas: OK" }],
            max_tokens: 10,
          }),
        });

        if (!response.ok) {
          const errBody = await response.text();
          await logEvent("error", "llm-config.testLlmConnection", `Teste de conexão falhou: ${response.status}`, { status: response.status, body: errBody });
          return { error: `Falha (${response.status}): ${errBody}` };
        }

        await logEvent("info", "llm-config.testLlmConnection", `Teste de conexão OK: ${model}`);
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await logEvent("error", "llm-config.testLlmConnection", `Exceção no teste de conexão`, { error: message });
        return { error: `Erro de conexão: ${message}` };
      }
    },
  );

function maskKey(key: string): string {
  if (key.length <= 8) return key;
  return key.slice(0, 4) + "…" + key.slice(-4);
}
