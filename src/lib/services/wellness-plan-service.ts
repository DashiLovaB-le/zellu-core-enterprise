import {
  getWellnessPlan,
  saveWellnessPlan,
  getTodaysChecklist,
  updateChecklist,
  getPlanProgress,
  generatePlanSuggestion,
  type WellnessPlan,
  type WellnessChecklist,
  type PlanProgress,
} from "@/lib/api/wellness-plan.server";

export type { WellnessPlan, WellnessChecklist, PlanProgress } from "@/lib/api/wellness-plan.server";

export async function loadWellnessPlan(accessToken: string | null): Promise<WellnessPlan | null> {
  if (!accessToken) return null;
  try {
    return await getWellnessPlan({ data: { accessToken } });
  } catch {
    return null;
  }
}

export async function createWellnessPlan(
  accessToken: string,
  goal: string,
  customGoal?: string,
): Promise<{ data?: WellnessPlan; error?: string }> {
  try {
    return await saveWellnessPlan({ data: { accessToken, goal, customGoal } });
  } catch {
    return { error: "Erro ao salvar plano" };
  }
}

export async function loadTodaysChecklist(
  accessToken: string | null,
  planId: string,
): Promise<WellnessChecklist | null> {
  if (!accessToken) return null;
  try {
    return await getTodaysChecklist({ data: { accessToken, planId } });
  } catch {
    return null;
  }
}

export async function saveChecklist(
  accessToken: string,
  planId: string,
  data: {
    waterDone?: boolean;
    walkDone?: boolean;
    breatheDone?: boolean;
    talkDone?: boolean;
    notes?: string;
  },
): Promise<WellnessChecklist | null> {
  try {
    return await updateChecklist({ data: { accessToken, planId, ...data } });
  } catch {
    return null;
  }
}

export async function loadPlanProgress(
  accessToken: string | null,
  planId: string,
): Promise<PlanProgress | null> {
  if (!accessToken) return null;
  try {
    return await getPlanProgress({ data: { accessToken, planId } });
  } catch {
    return null;
  }
}

export async function loadPlanSuggestion(
  accessToken: string | null,
  plan: {
    goal: string;
    completionRate: number;
    currentStreak: number;
    totalDays: number;
    waterRate: number;
    walkRate: number;
    breatheRate: number;
    talkRate: number;
  },
): Promise<string> {
  if (!accessToken) return generateFallbackSuggestion(plan);
  try {
    const result = await generatePlanSuggestion({ data: { accessToken, plan } });
    return result.suggestion;
  } catch {
    return generateFallbackSuggestion(plan);
  }
}

function generateFallbackSuggestion(plan: {
  goal: string;
  completionRate: number;
  currentStreak: number;
}): string {
  if (plan.completionRate >= 80) {
    return `Você está mantendo uma ótima consistência no plano "${plan.goal}". Continue assim!`;
  }
  if (plan.currentStreak >= 3) {
    return `Boa sequência! Continue focado no plano "${plan.goal}".`;
  }
  return `Comece com pequenos passos no plano "${plan.goal}". Um item por vez já conta.`;
}
