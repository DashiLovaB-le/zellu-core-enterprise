import { getRhDashboard, getRhMoodDistribution } from "@/lib/api/manager.server";
import type { RhDashboardData } from "@/lib/api/manager.server";

export async function loadRhDashboard(): Promise<RhDashboardData | null> {
  try {
    const result = await getRhDashboard();
    if ("data" in result && result.data) return result.data as RhDashboardData;
  } catch {
    // fallback
  }
  return null;
}

export async function loadRhMoodDistribution(
  periodDays: number,
): Promise<Record<string, number>> {
  try {
    const result = await getRhMoodDistribution({ data: { periodDays } });
    if (result.error || !result.data) return {};
    return result.data;
  } catch {
    return {};
  }
}
