import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getUserIdFromAccessToken } from "@/lib/auth-token";

export const getDiaryEntries = createServerFn({ method: "GET" })
  .inputValidator(z.object({ accessToken: z.string() }))
  .handler(async ({ data }: { data: { accessToken: string } }) => {
    const userId = getUserIdFromAccessToken(data.accessToken);
    if (!userId) return [];

    const supabase = await createClient(data.accessToken);

    const { data: entries } = await supabase
      .from("diary_entries")
      .select("id, content, mood, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);

    return entries ?? [];
  });

export const saveDiaryEntry = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      content: z.string().min(1).max(5000),
      mood: z.string().optional(),
    }),
  )
  .handler(async ({ data }: { data: { accessToken: string; content: string; mood?: string } }) => {
    const userId = getUserIdFromAccessToken(data.accessToken);
    if (!userId) return { error: "Unauthorized" };

    const supabase = await createClient(data.accessToken);

    const { data: entry, error } = await supabase
      .from("diary_entries")
      .insert({ user_id: userId, content: data.content, mood: data.mood ?? null })
      .select("id, content, mood, created_at")
      .single();

    return { data: entry, error: error?.message ?? null };
  });

export const deleteDiaryEntry = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string(), entryId: z.string().uuid() }))
  .handler(async ({ data }: { data: { accessToken: string; entryId: string } }) => {
    const userId = getUserIdFromAccessToken(data.accessToken);
    if (!userId) return { error: "Unauthorized" };

    const supabase = await createClient(data.accessToken);

    const { error } = await supabase
      .from("diary_entries")
      .delete()
      .eq("id", data.entryId)
      .eq("user_id", userId);

    return { error: error?.message ?? null };
  });
