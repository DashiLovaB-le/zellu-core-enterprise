import { getManagerDashboard, getCheckinStats, exportCsv } from "@/lib/api/manager.server";
import type { DashboardData } from "@/lib/api/manager.server";

export async function loadDashboard(): Promise<DashboardData | null> {
  try {
    const result = await getManagerDashboard();
    if ("data" in result && result.data) return result.data as DashboardData;
  } catch {
    // fallback
  }
  return null;
}

export async function loadCheckinStats(periodDays: number = 30) {
  try {
    const result = await getCheckinStats({ data: { periodDays } });
    return "data" in result ? (result.data ?? []) : [];
  } catch {
    return [];
  }
}

export async function downloadCsv(
  periodDays: number = 30,
): Promise<string | null> {
  try {
    const result = await exportCsv({ data: { periodDays } });
    if (result.error) return null;
    return (result as { csv: string }).csv ?? null;
  } catch {
    return null;
  }
}
