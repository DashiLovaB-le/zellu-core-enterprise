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
import {
  COMPANION_JSON_PROTOCOL,
  isCompanionParseFailureMessage,
  parseCompanionAiPayload,
} from "@/lib/companion-agent";
import { buildLocalFallbackReply } from "@/lib/companion-local-fallback";
import { planGoalLabel } from "@/lib/companion-portrait";
import {
  companionContextBlock,
  loadCompanionSnapshot,
  persistCompanionMemory,
  snapshotStreakDays,
  syncAutoCompanionMemories,
} from "@/lib/api/companion-memory.server";
import { getCompanionPromptBlock } from "@/lib/companions/registry";

export interface PreventiveContext {
  hasAlert: boolean;
  alertType?: string;
  alertSeverity?: string;
  alertMessage?: string;
  alertSuggestion?: string;
}

export type ChatReplySource = "llm" | "fallback-llm-error" | "fallback-cloud-disabled";

export type ChatReplyMeta = {
  source: ChatReplySource;
  llmFailed: boolean;
};

const CHAT_RATE_LIMIT_PER_HOUR = 20;

const PERSONALIZATION_RULES = `## Prioridade nesta conversa
- Leia o RETRATO DO MOMENTO antes de responder.
- Soe próximo e atento, como quem acompanha a rotina da pessoa — sem exagerar intimidade.
- Não repita na mesma sessão a pergunta sobre humor/check-in se ela já respondeu.
- Ao usar indicadores, integre-os naturalmente (ex.: "Vi que hoje você registrou humor grato…").`;

function resolvePreferredName(profile: { display_name?: string | null } | null): string {
  const fromProfile = profile?.display_name?.trim();
  if (fromProfile) return fromProfile.split(/\s+/)[0] ?? fromProfile;
  return "você";
}

function logLlmFallback(reason: string, details: Record<string, unknown>) {
  console.warn(`[chat-ai] LLM falhou na resposta — ${reason}`, details);
}

function fallbackMeta(source: ChatReplySource): ChatReplyMeta {
  return { source, llmFailed: source !== "llm" };
}

export const sendChatMessage = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
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
    const auth = await requireCompanionConsent();
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

    const preferredName = resolvePreferredName(profile);
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
      return { reply, suggestion: null, crisis: true, meta: { source: "llm", llmFailed: false } };
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
    const history = selectTrustedChatHistory(data.history, dbHistory, 14);

    let preventiveLine = "- Sem alertas preventivos";
    try {
      const alert = await detectPatterns();
      if (alert && alert.type !== "none") {
        preventiveLine = `- Alerta preventivo (${alert.severity}): ${alert.message}. Sugestão: ${alert.suggestion}`;
      }
    } catch {
      // ignore
    }

    let snapshot = await loadCompanionSnapshot(supabase, userId, preventiveLine);
    await syncAutoCompanionMemories(supabase, userId, snapshot).catch(() => undefined);
    snapshot = await loadCompanionSnapshot(supabase, userId, preventiveLine);

    const streakDays = snapshotStreakDays(snapshot);
    const latest = snapshot.checkins[0];
    const planGoal = planGoalLabel(snapshot);

    const serverContext = selectTrustedChatContext(data.context, {
      sleepHours: latest?.sleepHours ?? undefined,
      sleepLabel: latest?.sleepLabel,
      waterMl: latest?.waterMl ?? undefined,
      mood: latest?.mood,
      userName: preferredName,
      recentCheckin: latest ? `Check-in em ${latest.day}` : undefined,
      preventiveLine,
      planGoal,
    });

    const fallbackContext = {
      ...serverContext,
      greeting: getGreeting(tz),
      preferredName,
      planGoal,
    };

    const config = await getActiveLlmConfig();
    const greeting = getGreeting(tz);
    const companionPrompt = getCompanionPromptBlock(profile?.avatar_url);

    const personaPrompt = `${config.system_prompt}

${companionPrompt}

${PERSONALIZATION_RULES}

Período: ${greeting}
Responda sempre em português brasileiro.
Não peça nome, e-mail ou dados de identificação.
Se a pessoa descrever risco imediato à vida, NÃO aconselhe: oriente CVV 188 e ajuda profissional.

${COMPANION_JSON_PROTOCOL}`;

    const allowCloudAi = Boolean(profile?.privacy_ai_opt_in) && Boolean(config.api_key);

    if (!allowCloudAi) {
      logLlmFallback("IA na nuvem indisponível (opt-in ou API key)", {
        aiOptIn: Boolean(profile?.privacy_ai_opt_in),
        hasApiKey: Boolean(config.api_key),
      });
      void logEvent(
        "info",
        "chat-ai.sendChatMessage",
        "Fallback local (IA na nuvem indisponível)",
        {
          aiOptIn: Boolean(profile?.privacy_ai_opt_in),
          hasApiKey: Boolean(config.api_key),
        },
        userId,
      );
      const reply = buildLocalFallbackReply(
        data.text,
        preferredName,
        fallbackContext,
        history,
      );
      await persistExchange(supabase, userId, data.text, reply);
      return {
        reply,
        suggestion: extractSuggestion(reply),
        crisis: false,
        meta: fallbackMeta("fallback-cloud-disabled"),
      };
    }

    await persistUserMessage(supabase, userId, data.text);

    const messages: ChatMessage[] = [
      { role: "system", content: personaPrompt },
      {
        role: "system",
        content: companionContextBlock(snapshot, { preferredName, streakDays }),
      },
      ...history,
      { role: "user", content: data.text },
    ];

    const result = await callLlmWithFallback(
      messages,
      config,
      "chat-ai.sendChatMessage",
      userId,
      { jsonMode: true },
    );

    if ("error" in result) {
      logLlmFallback(String(result.error), { userId });
      const reply = buildLocalFallbackReply(
        data.text,
        preferredName,
        fallbackContext,
        history,
      );
      void logEvent(
        "warn",
        "chat-ai.sendChatMessage",
        `LLM falhou, usando fallback local: ${result.error}`,
        { error: result.error },
        userId,
      );
      await persistAssistantMessage(supabase, userId, reply);
      return {
        reply,
        suggestion: extractSuggestion(reply),
        crisis: false,
        meta: fallbackMeta("fallback-llm-error"),
      };
    }

    const payload = parseCompanionAiPayload(result.content);

    if (payload.parseFailed && isCompanionParseFailureMessage(payload.message)) {
      logLlmFallback("JSON inválido ou vazio da LLM", {
        userId,
        model: result.model,
        preview: result.content.slice(0, 120),
      });
      const reply = buildLocalFallbackReply(
        data.text,
        preferredName,
        fallbackContext,
        history,
      );
      void logEvent(
        "warn",
        "chat-ai.sendChatMessage",
        "Parse JSON falhou — fallback local",
        { model: result.model },
        userId,
      );
      await persistAssistantMessage(supabase, userId, reply);
      return {
        reply,
        suggestion: extractSuggestion(reply),
        crisis: false,
        meta: fallbackMeta("fallback-llm-error"),
      };
    }

    let reply = payload.message;
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

    if (payload.parseFailed) {
      void logEvent(
        "warn",
        "chat-ai.sendChatMessage",
        "Resposta em texto plano (JSON esperado) — usando conteúdo direto",
        { model: result.model },
        userId,
      );
    }

    await persistAssistantMessage(supabase, userId, reply);
    if (!payload.parseFailed) {
      await persistCompanionMemory(supabase, userId, payload).catch(() => undefined);
    }

    return {
      reply,
      suggestion: payload.suggestion ?? extractSuggestion(reply),
      crisis: false,
      meta: { source: "llm", llmFailed: payload.parseFailed },
    };
  });

async function persistUserMessage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  userText: string,
) {
  try {
    await supabase.from("chat_messages").insert({ user_id: userId, text: userText, from: "user" });
  } catch (err) {
    void logEvent(
      "warn",
      "chat-ai.persistUserMessage",
      "Falha ao persistir mensagem do usuário",
      { error: String(err) },
      userId,
    );
  }
}

async function persistAssistantMessage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  reply: string,
) {
  try {
    await supabase.from("chat_messages").insert({ user_id: userId, text: reply, from: "ai" });
  } catch (err) {
    void logEvent(
      "warn",
      "chat-ai.persistAssistantMessage",
      "Falha ao persistir resposta do companion",
      { error: String(err) },
      userId,
    );
  }
}

async function persistExchange(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  userText: string,
  reply: string,
) {
  await persistUserMessage(supabase, userId, userText);
  await persistAssistantMessage(supabase, userId, reply);
}

export const getContextualGreeting = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      context: z
        .object({
          sleepHours: z.number().optional(),
          sleepLabel: z.string().optional(),
          waterMl: z.number().optional(),
          userName: z.string().optional(),
          mood: z.string().optional(),
        })
        .optional(),
    }),
  )
  .handler(async ({ data }) => {
    const auth = await requireUser();
    if ("error" in auth) return { greeting: getGreeting() };

    const tz = auth.profile?.timezone ?? "America/Sao_Paulo";
    const base = getGreeting(tz);
    const name =
      auth.profile?.display_name?.trim()?.split(/\s+/)[0] ??
      data.context?.userName?.trim()?.split(/\s+/)[0];

    if (!name) return { greeting: base };

    const mood = data.context?.mood;
    if (mood && mood !== "sem dados") {
      return { greeting: `${base}, ${name}` };
    }

    return { greeting: `${base}, ${name}` };
  });

function extractSuggestion(text: string): string | null {
  const lower = text.toLowerCase();
  if (lower.includes("respir") || lower.includes("respiração")) return "respirar";
  if (lower.includes("água") || lower.includes("hidrat")) return "agua";
  if (lower.includes("pausa") || lower.includes("descans")) return "pausa";
  if (lower.includes("along") || lower.includes("movimento") || lower.includes("caminh"))
    return "movimento";
  if (lower.includes("check-in") || lower.includes("checkin")) return "checkin";
  if (lower.includes("plano")) return "plano";
  if (lower.includes("humor") || lower.includes("emoç")) return "humor";
  if (lower.includes("sono") || lower.includes("dorm")) return "sono";
  return null;
}
