import {
  getDashboardData as apiGetDashboard,
  type DashboardData,
} from "@/lib/api/dashboard.server";

export type { DashboardData, WeekComparison, WeeklySummary } from "@/lib/api/dashboard.server";

const EMPTY_DASHBOARD: DashboardData = {
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

export async function loadDashboard(): Promise<DashboardData> {
  try {
    return await apiGetDashboard();
  } catch {
    return EMPTY_DASHBOARD;
  }
}
