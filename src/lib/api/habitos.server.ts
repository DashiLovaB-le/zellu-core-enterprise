import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getUserIdFromAccessToken } from "@/lib/auth-token";

export type HabitsData = {
  id: string;
  user_id: string;
  water_ml: number;
  sleep_quality: number;
  mood: string | null;
  movement_minutes: number;
  energy_level: number;
  meals: string[];
  date: string;
  updated_at: string;
};

export const getHabits = createServerFn({ method: "GET" })
  .inputValidator(z.object({ accessToken: z.string() }))
  .handler(async ({ data }: { data: { accessToken: string } }) => {
    const userId = getUserIdFromAccessToken(data.accessToken);
    if (!userId) return null;

    const supabase = await createClient(data.accessToken);
    const today = new Date().toISOString().split("T")[0];

    const { data: habits } = await supabase
      .from("habits")
      .select("id, user_id, water_ml, sleep_quality, mood, movement_minutes, energy_level, meals, date, updated_at")
      .eq("user_id", userId)
      .eq("date", today)
      .maybeSingle();

    return habits as HabitsData | null;
  });

export const updateHabits = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      waterMl: z.number().min(0).max(10000).optional(),
      sleepQuality: z.number().min(0).max(100).optional(),
      mood: z.string().optional(),
      movementMinutes: z.number().min(0).max(600).optional(),
      energyLevel: z.number().min(0).max(100).optional(),
      meals: z.array(z.string()).optional(),
    }),
  )
  .handler(
    async ({
      data,
    }: {
      data: {
        accessToken: string;
        waterMl?: number;
        sleepQuality?: number;
        mood?: string;
        movementMinutes?: number;
        energyLevel?: number;
        meals?: string[];
      };
    }) => {
      const userId = getUserIdFromAccessToken(data.accessToken);
      if (!userId) return null;

      const supabase = await createClient(data.accessToken);
      const today = new Date().toISOString().split("T")[0];

      const payload: Record<string, unknown> = { user_id: userId, date: today };
      if (data.waterMl !== undefined) payload.water_ml = data.waterMl;
      if (data.sleepQuality !== undefined) payload.sleep_quality = data.sleepQuality;
      if (data.mood !== undefined) payload.mood = data.mood;
      if (data.movementMinutes !== undefined) payload.movement_minutes = data.movementMinutes;
      if (data.energyLevel !== undefined) payload.energy_level = data.energyLevel;
      if (data.meals !== undefined) payload.meals = data.meals;

      const { data: result } = await supabase
        .from("habits")
        .upsert(payload, { onConflict: "user_id, date" })
        .select("id, user_id, water_ml, sleep_quality, mood, movement_minutes, energy_level, meals, date, updated_at")
        .single();

      return result as HabitsData | null;
    },
  );
