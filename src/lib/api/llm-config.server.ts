import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
  api_key: import.meta.env.OPENROUTER_API_KEY ?? "",
};

export const getLlmConfig = createServerFn({ method: "GET" })
  .validator(z.object({ accessToken: z.string() }))
  .handler(async ({ data: { accessToken } }: { data: { accessToken: string } }) => {
    const supabase = await createClient(accessToken);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || user.user_metadata?.role !== "dev") {
      return { error: "Unauthorized — role dev required" };
    }

    const admin = createAdminClient();
    const { data, error } = await admin.from("llm_config").select("*").limit(1).maybeSingle();
    if (error || !data) {
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
  });

export const setLlmConfig = createServerFn({ method: "POST" })
  .validator(
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
      const supabase = await createClient(accessToken);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || user.user_metadata?.role !== "dev") {
        return { error: "Unauthorized — role dev required" };
      }

      const admin = createAdminClient();

      const existing = await admin.from("llm_config").select("id").limit(1).maybeSingle();
      const existingApiKey = existing.data
        ? ((await admin.from("llm_config").select("api_key").eq("id", existing.data.id).single())
            .data?.api_key ?? "")
        : "";

      const resolvedApiKey =
        api_key && !api_key.startsWith("sk-or-") && existingApiKey.startsWith("sk-or-")
          ? existingApiKey
          : api_key;

      const payload = {
        model,
        temperature,
        max_tokens,
        system_prompt,
        api_key: resolvedApiKey,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      };

      if (existing.data) {
        await admin.from("llm_config").update(payload).eq("id", existing.data.id);
      } else {
        await admin.from("llm_config").insert({ id: 1, ...payload });
      }

      return { success: true };
    },
  );

export const resetLlmConfig = createServerFn({ method: "POST" })
  .validator(z.object({ accessToken: z.string() }))
  .handler(async ({ data: { accessToken } }: { data: { accessToken: string } }) => {
    const supabase = await createClient(accessToken);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || user.user_metadata?.role !== "dev") {
      return { error: "Unauthorized — role dev required" };
    }

    const admin = createAdminClient();
    const existing = await admin.from("llm_config").select("id").limit(1).maybeSingle();
    if (existing.data) {
      await admin.from("llm_config").delete().eq("id", existing.data.id);
    }

    return { success: true };
  });

export const testLlmConnection = createServerFn({ method: "POST" })
  .validator(
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
      const supabase = await createClient(accessToken);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || user.user_metadata?.role !== "dev") {
        return { error: "Unauthorized — role dev required" };
      }

      const key = api_key.startsWith("sk-or-") ? api_key : import.meta.env.OPENROUTER_API_KEY;
      if (!key) return { error: "API key não configurada" };

      try {
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
          return { error: `Falha (${response.status}): ${errBody}` };
        }

        return { success: true };
      } catch (err) {
        return { error: `Erro de conexão: ${err}` };
      }
    },
  );

function maskKey(key: string): string {
  if (key.length <= 8) return key;
  return key.slice(0, 4) + "…" + key.slice(-4);
}
