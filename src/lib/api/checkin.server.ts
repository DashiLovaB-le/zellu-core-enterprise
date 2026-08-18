import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { logEvent } from "@/lib/api/logs.server";
import { requireCompanionConsent } from "@/lib/require-user";
import { canonicalMood } from "@/data/moods";

export type CheckinData = {
  id: string;
  user_id: string;
  sleep_hours: number;
  sleep_label: string;
  water_ml: number;
  mood: string;
  created_at: string;
};

export const saveCheckin = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      sleepHours: z.number().min(0).max(24),
      sleepLabel: z.string(),
      waterMl: z.number().min(0).max(10000),
      mood: z.string(),
    }),
  )
  .handler(
    async ({
      data,
    }: {
      data: {
        accessToken: string;
        sleepHours: number;
        sleepLabel: string;
        waterMl: number;
        mood: string;
      };
    }) => {
      const auth = await requireCompanionConsent(data.accessToken);
      if ("error" in auth) return { error: auth.error };
      const { userId, supabase } = auth;

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const { data: existing } = await supabase
        .from("checkins")
        .select("id")
        .eq("user_id", userId)
        .gte("created_at", todayStart.toISOString())
        .lte("created_at", todayEnd.toISOString())
        .limit(1);

      if (existing && existing.length > 0) {
        return { error: "Você já fez check-in hoje. Volte amanhã!" };
      }

      const mood = canonicalMood(data.mood) ?? data.mood;
      const { error } = await supabase.from("checkins").insert({
        user_id: userId,
        sleep_hours: data.sleepHours,
        sleep_label: data.sleepLabel,
        water_ml: data.waterMl,
        mood,
      });

      if (error) {
        void logEvent("error", "checkin.saveCheckin", "Erro ao salvar checkin", { error: error.message }, userId);
      } else {
        void logEvent("info", "checkin.saveCheckin", "Checkin salvo", {}, userId);
      }

      return { error: error?.message ?? null };
    },
  );

export const getTodaysCheckin = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string() }))
  .handler(async ({ data }: { data: { accessToken: string } }) => {
    const auth = await requireCompanionConsent(data.accessToken);
    if ("error" in auth) return { data: null, error: auth.error };
    const { userId, supabase } = auth;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const { data: checkin, error } = await supabase
      .from("checkins")
      .select("id, user_id, sleep_hours, sleep_label, water_ml, mood, created_at")
      .eq("user_id", userId)
      .gte("created_at", todayStart.toISOString())
      .lte("created_at", todayEnd.toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return { data: null, error: error.message };
    return { data: (checkin as CheckinData) ?? null, error: null };
  });

export const getLatestCheckin = getTodaysCheckin;
