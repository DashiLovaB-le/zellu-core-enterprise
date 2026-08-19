import { getRhDashboard } from "@/lib/api/manager.server";
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
