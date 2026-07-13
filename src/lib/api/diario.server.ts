import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const getDiaryEntries = createServerFn({ method: "GET" })
  .inputValidator(z.object({ accessToken: z.string() }))
  .handler(async ({ data }: { data: { accessToken: string } }) => {
    const supabase = await createClient(data.accessToken);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: entries } = await supabase
      .from("diary_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

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
    const supabase = await createClient(data.accessToken);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { data: entry, error } = await supabase
      .from("diary_entries")
      .insert({ user_id: user.id, content: data.content, mood: data.mood ?? null })
      .select()
      .single();

    return { data: entry, error: error?.message ?? null };
  });

export const deleteDiaryEntry = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string(), entryId: z.string().uuid() }))
  .handler(async ({ data }: { data: { accessToken: string; entryId: string } }) => {
    const supabase = await createClient(data.accessToken);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase
      .from("diary_entries")
      .delete()
      .eq("id", data.entryId)
      .eq("user_id", user.id);

    return { error: error?.message ?? null };
  });
