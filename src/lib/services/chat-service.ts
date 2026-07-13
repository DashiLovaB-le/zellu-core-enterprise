import type { Msg } from "@/data";
import { INITIAL_MESSAGES } from "@/data";
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
}

export interface AiResponse {
  reply: string;
  suggestion: string | null;
}

export async function loadMessages(accessToken: string | null): Promise<Msg[]> {
  if (!accessToken) return INITIAL_MESSAGES;
  try {
    const serverMsgs = await fetchMessages({ data: { accessToken } });
    if (serverMsgs.length > 0) {
      return serverMsgs.map((m: { from: string; text: string }) => ({
        from: m.from as "ai" | "user",
        text: m.text,
      }));
    }
  } catch {
    // fallback
  }
  return [];
}

export async function loadGreeting(
  accessToken: string,
  context: ChatContext,
): Promise<string> {
  try {
    const result = await getContextualGreeting({ data: { accessToken, context } });
    return result.greeting;
  } catch {
    const name = context.userName ?? "Ana";
    return `Bom dia, ${name}! Que bom ter você aqui hoje.`;
  }
}

export async function sendMessage(
  accessToken: string,
  text: string,
  history: { role: ChatRole; content: string }[],
  context: ChatContext,
): Promise<AiResponse> {
  const result = await sendChatMessage({
    data: {
      accessToken,
      text,
      history,
      context,
    },
  });

  if (result.error) {
    throw new Error(result.error);
  }

  return {
    reply: result.reply,
    suggestion: result.suggestion ?? null,
  };
}
