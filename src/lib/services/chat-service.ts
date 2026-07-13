import type { Msg } from "@/data";
import { INITIAL_MESSAGES, AI_RESPONSE } from "@/data";
import { getMessages as fetchMessages, sendMessage as postMessage } from "@/lib/api/chat.server";

export async function loadMessages(accessToken: string | null): Promise<Msg[]> {
  if (!accessToken) return INITIAL_MESSAGES;
  try {
    const serverMsgs = await fetchMessages({ data: { accessToken } });
    if (serverMsgs.length > 0) {
      return serverMsgs.map((m: { from: string; text: string }) => ({ from: m.from as "ai" | "user", text: m.text }));
    }
  } catch {
    // fallback to mock
  }
  return INITIAL_MESSAGES;
}

export async function saveMessage(
  accessToken: string | null,
  text: string,
): Promise<void> {
  if (!accessToken) return;
  try {
    await postMessage({ data: { accessToken, text } });
  } catch {
    // silent fallback
  }
}

export function getMockResponse(): string {
  return AI_RESPONSE;
}
