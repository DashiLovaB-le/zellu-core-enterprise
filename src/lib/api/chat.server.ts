import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type Message = { id: string; from: "ai" | "user"; text: string; created_at: string };

const MESSAGE_MAX_LENGTH = 2000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;

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
    const supabase = await createClient(data.accessToken);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: messages } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    return (messages ?? []) as Message[];
  });

export const sendMessage = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      text: z.string().min(1).max(MESSAGE_MAX_LENGTH),
    }),
  )
  .handler(async ({ data }: { data: { accessToken: string; text: string } }) => {
    const supabase = await createClient(data.accessToken);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    if (!checkRateLimit(user.id)) {
      return null;
    }

    const { data: msg } = await supabase
      .from("chat_messages")
      .insert({ user_id: user.id, text: data.text, from: "user" })
      .select()
      .single();

    return msg as Message | null;
  });
