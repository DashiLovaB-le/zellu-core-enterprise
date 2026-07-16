import { getRhDashboard } from "@/lib/api/manager.server";
import type { RhDashboardData } from "@/lib/api/manager.server";

export async function loadRhDashboard(accessToken: string): Promise<RhDashboardData | null> {
  try {
    const result = await getRhDashboard({ data: { accessToken } });
    if (result.data) return result.data as RhDashboardData;
  } catch {
    // fallback
  }
  return null;
}
