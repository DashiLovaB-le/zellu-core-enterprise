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

export async function loadWellnessPlan(): Promise<WellnessPlan | null> {
  try {
    return await getWellnessPlan();
  } catch {
    return null;
  }
}

export async function createWellnessPlan(
  goal: string,
  customGoal?: string,
): Promise<{ data?: WellnessPlan; error?: string }> {
  try {
    return await saveWellnessPlan({ data: { goal, customGoal } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao salvar plano";
    return { error: message };
  }
}

export async function loadTodaysChecklist(planId: string): Promise<WellnessChecklist | null> {
  try {
    return await getTodaysChecklist({ data: { planId } });
  } catch {
    return null;
  }
}

export async function saveChecklist(
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
    return await updateChecklist({ data: { planId, ...data } });
  } catch {
    return null;
  }
}

export async function loadPlanProgress(planId: string): Promise<PlanProgress | null> {
  try {
    return await getPlanProgress({ data: { planId } });
  } catch {
    return null;
  }
}

export async function loadPlanSuggestion(plan: {
  goal: string;
  completionRate: number;
  currentStreak: number;
  totalDays: number;
  waterRate: number;
  walkRate: number;
  breatheRate: number;
  talkRate: number;
}): Promise<string> {
  try {
    const result = await generatePlanSuggestion({ data: { plan } });
    return result.suggestion;
  } catch {
    return generateFallbackSuggestion(plan);
  }
}

function generateFallbackSuggestion(plan: {
  goal: string;
  completionRate: number;
  currentStreak: number;
  waterRate?: number;
  walkRate?: number;
  breatheRate?: number;
  talkRate?: number;
}): string {
  const weakest = [
    { label: "água", rate: plan.waterRate ?? 0 },
    { label: "caminhada", rate: plan.walkRate ?? 0 },
    { label: "respiração", rate: plan.breatheRate ?? 0 },
    { label: "conversa", rate: plan.talkRate ?? 0 },
  ].sort((a, b) => a.rate - b.rate)[0];

  if (plan.completionRate >= 80) {
    return `Ótima consistência no plano. Se quiser subir ainda mais, foque um pouco em ${weakest.label}.`;
  }
  if (plan.currentStreak >= 3) {
    return `Boa sequência de ${plan.currentStreak} dias. Hoje, priorize ${weakest.label} — um toque já conta.`;
  }
  return `Comece pelo mais simples: marque ${weakest.label} no checklist de hoje e siga no seu ritmo.`;
}
