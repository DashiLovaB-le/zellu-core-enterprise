import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getUserIdFromAccessToken } from "@/lib/auth-token";

export interface WeekComparison {
  sleepAvg: number;
  waterAvg: number;
  movementAvg: number;
  moodDistribution: Record<string, number>;
  anxietyCount: number;
  totalDays: number;
}

export interface DailyDataPoint {
  date: string;
  score: number;
  mood: string;
  hours: number;
}

export interface WeeklySummary {
  weekLabel: string;
  moodAvg: number;
  sleepAvg: number;
  movementAvg: number;
}

export interface DashboardData {
  currentWeek: WeekComparison;
  previousWeek: WeekComparison;
  dailyMoodTrend: DailyDataPoint[];
  dailySleepTrend: { date: string; hours: number }[];
  weeklySummaries: WeeklySummary[];
  anxietyChangePercent: number | null;
  dominantMood: string;
  daysTracked: number;
}

const MOOD_SCORE: Record<string, number> = {
  irritado: 1,
  triste: 2,
  ansioso: 3,
  neutro: 4,
  calmo: 5,
  feliz: 6,
};

function dateKey(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatWeekLabel(monday: Date): string {
  const start = monday.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
  const end = new Date(monday);
  end.setDate(end.getDate() + 6);
  const endStr = end.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
  return `${start} - ${endStr}`;
}

function getMoodScore(mood: string | null): number {
  if (!mood) return 0;
  return MOOD_SCORE[mood] ?? 0;
}

function buildEmptyWeek(): WeekComparison {
  return {
    sleepAvg: 0,
    waterAvg: 0,
    movementAvg: 0,
    moodDistribution: {},
    anxietyCount: 0,
    totalDays: 0,
  };
}

export const getDashboardData = createServerFn({ method: "GET" })
  .inputValidator(z.object({ accessToken: z.string() }))
  .handler(async ({ data }: { data: { accessToken: string } }) => {
    const userId = getUserIdFromAccessToken(data.accessToken);
    if (!userId) {
      return {
        currentWeek: buildEmptyWeek(),
        previousWeek: buildEmptyWeek(),
        dailyMoodTrend: [],
        dailySleepTrend: [],
        weeklySummaries: [],
        anxietyChangePercent: null,
        dominantMood: "sem dados",
        daysTracked: 0,
      };
    }

    const supabase = await createClient(data.accessToken);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const since = sixtyDaysAgo.toISOString();
    const sinceDate = since.split("T")[0];

    const [checkinsRes, habitsRes, diaryRes] = await Promise.allSettled([
      supabase
        .from("checkins")
        .select("created_at, mood, sleep_hours, water_ml")
        .eq("user_id", userId)
        .gte("created_at", since)
        .order("created_at", { ascending: true }),
      supabase
        .from("habits")
        .select("date, mood, sleep_quality, water_ml, movement_minutes")
        .eq("user_id", userId)
        .gte("date", sinceDate)
        .order("date", { ascending: true }),
      supabase
        .from("diary_entries")
        .select("created_at, mood")
        .eq("user_id", userId)
        .gte("created_at", since)
        .order("created_at", { ascending: true }),
    ]);

    const checkins = checkinsRes.status === "fulfilled" ? (checkinsRes.value.data ?? []) : [];
    const habits = habitsRes.status === "fulfilled" ? (habitsRes.value.data ?? []) : [];
    const diaryEntries = diaryRes.status === "fulfilled" ? (diaryRes.value.data ?? []) : [];

    const dayMap = new Map<
      string,
      {
        mood: string | null;
        sleepHours: number;
        sleepQuality: number;
        waterMl: number;
        movementMinutes: number;
      }
    >();

    for (const c of checkins) {
      const key = dateKey(new Date(c.created_at));
      const existing = dayMap.get(key) ?? {
        mood: null,
        sleepHours: 0,
        sleepQuality: 0,
        waterMl: 0,
        movementMinutes: 0,
      };
      if (c.mood) existing.mood = c.mood;
      if (c.sleep_hours > 0) existing.sleepHours = c.sleep_hours;
      if (c.water_ml > 0) existing.waterMl = c.water_ml;
      dayMap.set(key, existing);
    }

    for (const h of habits) {
      const key = h.date;
      const existing = dayMap.get(key) ?? {
        mood: null,
        sleepHours: 0,
        sleepQuality: 0,
        waterMl: 0,
        movementMinutes: 0,
      };
      if (h.mood && !existing.mood) existing.mood = h.mood;
      if (h.sleep_quality > 0 && existing.sleepHours === 0) existing.sleepQuality = h.sleep_quality;
      if (h.water_ml > 0 && existing.waterMl === 0) existing.waterMl = h.water_ml;
      if (h.movement_minutes > 0) existing.movementMinutes = h.movement_minutes;
      dayMap.set(key, existing);
    }

    for (const e of diaryEntries) {
      const key = dateKey(new Date(e.created_at));
      const existing = dayMap.get(key) ?? {
        mood: null,
        sleepHours: 0,
        sleepQuality: 0,
        waterMl: 0,
        movementMinutes: 0,
      };
      if (e.mood && !existing.mood) existing.mood = e.mood;
      dayMap.set(key, existing);
    }

    const today = new Date();
    const todayKey = dateKey(today);
    const currentMonday = getMonday(today);
    const prevMonday = new Date(currentMonday);
    prevMonday.setDate(prevMonday.getDate() - 7);

    function inWeek(key: string, weekStart: Date): boolean {
      const d = new Date(key + "T12:00:00");
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      return d >= weekStart && d < weekEnd;
    }

    const currentWeek: WeekComparison = { ...buildEmptyWeek() };
    const previousWeek: WeekComparison = { ...buildEmptyWeek() };
    const dailyMoodTrend: DailyDataPoint[] = [];
    const dailySleepTrend: { date: string; hours: number }[] = [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyKey = dateKey(thirtyDaysAgo);

    for (const [key, vals] of dayMap) {
      const inCurrent = inWeek(key, currentMonday);
      const inPrev = inWeek(key, prevMonday);

      if (inCurrent) {
        currentWeek.totalDays++;
        if (vals.sleepHours > 0) currentWeek.sleepAvg += vals.sleepHours;
        if (vals.waterMl > 0) currentWeek.waterAvg += vals.waterMl;
        if (vals.movementMinutes > 0) currentWeek.movementAvg += vals.movementMinutes;
        if (vals.mood) {
          currentWeek.moodDistribution[vals.mood] =
            (currentWeek.moodDistribution[vals.mood] ?? 0) + 1;
          if (vals.mood === "ansioso") currentWeek.anxietyCount++;
        }
      }

      if (inPrev) {
        previousWeek.totalDays++;
        if (vals.sleepHours > 0) previousWeek.sleepAvg += vals.sleepHours;
        if (vals.waterMl > 0) previousWeek.waterAvg += vals.waterMl;
        if (vals.movementMinutes > 0) previousWeek.movementAvg += vals.movementMinutes;
        if (vals.mood) {
          previousWeek.moodDistribution[vals.mood] =
            (previousWeek.moodDistribution[vals.mood] ?? 0) + 1;
          if (vals.mood === "ansioso") previousWeek.anxietyCount++;
        }
      }

      if (key >= thirtyKey && key <= todayKey) {
        if (vals.mood) {
          dailyMoodTrend.push({
            date: key,
            score: getMoodScore(vals.mood),
            mood: vals.mood,
            hours: vals.sleepHours,
          });
        }
        if (vals.sleepHours > 0) {
          dailySleepTrend.push({ date: key, hours: vals.sleepHours });
        }
      }
    }

    if (currentWeek.totalDays > 0) {
      currentWeek.sleepAvg = parseFloat((currentWeek.sleepAvg / currentWeek.totalDays).toFixed(1));
      currentWeek.waterAvg = Math.round(currentWeek.waterAvg / currentWeek.totalDays);
      currentWeek.movementAvg = Math.round(currentWeek.movementAvg / currentWeek.totalDays);
    }
    if (previousWeek.totalDays > 0) {
      previousWeek.sleepAvg = parseFloat(
        (previousWeek.sleepAvg / previousWeek.totalDays).toFixed(1),
      );
      previousWeek.waterAvg = Math.round(previousWeek.waterAvg / previousWeek.totalDays);
      previousWeek.movementAvg = Math.round(previousWeek.movementAvg / previousWeek.totalDays);
    }

    let anxietyChangePercent: number | null = null;
    if (previousWeek.anxietyCount > 0) {
      anxietyChangePercent = Math.round(
        ((currentWeek.anxietyCount - previousWeek.anxietyCount) / previousWeek.anxietyCount) * 100,
      );
    } else if (currentWeek.anxietyCount === 0 && previousWeek.anxietyCount === 0) {
      anxietyChangePercent = 0;
    } else if (currentWeek.anxietyCount > 0 && previousWeek.anxietyCount === 0) {
      anxietyChangePercent = 100;
    }

    const allMoods = [...dayMap.values()].map((v) => v.mood).filter(Boolean) as string[];
    const moodCounts: Record<string, number> = {};
    for (const m of allMoods) {
      moodCounts[m] = (moodCounts[m] ?? 0) + 1;
    }
    let dominantMood = "neutro";
    let maxCount = 0;
    for (const [m, c] of Object.entries(moodCounts)) {
      if (c > maxCount) {
        maxCount = c;
        dominantMood = m;
      }
    }

    const weeklySummaries: WeeklySummary[] = [];
    const weekStarts: Date[] = [];
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
    let iter = getMonday(eightWeeksAgo);
    while (iter <= today) {
      weekStarts.push(new Date(iter));
      iter.setDate(iter.getDate() + 7);
    }
    for (const ws of weekStarts) {
      const weekEnd = new Date(ws);
      weekEnd.setDate(weekEnd.getDate() + 7);
      let moodSum = 0;
      let moodCount = 0;
      let sleepSum = 0;
      let sleepCount = 0;
      let movementSum = 0;
      let movementCount = 0;
      for (const [key, vals] of dayMap) {
        const d = new Date(key + "T12:00:00");
        if (d >= ws && d < weekEnd) {
          if (vals.mood) {
            moodSum += getMoodScore(vals.mood);
            moodCount++;
          }
          if (vals.sleepHours > 0) {
            sleepSum += vals.sleepHours;
            sleepCount++;
          }
          if (vals.movementMinutes > 0) {
            movementSum += vals.movementMinutes;
            movementCount++;
          }
        }
      }
      if (moodCount > 0 || sleepCount > 0 || movementCount > 0) {
        weeklySummaries.push({
          weekLabel: formatWeekLabel(ws),
          moodAvg: moodCount > 0 ? parseFloat((moodSum / moodCount).toFixed(1)) : 0,
          sleepAvg: sleepCount > 0 ? parseFloat((sleepSum / sleepCount).toFixed(1)) : 0,
          movementAvg: movementCount > 0 ? Math.round(movementSum / movementCount) : 0,
        });
      }
    }

    return {
      currentWeek,
      previousWeek,
      dailyMoodTrend,
      dailySleepTrend,
      weeklySummaries,
      anxietyChangePercent,
      dominantMood,
      daysTracked: dayMap.size,
    };
  });
