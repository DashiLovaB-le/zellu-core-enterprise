import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireCompanionConsent } from "@/lib/require-user";

export type Message = { id: string; from: "ai" | "user"; text: string; created_at: string };

const MESSAGE_MAX_LENGTH = 2000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;
/** Histórico recente é suficiente para a UI; evita carregar anos de mensagens */
const MESSAGE_HISTORY_LIMIT = 80;

const rateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

export const getMessages = createServerFn({ method: "GET" })
  .handler(async () => {
    const auth = await requireCompanionConsent();
    if ("error" in auth) return [];
    const { userId, supabase } = auth;

    const { data: messages } = await supabase
      .from("chat_messages")
      .select("id, from, text, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(MESSAGE_HISTORY_LIMIT);

    const ordered = [...(messages ?? [])].reverse();
    return ordered as Message[];
  });

export const sendMessage = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({      text: z.string().min(1).max(MESSAGE_MAX_LENGTH),
    }),
  )
  .handler(async ({ data }: { data: { text: string } }) => {
    const auth = await requireCompanionConsent();
    if ("error" in auth) return null;
    const { userId, supabase } = auth;

    if (!checkRateLimit(userId)) {
      return null;
    }

    const { data: msg } = await supabase
      .from("chat_messages")
      .insert({ user_id: userId, text: data.text, from: "user" })
      .select("id, from, text, created_at")
      .single();

    return msg as Message | null;
  });
