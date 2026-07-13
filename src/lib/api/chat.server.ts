import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type Message = { id: string; from: "ai" | "user"; text: string; created_at: string };

export const getMessages = createServerFn({ method: "GET" })
  .inputValidator(z.object({ accessToken: z.string() }))
  .handler(async ({ data }: { data: { accessToken: string } }) => {
    const supabase = await createClient(data.accessToken);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: messages } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    return (messages ?? []) as Message[];
  });

export const sendMessage = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string(), text: z.string().min(1) }))
  .handler(async ({ data }: { data: { accessToken: string; text: string } }) => {
    const supabase = await createClient(data.accessToken);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: msg } = await supabase
      .from("chat_messages")
      .insert({ user_id: user.id, text: data.text, from: "user" })
      .select()
      .single();

    return msg as Message | null;
  });
