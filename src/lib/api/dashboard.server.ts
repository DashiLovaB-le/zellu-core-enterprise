import { createServerFn } from "@tanstack/react-start";
import { requireCompanionConsent } from "@/lib/require-user";
import { canonicalMood, getMoodScore } from "@/data/moods";
import { addDaysToDateKey, DEFAULT_TIMEZONE, mondayOfWeekKey, zonedDateKey } from "@/lib/timezone";

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

function formatWeekLabel(mondayKey: string): string {
  const endKey = addDaysToDateKey(mondayKey, 6);
  const fmt = (key: string) => {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
  };
  return `${fmt(mondayKey)} - ${fmt(endKey)}`;
}

function resolveMood(raw: string | null | undefined): string | null {
  return canonicalMood(raw) ?? (raw ? raw.toLowerCase() : null);
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
  .handler(async () => {
    const auth = await requireCompanionConsent();
    if ("error" in auth) {
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
    const { userId, supabase } = auth;

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
      const key = zonedDateKey(DEFAULT_TIMEZONE, new Date(c.created_at));
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
      const key = zonedDateKey(DEFAULT_TIMEZONE, new Date(e.created_at));
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
    const todayKey = zonedDateKey(DEFAULT_TIMEZONE, today);
    const currentMondayKey = mondayOfWeekKey(DEFAULT_TIMEZONE, today);
    const prevMondayKey = addDaysToDateKey(currentMondayKey, -7);

    function inWeek(key: string, weekStartKey: string): boolean {
      const weekEndKey = addDaysToDateKey(weekStartKey, 7);
      return key >= weekStartKey && key < weekEndKey;
    }

    const currentWeek: WeekComparison = { ...buildEmptyWeek(), moodDistribution: {} };
    const previousWeek: WeekComparison = { ...buildEmptyWeek(), moodDistribution: {} };
    const dailyMoodTrend: DailyDataPoint[] = [];
    const dailySleepTrend: { date: string; hours: number }[] = [];

    const thirtyKey = addDaysToDateKey(todayKey, -30);

    for (const [key, vals] of dayMap) {
      const inCurrent = inWeek(key, currentMondayKey);
      const inPrev = inWeek(key, prevMondayKey);
      const moodKey = resolveMood(vals.mood);

      if (inCurrent) {
        currentWeek.totalDays++;
        if (vals.sleepHours > 0) currentWeek.sleepAvg += vals.sleepHours;
        if (vals.waterMl > 0) currentWeek.waterAvg += vals.waterMl;
        if (vals.movementMinutes > 0) currentWeek.movementAvg += vals.movementMinutes;
        if (moodKey) {
          currentWeek.moodDistribution[moodKey] = (currentWeek.moodDistribution[moodKey] ?? 0) + 1;
          if (getMoodScore(moodKey) === 3) currentWeek.anxietyCount++;
        }
      }

      if (inPrev) {
        previousWeek.totalDays++;
        if (vals.sleepHours > 0) previousWeek.sleepAvg += vals.sleepHours;
        if (vals.waterMl > 0) previousWeek.waterAvg += vals.waterMl;
        if (vals.movementMinutes > 0) previousWeek.movementAvg += vals.movementMinutes;
        if (moodKey) {
          previousWeek.moodDistribution[moodKey] =
            (previousWeek.moodDistribution[moodKey] ?? 0) + 1;
          if (getMoodScore(moodKey) === 3) previousWeek.anxietyCount++;
        }
      }

      if (key >= thirtyKey && key <= todayKey) {
        if (moodKey) {
          dailyMoodTrend.push({
            date: key,
            score: getMoodScore(moodKey),
            mood: moodKey,
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

    const allMoods = [...dayMap.values()]
      .map((v) => resolveMood(v.mood))
      .filter(Boolean) as string[];
    const moodCounts: Record<string, number> = {};
    for (const m of allMoods) {
      moodCounts[m] = (moodCounts[m] ?? 0) + 1;
    }
    let dominantMood = "sem dados";
    let maxCount = 0;
    for (const [m, c] of Object.entries(moodCounts)) {
      if (c > maxCount) {
        maxCount = c;
        dominantMood = m;
      }
    }

    const weeklySummaries: WeeklySummary[] = [];
    const eightWeeksAgoKey = addDaysToDateKey(todayKey, -56);
    let weekStartKey = mondayOfWeekKey(
      DEFAULT_TIMEZONE,
      new Date(`${eightWeeksAgoKey}T12:00:00.000Z`),
    );
    while (weekStartKey <= currentMondayKey) {
      const weekEndKey = addDaysToDateKey(weekStartKey, 7);
      let moodSum = 0;
      let moodCount = 0;
      let sleepSum = 0;
      let sleepCount = 0;
      let movementSum = 0;
      let movementCount = 0;
      for (const [key, vals] of dayMap) {
        if (key >= weekStartKey && key < weekEndKey) {
          const weekMood = resolveMood(vals.mood);
          if (weekMood) {
            moodSum += getMoodScore(weekMood);
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
          weekLabel: formatWeekLabel(weekStartKey),
          moodAvg: moodCount > 0 ? parseFloat((moodSum / moodCount).toFixed(1)) : 0,
          sleepAvg: sleepCount > 0 ? parseFloat((sleepSum / sleepCount).toFixed(1)) : 0,
          movementAvg: movementCount > 0 ? Math.round(movementSum / movementCount) : 0,
        });
      }
      weekStartKey = weekEndKey;
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
