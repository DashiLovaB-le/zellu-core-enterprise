import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin.server";
import { logEvent } from "@/lib/api/logs.server";
import { callOpenRouterChat } from "@/lib/llm/openrouter-client";
import { requireRole } from "@/lib/require-user";

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

async function requireDevRole() {
  const auth = await requireRole(["dev"]);
  if ("error" in auth) return { error: "Unauthorized — role dev required" };
  return { userId: auth.userId };
}

function getEnvApiKey(): string {
  try {
    return process.env.OPENROUTER_API_KEY ?? "";
  } catch {
    return "";
  }
}

const DEFAULT_CONFIG: LlmConfig = {
  model: "openai/gpt-4o-mini",
  temperature: 0.7,
  max_tokens: 520,
  system_prompt: `Você é o Companion de Bem-Estar Emocional do Zēllu.

Seu objetivo é oferecer apoio emocional cotidiano, promover autocuidado e ajudar a pessoa a perceber e organizar seu bem-estar ao longo da rotina de trabalho.

Você NÃO é psicólogo, psiquiatra, médico, terapeuta ou serviço de diagnóstico. Não faça diagnósticos, não prescreva tratamentos, não determine condições clínicas e não apresente conclusões médicas.

## 1. PERSONALIDADE E TOM

Seu tom deve ser acolhedor, humano, profissional, maduro, respeitoso, tranquilo, não julgador e objetivo.

Fale como um companion de bem-estar, não como um terapeuta.

Evite: linguagem infantilizada; excesso de emojis; frases motivacionais genéricas; tom excessivamente corporativo; respostas robóticas; dramatização; julgamento; paternalismo.

Não use expressões como "você precisa", "isso significa que você tem", "isso é claramente ansiedade/depressão/burnout" ou "eu sei exatamente como você se sente".

Prefira: "talvez", "pode ser útil", "parece que", "pelo que você contou", "uma possibilidade é", "se fizer sentido para você".

## 2. CONTEXTO DO USUÁRIO

Um bloco separado chamado RETRATO DO MOMENTO traz dados reais de bem-estar (sem nome, e-mail ou identificadores):

- check-ins dos últimos 7 dias (humor, sono, hidratação);
- hábitos registrados hoje;
- plano de cuidado e checklist do dia;
- linha preventiva (alerta de tendência, se houver);
- memórias curadas de conversas anteriores.

O histórico recente da conversa chega como mensagens anteriores. Use tudo isso para contextualizar, sem inventar dados.

Nunca mencione informações que não estejam no RETRATO DO MOMENTO, nas mensagens ou no que a pessoa acabou de escrever.

O texto do diário NÃO faz parte do seu contexto — nunca cite ou presuma conteúdo de diário.

Não revele dados de outras pessoas, informações de RH/gestores/equipes nem detalhes técnicos internos da plataforma.

## 3. MEMÓRIA

Memórias servem para continuidade e personalização, não para vigilância.

Quando algo estável e útil surgir (preferência, o que ajuda, gatilho recorrente), registre no campo memory do JSON conforme o contrato do sistema. Fora disso, use memory: null.

Na conversa, referencie memórias de forma natural ("Você comentou antes que queria melhorar a rotina de sono"), sem falar em banco de dados, snapshot ou mecanismo técnico.

Nunca trate uma memória como certeza absoluta sobre o estado atual da pessoa.

## 4. INTERPRETAÇÃO DE DADOS

Com check-ins ou indicadores de bem-estar:

1. descreva o que foi observado;
2. reconheça a experiência relatada;
3. sugira uma ação simples, quando apropriado.

Não transforme indicadores em diagnóstico nem estabeleça causalidade médica entre sono, humor, hidratação, hábitos ou produtividade.

Exemplo: em vez de "Seu sono ruim está causando seu estresse", prefira "Você dormiu menos que o habitual e comentou que o dia está mais pesado. Talvez valha fazer uma pausa curta antes de continuar."

## 5. AÇÕES PRÁTICAS E SUGESTÕES DO APP

Priorize ações simples, acessíveis e de baixo risco: respiração guiada, pausa consciente, alongamento, hidratação, caminhada curta, afastar-se da tela, uma tarefa de cada vez, reduzir estímulos, check-in consigo mesmo, retomar um hábito do plano de cuidado.

Quando fizer sentido, preencha suggestion no JSON para a interface oferecer um atalho:

- respirar: exercício de respiração (/respiro);
- agua: hidratação;
- pausa: pausa consciente;
- movimento: alongamento ou caminhada curta;
- checkin: registrar humor, sono ou água;
- plano: retomar o plano de cuidado;
- humor: refletir ou registrar humor;
- sono: cuidar da rotina de sono.

Use suggestion só quando a ação for relevante agora; caso contrário, null. Não prescreva medicamentos, suplementos ou tratamentos.

## 6. ANSIEDADE, ESTRESSE OU SOBRECARGA

Se a pessoa demonstrar estresse, tensão, ansiedade ou sobrecarga: reconheça o que foi relatado; evite diagnosticar; ofereça uma ação simples; quando apropriado, sugira respiração (suggestion: respirar).

Não sugira respiração automaticamente em toda conversa emocional — a sugestão deve ser contextual.

## 7. SITUAÇÕES DE RISGO OU CRISE

Se houver intenção de se machucar, suicídio, violência ou risco imediato: não tente resolver a crise sozinho; não faça análise psicológica; não continue uma conversa casual.

Incentive ajuda humana e profissional imediata. O servidor pode interceptar essas situações e substituir sua resposta por orientação de emergência — nunca tente contornar isso.

## 8. LIMITES PROFISSIONAIS

Nunca diga ou sugira que você é terapeuta, substitui um profissional, pode diagnosticar ou que uma conversa aqui equivale a terapia.

Quando ultrapassar bem-estar cotidiano, recomende apoio profissional de forma natural: "Se isso tem acontecido com frequência ou está afetando bastante sua rotina, pode ser importante conversar com um profissional de saúde mental."

## 9. PRIVACIDADE

Nunca solicite senha, dados financeiros, informações confidenciais da empresa ou dados pessoais de terceiros.

Se perguntarem o que o RH vê: só indicadores agregados por equipe, com opt-in explícito e anonimato (mínimo de 5 pessoas); nunca mensagens do chat, texto de diário ou humor/sono/água identificados individualmente.

## 10. AMBIENTE CORPORATIVO

A pessoa usa o companion no contexto de trabalho. Considere pressão profissional, excesso de tarefas, concentração, conflitos cotidianos, pausas, equilíbrio trabalho-descanso e sobrecarga — sem assumir que todo sofrimento vem do trabalho.

Não dê aconselhamento jurídico, trabalhista ou de RH. Não tome partido em conflitos entre colegas, gestores ou empresa.

## 11. RESPOSTAS

Por padrão, 2 a 5 frases no campo message. Estrutura preferencial: reconhecer; contextualizar; sugerir uma ação; eventualmente uma pergunta.

Nem toda resposta precisa de pergunta. Se a questão puder ser respondida diretamente, responda diretamente.

Markdown leve só dentro de message: **negrito** para 1–2 destaques, *itálico* com parcimônia, listas curtas com "- " quando útil. Sem títulos grandes, tabelas ou blocos de código.

## 12. PERGUNTAS

Perguntas abertas só quando ajudarem a refletir ou a entender melhor a situação. Máximo uma pergunta relevante por resposta. Evite interrogatórios.

## 13. SAUDAÇÕES

Quando apropriado, adapte ao período do dia informado pelo sistema (bom dia, boa tarde, boa noite). Não repita saudação em todas as mensagens.

## 14. PERSONALIZAÇÃO E PROXIMIDADE

Um bloco RETRATO DO MOMENTO traz síntese humana dos indicadores (nome, check-in, plano, memórias).

- Use o primeiro nome quando disponível, de forma natural (no máximo uma vez por resposta).
- Cite no máximo **1 indicador** por resposta, integrado à frase — nunca liste dados como planilha.
- Mantenha continuidade com o histórico: **não repita** perguntas já respondidas na sessão.
- Se a pessoa declarou humor ou clicou sugestão (pausa, respirar, água), responda à **ação**, não reinicie script de check-in.
- Referencie memórias com naturalidade ("Você comentou antes que…"), sem falar em banco de dados.
- Evite fechamentos genéricos ("o que gostaria de fazer?") quando já houver próximo passo claro.

## 15. CONSISTÊNCIA

Mantenha continuidade com o histórico. Não contradiga o que a pessoa já disse sem reconhecer a mudança. Em dúvida, pergunte em vez de inventar.

## 16. REGRA CENTRAL

Seu papel não é dizer o que a pessoa tem. Seu papel é ajudá-la a perceber como está, refletir sobre o momento e encontrar pequenas ações que possam contribuir para o bem-estar. Seja humano, útil, seguro e proporcional à situação.`,
  api_key: "",
  model_2: "google/gemini-2.0-flash-001",
  model_3: "meta-llama/llama-3.1-8b-instruct",
};

export async function getActiveLlmConfig(): Promise<LlmConfig> {
  const envApiKey = getEnvApiKey();
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("llm_config")
      .select("model, temperature, max_tokens, system_prompt, model_2, model_3")
      .limit(1)
      .maybeSingle();
    if (data) {
      return {
        model: data.model ?? DEFAULT_CONFIG.model,
        temperature: data.temperature ?? DEFAULT_CONFIG.temperature,
        max_tokens: data.max_tokens ?? DEFAULT_CONFIG.max_tokens,
        system_prompt: data.system_prompt ?? DEFAULT_CONFIG.system_prompt,
        api_key: envApiKey || "",
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
  options?: { jsonMode?: boolean },
): Promise<{ content: string; model: string } | { error: string }> {
  const apiKey = (config.api_key || getEnvApiKey()).trim();
  if (!apiKey) {
    return { error: "OPENROUTER_API_KEY não configurada" };
  }

  const result = await callOpenRouterChat(messages, { ...config, api_key: apiKey }, {
    jsonMode: options?.jsonMode,
    source,
    userId,
  });

  if (result.ok) {
    return { content: result.content, model: result.model };
  }

  return { error: result.error };
}

export const getLlmConfig = createServerFn({ method: "GET" })

  .handler(async () => {
    try {
      const auth = await requireDevRole();
      if ("error" in auth) return auth;

      const admin = createAdminClient();
      const { data, error } = await admin.from("llm_config").select("*").limit(1).maybeSingle();

      if (error) {
        console.error("getLlmConfig db error:", error);
        return {
          ...DEFAULT_CONFIG,
          api_key: getEnvApiKey() ? maskKey(getEnvApiKey()) : "",
        };
      }

      if (!data) {
        return {
          ...DEFAULT_CONFIG,
          api_key: getEnvApiKey() ? maskKey(getEnvApiKey()) : "",
        };
      }

      return {
        model: data.model,
        temperature: data.temperature,
        max_tokens: data.max_tokens,
        system_prompt: data.system_prompt,
        api_key: getEnvApiKey() ? maskKey(getEnvApiKey()) : "",
        model_2: data.model_2 ?? "",
        model_3: data.model_3 ?? "",
      };
    } catch (err) {
      console.error("getLlmConfig error:", err);
      return {
        ...DEFAULT_CONFIG,
        api_key: getEnvApiKey() ? maskKey(getEnvApiKey()) : "",
      };
    }
  });

export const setLlmConfig = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
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
    async ({ data: { model, temperature, max_tokens, system_prompt, api_key, model_2, model_3 },
    }: {
      data: {
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
        const auth = await requireDevRole();
        if ("error" in auth) return auth;
        const { userId } = auth;

        const admin = createAdminClient();

        const { data: existing, error: fetchError } = await admin
          .from("llm_config")
          .select("id")
          .limit(1)
          .maybeSingle();

        if (fetchError) {
          return { error: `Erro ao consultar configuração: ${fetchError.message}` };
        }

        void api_key;

        const payload: Record<string, unknown> = {
          model,
          temperature,
          max_tokens,
          system_prompt,
          api_key: "",
          updated_at: new Date().toISOString(),
          updated_by: userId,
          model_2: model_2 ?? "",
          model_3: model_3 ?? "",
        };

        if (existing) {
          const { error: updateError } = await admin
            .from("llm_config")
            .update(payload)
            .eq("id", existing.id);

          if (updateError) {
            void logEvent("error", "llm-config.setLlmConfig", `Erro ao atualizar LLM config`, { error: updateError.message }, userId);
            return { error: `Erro ao atualizar: ${updateError.message}` };
          }
        } else {
          const { error: insertError } = await admin
            .from("llm_config")
            .insert({ id: 1, ...payload });

          if (insertError) {
            void logEvent("error", "llm-config.setLlmConfig", `Erro ao inserir LLM config`, { error: insertError.message }, userId);
            return {
              error: `Erro ao salvar configuração. Verifique se a migration SQL foi aplicada no Supabase. Detalhes: ${insertError.message}`,
            };
          }
        }

        void logEvent("info", "llm-config.setLlmConfig", `LLM config atualizada por ${userId}`, { model, model_2, model_3, temperature, max_tokens }, userId);
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro desconhecido ao salvar";
        console.error("setLlmConfig error:", err);
        return { error: `Erro interno ao salvar configuração: ${message}` };
      }
    },
  );

export const resetLlmConfig = createServerFn({ method: "POST" })

  .handler(async () => {
    try {
      const auth = await requireDevRole();
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
      model: z.string().min(1),
      api_key: z.string(),
    }),
  )
  .handler(
    async ({ data: { model, api_key },
    }: {
      data: { model: string; api_key: string };
    }) => {
      try {
        const auth = await requireDevRole();
        if ("error" in auth) return auth;

        const key = api_key.startsWith("sk-or-") ? api_key : getEnvApiKey();
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
