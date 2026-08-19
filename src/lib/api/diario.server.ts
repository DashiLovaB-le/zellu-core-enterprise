import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireCompanionConsent } from "@/lib/require-user";

export const getDiaryEntries = createServerFn({ method: "GET" })
  .handler(async () => {
    const auth = await requireCompanionConsent();
    if ("error" in auth) return [];
    const { userId, supabase } = auth;

    const { data: entries } = await supabase
      .from("diary_entries")
      .select("id, user_id, content, mood, created_at, updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);

    return entries ?? [];
  });

export const saveDiaryEntry = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({      content: z.string().min(1).max(5000),
      mood: z.string().optional(),
    }),
  )
  .handler(async ({ data }: { data: { content: string; mood?: string } }) => {
    const auth = await requireCompanionConsent();
    if ("error" in auth) return { error: auth.error };
    const { userId, supabase } = auth;

    const { data: entry, error } = await supabase
      .from("diary_entries")
      .insert({ user_id: userId, content: data.content, mood: data.mood ?? null })
      .select("id, user_id, content, mood, created_at, updated_at")
      .single();

    return { data: entry, error: error?.message ?? null };
  });

export const deleteDiaryEntry = createServerFn({ method: "POST" })
  .inputValidator(z.object({ entryId: z.string().uuid() }))
  .handler(async ({ data }: { data: { entryId: string } }) => {
    const auth = await requireCompanionConsent();
    if ("error" in auth) return { error: auth.error };
    const { userId, supabase } = auth;

    const { error } = await supabase
      .from("diary_entries")
      .delete()
      .eq("id", data.entryId)
      .eq("user_id", userId);

    return { error: error?.message ?? null };
  });
