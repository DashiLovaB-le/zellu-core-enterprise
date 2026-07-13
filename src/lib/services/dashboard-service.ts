import {
  getDashboardData as apiGetDashboard,
  type DashboardData,
} from "@/lib/api/dashboard.server";

export type { DashboardData, WeekComparison, WeeklySummary } from "@/lib/api/dashboard.server";

export async function loadDashboard(accessToken: string | null): Promise<DashboardData> {
  if (!accessToken) {
    return {
      currentWeek: {
        sleepAvg: 0,
        waterAvg: 0,
        movementAvg: 0,
        moodDistribution: {},
        anxietyCount: 0,
        totalDays: 0,
      },
      previousWeek: {
        sleepAvg: 0,
        waterAvg: 0,
        movementAvg: 0,
        moodDistribution: {},
        anxietyCount: 0,
        totalDays: 0,
      },
      dailyMoodTrend: [],
      dailySleepTrend: [],
      weeklySummaries: [],
      anxietyChangePercent: null,
      dominantMood: "sem dados",
      daysTracked: 0,
    };
  }
  try {
    return await apiGetDashboard({ data: { accessToken } });
  } catch {
    return {
      currentWeek: {
        sleepAvg: 0,
        waterAvg: 0,
        movementAvg: 0,
        moodDistribution: {},
        anxietyCount: 0,
        totalDays: 0,
      },
      previousWeek: {
        sleepAvg: 0,
        waterAvg: 0,
        movementAvg: 0,
        moodDistribution: {},
        anxietyCount: 0,
        totalDays: 0,
      },
      dailyMoodTrend: [],
      dailySleepTrend: [],
      weeklySummaries: [],
      anxietyChangePercent: null,
      dominantMood: "sem dados",
      daysTracked: 0,
    };
  }
}
