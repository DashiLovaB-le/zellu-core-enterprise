import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logEvent } from "@/lib/api/logs.server";
import { getActiveLlmConfig, callLlmWithFallback } from "@/lib/api/llm-config.server";
import type { ChatMessage } from "@/lib/api/llm-config.server";
import { getEmailFromAccessToken, getUserIdFromAccessToken } from "@/lib/auth-token";

export interface PreventiveContext {
  hasAlert: boolean;
  alertType?: string;
  alertSeverity?: string;
  alertMessage?: string;
  alertSuggestion?: string;
}

export const sendChatMessage = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string().min(1),
      text: z.string().min(1).max(2000),
      history: z.array(
        z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        }),
      ),
      context: z.object({
        sleepHours: z.number().optional(),
        sleepLabel: z.string().optional(),
        waterMl: z.number().optional(),
        mood: z.string().optional(),
        userName: z.string().optional(),
        recentCheckin: z.string().optional(),
        preventiveAlert: z
          .object({
            hasAlert: z.boolean(),
            alertType: z.string().optional(),
            alertSeverity: z.string().optional(),
            alertMessage: z.string().optional(),
            alertSuggestion: z.string().optional(),
          })
          .optional(),
      }),
    }),
  )
  .handler(
    async ({
      data,
    }: {
      data: {
        accessToken: string;
        text: string;
        history: { role: "user" | "assistant"; content: string }[];
        context: {
          sleepHours?: number;
          sleepLabel?: string;
          waterMl?: number;
          mood?: string;
          userName?: string;
          recentCheckin?: string;
          preventiveAlert?: PreventiveContext;
        };
      };
    }) => {
      const userId = getUserIdFromAccessToken(data.accessToken);
      if (!userId) return { error: "Unauthorized" };

      const supabase = await createClient(data.accessToken);
      const config = await getActiveLlmConfig();

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", userId)
        .maybeSingle();
      const name =
        profile?.display_name ??
        data.context.userName ??
        getEmailFromAccessToken(data.accessToken)?.split("@")[0] ??
        "Ana";
      const greeting = getGreeting();

      const preventiveLine = data.context.preventiveAlert?.hasAlert
        ? `- Alerta preventivo: ${data.context.preventiveAlert.alertMessage || ""}. Sugestão: ${data.context.preventiveAlert.alertSuggestion || ""}`
        : "- Sem alertas preventivos";

      const systemContent = `${config.system_prompt}

Contexto do usuário:
- Nome: ${name}
- Sono: ${data.context.sleepLabel ?? "não informado"} (${data.context.sleepHours ? `${data.context.sleepHours}h` : "n/d"})
- Água: ${data.context.waterMl ? `${data.context.waterMl}ml hoje` : "não informado"}
- Humor: ${data.context.mood ?? "não informado"}
- Check-in recente: ${data.context.recentCheckin ?? "não informado"}
${preventiveLine}

Período: ${greeting}
Responda sempre em português brasileiro.
Use markdown leve: **negrito** para destaques pontuais, quebras de linha entre ideias e, se útil, uma lista curta com "- ". Nada exagerado.`;

      // Sem API key: fallback local para o chat não quebrar
      if (!config.api_key) {
        void logEvent(
          "error",
          "chat-ai.sendChatMessage",
          "OpenRouter não configurado — sem API key",
          { model: config.model },
          userId,
        );
        const reply = buildLocalFallbackReply(data.text, name, data.context);
        await persistExchange(supabase, userId, data.text, reply);
        return { reply, suggestion: extractSuggestion(reply) };
      }

      const messages: ChatMessage[] = [
        { role: "system", content: systemContent },
        ...data.history.slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        })),
        { role: "user", content: data.text },
      ];

      const result = await callLlmWithFallback(messages, config, "chat-ai.sendChatMessage", userId);

      if ("error" in result) {
        const reply = buildLocalFallbackReply(data.text, name, data.context);
        void logEvent(
          "warn",
          "chat-ai.sendChatMessage",
          `LLM falhou, usando fallback local: ${result.error}`,
          { error: result.error },
          userId,
        );
        await persistExchange(supabase, userId, data.text, reply);
        return { reply, suggestion: extractSuggestion(reply) };
      }

      const reply = result.content.trim();
      const modelUsed = result.model;

      if (modelUsed !== config.model) {
        void logEvent(
          "info",
          "chat-ai.sendChatMessage",
          `Mensagem respondida por fallback: ${modelUsed}`,
          { primary: config.model, used: modelUsed },
          userId,
        );
      }

      await persistExchange(supabase, userId, data.text, reply);

      return { reply, suggestion: extractSuggestion(reply) };
    },
  );

async function persistExchange(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  userText: string,
  reply: string,
) {
  try {
    await supabase.from("chat_messages").insert([
      { user_id: userId, text: userText, from: "user" },
      { user_id: userId, text: reply, from: "ai" },
    ]);
  } catch (err) {
    void logEvent(
      "warn",
      "chat-ai.persistExchange",
      "Falha ao persistir mensagens do chat",
      { error: String(err) },
      userId,
    );
  }
}

function buildLocalFallbackReply(
  text: string,
  name: string,
  context: {
    sleepHours?: number;
    sleepLabel?: string;
    waterMl?: number;
    mood?: string;
  },
): string {
  const lower = text.toLowerCase();
  if (lower.includes("ansios") || lower.includes("preocup") || lower.includes("nervos")) {
    return `${name}, entendo que a **ansiedade** pode pesar.\n\nQue tal uma respiração curta agora?\n- Inspire pelo nariz contando até **4**\n- Segure por **2**\n- Solte pela boca contando até **6**`;
  }
  if (lower.includes("triste") || lower.includes("mal") || lower.includes("baixo")) {
    return `${name}, obrigado por compartilhar como está se sentindo.\n\nMomentos difíceis fazem parte — um passo pequeno, como *beber água* ou *uma caminhada curta*, pode ajudar.`;
  }
  if (lower.includes("sono") || lower.includes("dorm") || lower.includes("cansad")) {
    return context.sleepLabel
      ? `Vi que seu sono foi **${context.sleepLabel.toLowerCase()}**.\n\nSe puder, tente:\n- Reduzir telas antes de dormir\n- Manter um horário mais regular`
      : `${name}, o **cansaço** pede cuidado.\n\nSe possível, priorize uma noite com horário mais estável e uma pausa sem telas antes de dormir.`;
  }
  if (lower.includes("água") || lower.includes("hidrat")) {
    return `Boa ideia cuidar da **hidratação**.\n\nUm copo de água agora já conta — pequenos hábitos sustentam o bem-estar.`;
  }
  if (context.mood) {
    return `${name}, obrigado por compartilhar.\n\nVi que seu humor recente foi **"${context.mood}"**. Estou disponível para ouvir — o que mais está presente para você agora?`;
  }
  return `${name}, obrigado por escrever. Estou disponível para conversar.\n\nPode me contar um pouco mais sobre como está se *sentindo*?`;
}

export const getContextualGreeting = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      context: z.object({
        sleepHours: z.number().optional(),
        sleepLabel: z.string().optional(),
        waterMl: z.number().optional(),
        userName: z.string().optional(),
      }),
    }),
  )
  .handler(
    async ({
      data,
    }: {
      data: {
        accessToken: string;
        context: {
          sleepHours?: number;
          sleepLabel?: string;
          waterMl?: number;
          userName?: string;
        };
      };
    }) => {
      // Saudação leve no carregamento do chat.
      // A regra do produto é: exibir apenas a "saudação" (Bom dia/Boa tarde/Boa noite) e deixá-la limitada por dia no client.
      void data; // params mantidos para compatibilidade da assinatura
      return { greeting: getGreeting() };
    },
  );

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function extractSuggestion(text: string): string | null {
  const lower = text.toLowerCase();
  if (lower.includes("respir") || lower.includes("respiração")) return "respirar";
  if (lower.includes("água") || lower.includes("hidrat")) return "agua";
  if (lower.includes("pausa") || lower.includes("descans")) return "pausa";
  if (lower.includes("along") || lower.includes("movimento") || lower.includes("caminh"))
    return "movimento";
  if (lower.includes("humor") || lower.includes("humor") || lower.includes("emoç")) return "humor";
  if (lower.includes("sono") || lower.includes("dorm")) return "sono";
  return null;
}
