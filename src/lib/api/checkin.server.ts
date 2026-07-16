import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logEvent } from "@/lib/api/logs.server";
import { getUserIdFromAccessToken } from "@/lib/auth-token";

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
      const userId = getUserIdFromAccessToken(data.accessToken);
      if (!userId) return { error: "Unauthorized" };

      const supabase = await createClient(data.accessToken);

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

      const { error } = await supabase.from("checkins").insert({
        user_id: userId,
        sleep_hours: data.sleepHours,
        sleep_label: data.sleepLabel,
        water_ml: data.waterMl,
        mood: data.mood,
      });

      if (error) {
        void logEvent("error", "checkin.saveCheckin", `Erro ao salvar checkin: ${userId}`, { error: error.message, mood: data.mood }, userId);
      } else {
        void logEvent("info", "checkin.saveCheckin", `Checkin salvo: ${userId}`, { mood: data.mood, sleepHours: data.sleepHours }, userId);
      }

      return { error: error?.message ?? null };
    },
  );

export const getTodaysCheckin = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string() }))
  .handler(async ({ data }: { data: { accessToken: string } }) => {
    const userId = getUserIdFromAccessToken(data.accessToken);
    if (!userId) return { data: null, error: null };

    const supabase = await createClient(data.accessToken);

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
