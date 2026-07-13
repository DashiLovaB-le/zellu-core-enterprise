import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type HabitsData = {
  id: string;
  user_id: string;
  water_ml: number;
  sleep_quality: number;
  mood: string | null;
  movement_minutes: number;
  energy_level: number;
  meals: string[];
  updated_at: string;
};

export const getHabits = createServerFn({ method: "GET" })
  .inputValidator(z.object({ accessToken: z.string() }))
  .handler(async ({ data }: { data: { accessToken: string } }) => {
    const supabase = await createClient(data.accessToken);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: habits } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", user.id)
      .single();

    return habits as HabitsData | null;
  });

export const updateWater = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string(), amount: z.number().min(0).max(10000) }))
  .handler(async ({ data }: { data: { accessToken: string; amount: number } }) => {
    const supabase = await createClient(data.accessToken);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: result } = await supabase
      .from("habits")
      .upsert({ user_id: user.id, water_ml: data.amount })
      .select()
      .single();

    return result;
  });

export const updateSleepQuality = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string(), quality: z.number().min(0).max(100) }))
  .handler(async ({ data }: { data: { accessToken: string; quality: number } }) => {
    const supabase = await createClient(data.accessToken);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: result } = await supabase
      .from("habits")
      .upsert({ user_id: user.id, sleep_quality: data.quality })
      .select()
      .single();

    return result;
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
      const supabase = await createClient(data.accessToken);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const payload: Record<string, unknown> = {};
      if (data.waterMl !== undefined) payload.water_ml = data.waterMl;
      if (data.sleepQuality !== undefined) payload.sleep_quality = data.sleepQuality;
      if (data.mood !== undefined) payload.mood = data.mood;
      if (data.movementMinutes !== undefined) payload.movement_minutes = data.movementMinutes;
      if (data.energyLevel !== undefined) payload.energy_level = data.energyLevel;
      if (data.meals !== undefined) payload.meals = data.meals;

      if (Object.keys(payload).length === 0) return null;

      const { data: result } = await supabase
        .from("habits")
        .upsert({ user_id: user.id, ...payload })
        .select()
        .single();

      return result as HabitsData | null;
    },
  );
