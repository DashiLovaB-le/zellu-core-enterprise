import { getRhDashboard, getRhMoodDistribution, getRhWorkFactors } from "@/lib/api/manager.server";
import type { RhDashboardData } from "@/lib/api/manager.server";
import type { RhWorkFactorReport } from "@/lib/work-factors";

export async function loadRhDashboard(): Promise<RhDashboardData | null> {
  try {
    const result = await getRhDashboard();
    if ("data" in result && result.data) return result.data as RhDashboardData;
  } catch {
    // fallback
  }
  return null;
}

export async function loadRhWorkFactors(): Promise<{
  data: RhWorkFactorReport | null;
  error: string | null;
}> {
  try {
    const result = await getRhWorkFactors();
    if (result.error || !result.data) {
      return {
        data: null,
        error: result.error ?? "Não foi possível carregar os fatores de trabalho.",
      };
    }
    return { data: result.data, error: null };
  } catch {
    return { data: null, error: "Não foi possível carregar os fatores de trabalho." };
  }
}

export async function loadRhMoodDistribution(periodDays: number): Promise<Record<string, number>> {
  try {
    const result = await getRhMoodDistribution({ data: { periodDays } });
    if (result.error || !result.data) return {};
    return result.data;
  } catch {
    return {};
  }
}
