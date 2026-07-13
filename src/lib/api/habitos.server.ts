import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

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

    return habits;
  });

export const updateWater = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string(), amount: z.number() }))
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
