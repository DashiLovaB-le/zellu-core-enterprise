import type { Msg } from "@/data";
import { getMessages as fetchMessages } from "@/lib/api/chat.server";
import { sendChatMessage, getContextualGreeting } from "@/lib/api/chat-ai.server";

export type ChatRole = "user" | "assistant";

export interface ChatContext {
  sleepHours?: number;
  sleepLabel?: string;
  waterMl?: number;
  mood?: string;
  userName?: string;
  recentCheckin?: string;
  preventiveAlert?: {
    hasAlert: boolean;
    alertType?: string;
    alertSeverity?: string;
    alertMessage?: string;
    alertSuggestion?: string;
  };
}

export interface AiResponse {
  reply: string;
  suggestion: string | null;
}

function toAssistantHistory(
  history: { role: string; content: string }[],
): { role: ChatRole; content: string }[] {
  return history.map((m) => ({
    role: m.role === "assistant" || m.role === "ai" ? "assistant" : "user",
    content: m.content,
  }));
}

export async function loadMessages(accessToken: string | null): Promise<Msg[]> {
  if (!accessToken) return [];
  try {
    const serverMsgs = await fetchMessages({ data: { accessToken } });
    if (serverMsgs.length > 0) {
      return serverMsgs.map((m: { from: string; text: string }) => ({
        from: m.from === "user" ? "user" : "ai",
        text: m.text,
      }));
    }
  } catch {
    // fallback
  }
  return [];
}

export async function loadGreeting(accessToken: string, context: ChatContext): Promise<string> {
  const hour = new Date().getHours();
  const salutation = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  // Cache por dia (evita repetir a saudação ao navegar/recicar a página durante o mesmo dia).
  // Obs: funciona apenas no browser.
  try {
    if (typeof window !== "undefined") {
      const dateKey = new Date().toISOString().split("T")[0];
      const cacheKey = `mmc_greeting:${dateKey}`;
      const cached = window.localStorage.getItem(cacheKey);
      if (cached === "Bom dia" || cached === "Boa tarde" || cached === "Boa noite") return cached;

      const result = await getContextualGreeting({
        data: {
          accessToken,
          context: {
            sleepHours: context.sleepHours,
            sleepLabel: context.sleepLabel,
            waterMl: context.waterMl,
            userName: context.userName,
          },
        },
      });

      const greeting = result.greeting;
      if (greeting === "Bom dia" || greeting === "Boa tarde" || greeting === "Boa noite") {
        window.localStorage.setItem(cacheKey, greeting);
        return greeting;
      }
    }
  } catch {
    // ignore cache errors; fallback abaixo
  }

  // fallback: sempre retorna a saudação do período do dia
  return salutation;
}

export async function sendMessage(
  accessToken: string,
  text: string,
  history: { role: ChatRole | "ai" | "user"; content: string }[],
  context: ChatContext,
): Promise<AiResponse> {
  const result = await sendChatMessage({
    data: {
      accessToken,
      text: text.trim(),
      history: toAssistantHistory(history),
      context,
    },
  });

  if ("error" in result && result.error) {
    throw new Error(result.error);
  }

  const reply = "reply" in result ? result.reply : undefined;
  if (!reply?.trim()) {
    throw new Error("Resposta vazia da IA");
  }

  return {
    reply,
    suggestion: ("suggestion" in result ? result.suggestion : null) ?? null,
  };
}
