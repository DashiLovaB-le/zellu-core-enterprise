import { getManagerDashboard, getCheckinStats, exportCsv } from "@/lib/api/manager.server";
import type { DashboardData } from "@/lib/api/manager.server";

export async function loadDashboard(accessToken: string): Promise<DashboardData | null> {
  try {
    const result = await getManagerDashboard({ data: { accessToken } });
    if (result.data) return result.data as DashboardData;
  } catch {
    // fallback
  }
  return null;
}

export async function loadCheckinStats(accessToken: string, periodDays: number = 30) {
  try {
    const result = await getCheckinStats({ data: { accessToken, periodDays } });
    return result.data ?? [];
  } catch {
    return [];
  }
}

export async function downloadCsv(
  accessToken: string,
  periodDays: number = 30,
): Promise<string | null> {
  try {
    const result = await exportCsv({ data: { accessToken, periodDays } });
    if (result.error) return null;
    return (result as { csv: string }).csv ?? null;
  } catch {
    return null;
  }
}
