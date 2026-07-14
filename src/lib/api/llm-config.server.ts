import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import process from "node:process";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin.server";
import { logEvent } from "@/lib/api/logs.server";

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

const DEFAULT_CONFIG = {
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
};

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
        // Tabela existe mas está vazia — retorna padrão
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
    }),
  )
  .handler(
    async ({
      data: { accessToken, model, temperature, max_tokens, system_prompt, api_key },
    }: {
      data: {
        accessToken: string;
        model: string;
        temperature: number;
        max_tokens: number;
        system_prompt: string;
        api_key: string;
      };
    }) => {
      try {
        const auth = await requireDevRole(accessToken);
        if ("error" in auth) return auth;
        const { user } = auth;

        const admin = createAdminClient();

        // Busca registro existente
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

        // Detecta se a api_key enviada contém caractere de máscara "…"
        // (ex: "sk-o…ee35") — isso significa que o usuário NÃO alterou o campo
        const isMasked = api_key.includes("…");

        let resolvedApiKey: string;
        if (isMasked) {
          // Usuário não alterou a chave — mantém a existente ou usa a do .env
          resolvedApiKey = existingApiKey || envApiKey;
        } else if (api_key && !api_key.startsWith("sk-or-") && existingApiKey.startsWith("sk-or-")) {
          // Caso a chave enviada não seja uma chave OpenRouter válida
          // mas existe uma no banco, mantém a do banco
          resolvedApiKey = existingApiKey;
        } else {
          resolvedApiKey = api_key;
        }

        const payload = {
          model,
          temperature,
          max_tokens,
          system_prompt,
          api_key: resolvedApiKey,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
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
          // Tenta criar a tabela primeiro (caso a migration não tenha sido aplicada)
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

        await logEvent("info", "llm-config.setLlmConfig", `LLM config atualizada por ${user.id}`, { model, temperature, max_tokens }, user.id);
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
