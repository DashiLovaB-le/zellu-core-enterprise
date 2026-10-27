import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { logEvent } from "@/lib/api/logs.server";
import { requireCompanionConsent } from "@/lib/require-user";
import { canonicalMood } from "@/data/moods";
import {
  WORK_FACTOR_IDS,
  assertFactorMatchesDay,
  calendarDayKey,
  factorById,
  type WorkFactor,
} from "@/lib/work-factors";

export type CheckinData = {
  id: string;
  user_id: string;
  sleep_hours: number;
  sleep_label: string;
  water_ml: number;
  mood: string;
  created_at: string;
  work_factor_id: string | null;
  work_factor_score: number | null;
};

export type TodayWorkFactor = {
  dayKey: string;
  factor: WorkFactor;
};

const saveSchema = z.object({
  sleepHours: z.number().min(0).max(24),
  sleepLabel: z.string().max(40),
  waterMl: z.number().int().min(0).max(10000),
  mood: z.string().trim().max(40),
  workFactorId: z.enum(WORK_FACTOR_IDS),
  workFactorScore: z.number().int().min(1).max(5),
});

const todayFactorSchema = z.object({
  dayKey: z.string(),
  factorId: z.string(),
});

function checkinErrorMessage(error: { code?: string; message: string }): string {
  if (error.code === "23505" || error.message.includes("checkin already exists")) {
    return "Você já fez check-in hoje. Volte amanhã!";
  }
  if (error.message.includes("work factor day mismatch")) {
    return "A pergunta do dia mudou. Atualize a página e tente de novo.";
  }
  if (error.message.includes("invalid score")) {
    return "Escolha uma nota de 1 a 5.";
  }
  return "Não foi possível salvar o check-in. Tente de novo.";
}

export const getTodayWorkFactor = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ data: TodayWorkFactor | null; error: string | null }> => {
    const auth = await requireCompanionConsent();
    if ("error" in auth) return { data: null, error: auth.error };
    const { supabase, userId } = auth;

    const { data, error } = await supabase.rpc("work_factor_today");
    if (error || data == null) {
      void logEvent(
        "error",
        "checkin.getTodayWorkFactor",
        "Falha ao ler o fator do dia",
        { error: error?.message ?? "vazio" },
        userId,
      );
      return { data: null, error: "A pergunta do dia está indisponível." };
    }

    const payload = typeof data === "string" ? JSON.parse(data) : data;
    const parsed = todayFactorSchema.safeParse(payload);
    if (!parsed.success) return { data: null, error: "A pergunta do dia está indisponível." };

    const dayKey = parsed.data.dayKey.slice(0, 10);
    const factor = factorById(parsed.data.factorId);
    if (!factor || !assertFactorMatchesDay(dayKey, factor.id)) {
      void logEvent(
        "error",
        "checkin.getTodayWorkFactor",
        "Fator do dia divergente do catálogo",
        { factorId: parsed.data.factorId },
        userId,
      );
      return { data: null, error: "A pergunta do dia está indisponível." };
    }

    return { data: { dayKey, factor }, error: null };
  },
);

export const saveCheckin = createServerFn({ method: "POST" })
  .inputValidator(saveSchema)
  .handler(async ({ data }) => {
    const auth = await requireCompanionConsent();
    if ("error" in auth) return { error: auth.error };
    const { userId, supabase } = auth;

    const mood = canonicalMood(data.mood) ?? data.mood;
    const { error } = await supabase.rpc("save_my_checkin", {
      p_sleep_hours: data.sleepHours,
      p_sleep_label: data.sleepLabel,
      p_water_ml: data.waterMl,
      p_mood: mood,
      p_factor_id: data.workFactorId,
      p_score: data.workFactorScore,
    });

    if (error) {
      void logEvent(
        "error",
        "checkin.saveCheckin",
        "Erro ao salvar checkin",
        { error: error.message },
        userId,
      );
      return { error: checkinErrorMessage(error) };
    }

    void logEvent("info", "checkin.saveCheckin", "Checkin salvo", {}, userId);
    return { error: null };
  });

export const getTodaysCheckin = createServerFn({ method: "POST" }).handler(async () => {
  const auth = await requireCompanionConsent();
  if ("error" in auth) return { data: null, error: auth.error };
  const { userId, supabase } = auth;

  const since = new Date(Date.now() - 2 * 86_400_000).toISOString();
  const todayKey = calendarDayKey(new Date());

  const { data: recent, error } = await supabase
    .from("checkins")
    .select("id, user_id, sleep_hours, sleep_label, water_ml, mood, created_at")
    .eq("user_id", userId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) return { data: null, error: error.message };
  const checkin =
    (recent ?? []).find((row) => calendarDayKey(new Date(row.created_at)) === todayKey) ?? null;
  if (!checkin) return { data: null, error: null };

  const { data: factor, error: factorError } = await supabase
    .from("work_factor_responses")
    .select("factor_id, score")
    .eq("user_id", userId)
    .eq("answered_on", todayKey)
    .maybeSingle();

  if (factorError) return { data: null, error: factorError.message };

  return {
    data: {
      ...(checkin as Omit<CheckinData, "work_factor_id" | "work_factor_score">),
      work_factor_id: (factor?.factor_id as string | undefined) ?? null,
      work_factor_score: (factor?.score as number | undefined) ?? null,
    } satisfies CheckinData,
    error: null,
  };
});

export const getLatestCheckin = getTodaysCheckin;
