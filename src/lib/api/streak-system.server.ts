import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireCompanionConsent } from "@/lib/require-user";

export type StreakData = {
  currentStreak: number;
  bestStreak: number;
  totalActiveDays: number;
  todayActive: boolean;
  milestones: number[];
};

const MILESTONES = [3, 7, 14, 21, 30, 60, 90];
/** Janela suficiente para streaks longos sem varrer histórico inteiro */
const STREAK_LOOKBACK_DAYS = 120;

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

export const getWellnessStreak = createServerFn({ method: "GET" })
  .inputValidator(z.object({ accessToken: z.string() }))
  .handler(async ({ data: { accessToken } }: { data: { accessToken: string } }) => {
    const auth = await requireCompanionConsent(accessToken);
    if ("error" in auth) return null;
    const { userId, supabase } = auth;

    const since = new Date();
    since.setDate(since.getDate() - STREAK_LOOKBACK_DAYS);
    const sinceIso = since.toISOString();
    const sinceDate = toDateStr(since);

    const [checkinsRes, checklistRes] = await Promise.allSettled([
      supabase
        .from("checkins")
        .select("created_at")
        .eq("user_id", userId)
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: false }),
      supabase
        .from("wellness_checklist")
        .select("date")
        .eq("user_id", userId)
        .gte("date", sinceDate),
    ]);

    const uniqueDates = new Set<string>();

    if (checkinsRes.status === "fulfilled") {
      for (const row of checkinsRes.value.data ?? []) {
        uniqueDates.add(toDateStr(new Date((row as { created_at: string }).created_at)));
      }
    }
    if (checklistRes.status === "fulfilled") {
      for (const row of checklistRes.value.data ?? []) {
        uniqueDates.add((row as { date: string }).date);
      }
    }

    if (uniqueDates.size === 0) {
      return { currentStreak: 0, bestStreak: 0, totalActiveDays: 0, todayActive: false, milestones: [] } as StreakData;
    }

    const sorted = [...uniqueDates].sort((a, b) => b.localeCompare(a));
    const today = toDateStr(new Date());
    const todayActive = sorted[0] === today;

    let currentStreak = 0;
    if (todayActive) {
      currentStreak = 1;
      for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1] + "T12:00:00Z");
        prev.setDate(prev.getDate() - 1);
        if (sorted[i] === toDateStr(prev)) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    let bestStreak = 0;
    let tempStreak = 1;
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0) {
        const prev = new Date(sorted[i - 1] + "T12:00:00Z");
        prev.setDate(prev.getDate() - 1);
        if (sorted[i] === toDateStr(prev)) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      bestStreak = Math.max(bestStreak, tempStreak);
    }

    const milestones = MILESTONES.filter((m) => currentStreak >= m);

    return { currentStreak, bestStreak, totalActiveDays: uniqueDates.size, todayActive, milestones } as StreakData;
  });

export { MILESTONES };
