import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getUserIdFromAccessToken } from "@/lib/auth-token";

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
  .inputValidator(z.object({ accessToken: z.string() }))
  .handler(async ({ data }: { data: { accessToken: string } }) => {
    const userId = getUserIdFromAccessToken(data.accessToken);
    if (!userId) return [];

    const supabase = await createClient(data.accessToken);

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
    z.object({
      accessToken: z.string(),
      text: z.string().min(1).max(MESSAGE_MAX_LENGTH),
    }),
  )
  .handler(async ({ data }: { data: { accessToken: string; text: string } }) => {
    const userId = getUserIdFromAccessToken(data.accessToken);
    if (!userId) return null;

    if (!checkRateLimit(userId)) {
      return null;
    }

    const supabase = await createClient(data.accessToken);

    const { data: msg } = await supabase
      .from("chat_messages")
      .insert({ user_id: userId, text: data.text, from: "user" })
      .select("id, from, text, created_at")
      .single();

    return msg as Message | null;
  });
