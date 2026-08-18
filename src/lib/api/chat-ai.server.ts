import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logEvent } from "@/lib/api/logs.server";
import { getActiveLlmConfig, callLlmWithFallback } from "@/lib/api/llm-config.server";
import type { ChatMessage } from "@/lib/api/llm-config.server";
import { requireCompanionConsent, requireUser } from "@/lib/require-user";
import { detectCrisisLanguage, buildCrisisReply } from "@/lib/crisis";
import { getGreeting } from "@/lib/timezone";
import { selectTrustedChatContext, selectTrustedChatHistory, type ChatTurn } from "@/lib/chat-guard";
import { detectPatterns } from "@/lib/api/preventiva-ai.server";
import { canonicalMood } from "@/data/moods";

export interface PreventiveContext {
  hasAlert: boolean;
  alertType?: string;
  alertSeverity?: string;
  alertMessage?: string;
  alertSuggestion?: string;
}

const CHAT_RATE_LIMIT_PER_HOUR = 20;

export const sendChatMessage = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string().min(1),
      text: z.string().min(1).max(2000),
      history: z
        .array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string(),
          }),
        )
        .optional()
        .default([]),
      context: z
        .object({
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
        })
        .optional()
        .default({}),
    }),
  )
  .handler(async ({ data }) => {
    const auth = await requireCompanionConsent(data.accessToken);
    if ("error" in auth) return { error: auth.error };
    const { userId, supabase, profile } = auth;

    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentCount } = await supabase
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("from", "user")
      .gte("created_at", hourAgo);

    if ((recentCount ?? 0) >= CHAT_RATE_LIMIT_PER_HOUR) {
      void logEvent(
        "warn",
        "chat-ai.sendChatMessage",
        "Rate limit 429",
        { count: recentCount, limit: CHAT_RATE_LIMIT_PER_HOUR },
        userId,
      );
      return { error: "Muitas mensagens nesta hora. Tente novamente em instantes." };
    }

    const name = "você";
    const tz = profile?.timezone ?? "America/Sao_Paulo";

    const { data: company } = profile?.company_id
      ? await supabase
          .from("companies")
          .select("support_channel")
          .eq("id", profile.company_id)
          .maybeSingle()
      : { data: null };

    if (detectCrisisLanguage(data.text)) {
      const reply = buildCrisisReply(undefined, company?.support_channel ?? null);
      await persistExchange(supabase, userId, "[crise — conteúdo não armazenado]", reply);
      return { reply, suggestion: null, crisis: true };
    }

    const { data: dbMessages } = await supabase
      .from("chat_messages")
      .select("from, text, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    const dbHistory: ChatTurn[] = [...(dbMessages ?? [])].reverse().map((m) => ({
      role: m.from === "user" ? "user" : "assistant",
      content: m.text,
    }));
    const history = selectTrustedChatHistory(data.history, dbHistory, 10);

    const { data: latestCheckin } = await supabase
      .from("checkins")
      .select("sleep_hours, sleep_label, water_ml, mood, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let preventiveLine = "- Sem alertas preventivos";
    try {
      const alert = await detectPatterns({ data: { accessToken: data.accessToken } });
      if (alert && alert.type !== "none") {
        preventiveLine = `- Alerta preventivo: ${alert.message}. Sugestão: ${alert.suggestion}`;
      }
    } catch {
      // ignore
    }

    const serverContext = selectTrustedChatContext(data.context, {
      sleepHours: latestCheckin?.sleep_hours,
      sleepLabel: latestCheckin?.sleep_label,
      waterMl: latestCheckin?.water_ml,
      mood: canonicalMood(latestCheckin?.mood) ?? latestCheckin?.mood,
      userName: name,
      recentCheckin: latestCheckin
        ? `Check-in em ${new Date(latestCheckin.created_at).toISOString()}`
        : undefined,
      preventiveLine,
    });

    const config = await getActiveLlmConfig();
    const greeting = getGreeting(tz);

    const systemContent = `${config.system_prompt}

Contexto do usuário (sem identificadores):
- Sono: ${serverContext.sleepLabel ?? "não informado"} (${serverContext.sleepHours ? `${serverContext.sleepHours}h` : "n/d"})
- Água: ${serverContext.waterMl ? `${serverContext.waterMl}ml hoje` : "não informado"}
- Humor: ${serverContext.mood ?? "não informado"}
- Check-in recente: ${serverContext.recentCheckin ?? "não informado"}
${serverContext.preventiveLine}

Período: ${greeting}
Responda sempre em português brasileiro.
Não peça nome, e-mail ou dados de identificação.
Use markdown leve: **negrito** para destaques pontuais, quebras de linha entre ideias e, se útil, uma lista curta com "- ". Nada exagerado.
Se a pessoa descrever risco imediato à vida, NÃO aconselhe: oriente CVV 188 e ajuda profissional.`;

    const allowCloudAi = Boolean(profile?.privacy_ai_opt_in) && Boolean(config.api_key);

    if (!allowCloudAi) {
      const reply = buildLocalFallbackReply(data.text, name, serverContext);
      await persistExchange(supabase, userId, data.text, reply);
      return { reply, suggestion: extractSuggestion(reply), crisis: false };
    }

    const messages: ChatMessage[] = [
      { role: "system", content: systemContent },
      ...history,
      { role: "user", content: data.text },
    ];

    const result = await callLlmWithFallback(messages, config, "chat-ai.sendChatMessage", userId);

    if ("error" in result) {
      const reply = buildLocalFallbackReply(data.text, name, serverContext);
      void logEvent(
        "warn",
        "chat-ai.sendChatMessage",
        `LLM falhou, usando fallback local: ${result.error}`,
        { error: result.error },
        userId,
      );
      await persistExchange(supabase, userId, data.text, reply);
      return { reply, suggestion: extractSuggestion(reply), crisis: false };
    }

    let reply = result.content.trim();
      if (detectCrisisLanguage(reply) && !detectCrisisLanguage(data.text)) {
      reply = buildCrisisReply(undefined, company?.support_channel ?? null);
    }

    if (result.model !== config.model) {
      void logEvent(
        "info",
        "chat-ai.sendChatMessage",
        `Mensagem respondida por fallback: ${result.model}`,
        { primary: config.model, used: result.model },
        userId,
      );
    }

    await persistExchange(supabase, userId, data.text, reply);
    return { reply, suggestion: extractSuggestion(reply), crisis: false };
  });

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
      context: z
        .object({
          sleepHours: z.number().optional(),
          sleepLabel: z.string().optional(),
          waterMl: z.number().optional(),
          userName: z.string().optional(),
        })
        .optional(),
    }),
  )
  .handler(async ({ data }) => {
    const auth = await requireUser(data.accessToken);
    if ("error" in auth) return { greeting: getGreeting() };
    return { greeting: getGreeting(auth.profile?.timezone ?? "America/Sao_Paulo") };
  });

function extractSuggestion(text: string): string | null {
  const lower = text.toLowerCase();
  if (lower.includes("respir") || lower.includes("respiração")) return "respirar";
  if (lower.includes("água") || lower.includes("hidrat")) return "agua";
  if (lower.includes("pausa") || lower.includes("descans")) return "pausa";
  if (lower.includes("along") || lower.includes("movimento") || lower.includes("caminh"))
    return "movimento";
  if (lower.includes("humor") || lower.includes("emoç")) return "humor";
  if (lower.includes("sono") || lower.includes("dorm")) return "sono";
  return null;
}
