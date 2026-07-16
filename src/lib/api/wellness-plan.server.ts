import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logEvent } from "@/lib/api/logs.server";
import { getUserIdFromAccessToken } from "@/lib/auth-token";

export interface WellnessPlan {
  id: string;
  user_id: string;
  goal: string;
  custom_goal: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
}

export interface WellnessChecklist {
  id: string;
  user_id: string;
  plan_id: string;
  date: string;
  water_done: boolean;
  walk_done: boolean;
  breathe_done: boolean;
  talk_done: boolean;
  notes: string;
}

export interface PlanProgress {
  totalDays: number;
  completedDays: number;
  completionRate: number;
  currentStreak: number;
  bestStreak: number;
  waterRate: number;
  walkRate: number;
  breatheRate: number;
  talkRate: number;
}

const GOAL_OPTIONS = [
  { value: "reduzir-ansiedade", label: "Reduzir ansiedade" },
  { value: "melhorar-sono", label: "Melhorar o sono" },
  { value: "aumentar-energia", label: "Aumentar energia" },
  { value: "equilibrio-emocional", label: "Equilíbrio emocional" },
  { value: "autocuidado-rotina", label: "Autocuidado na rotina" },
  { value: "custom", label: "Meu próprio objetivo" },
] as const;

export { GOAL_OPTIONS };

const CHECKLIST_ITEMS = [
  { key: "water_done", label: "Água", emoji: "💧", description: "Beber água suficiente" },
  { key: "walk_done", label: "Caminhada", emoji: "🚶", description: "Fazer uma caminhada" },
  { key: "breathe_done", label: "Respirar", emoji: "🌬️", description: "Praticar respiração" },
  { key: "talk_done", label: "Conversar", emoji: "💬", description: "Conversar com alguém" },
] as const;

export { CHECKLIST_ITEMS };

// ─── Wellness Plan ───

export const getWellnessPlan = createServerFn({ method: "GET" })
  .inputValidator(z.object({ accessToken: z.string() }))
  .handler(async ({ data: { accessToken } }: { data: { accessToken: string } }) => {
    const userId = getUserIdFromAccessToken(accessToken);
    if (!userId) return null;

    const supabase = await createClient(accessToken);

    const { data } = await supabase
      .from("wellness_plans")
      .select("id, user_id, goal, custom_goal, start_date, end_date, is_active")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return data as WellnessPlan | null;
  });

export const saveWellnessPlan = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      goal: z.string().min(1),
      customGoal: z.string().optional(),
    }),
  )
  .handler(
    async ({ data }: { data: { accessToken: string; goal: string; customGoal?: string } }) => {
      const userId = getUserIdFromAccessToken(data.accessToken);
      if (!userId) return { error: "Unauthorized" };

      const supabase = await createClient(data.accessToken);

      const today = new Date().toISOString().split("T")[0];

      const { data: existing } = await supabase
        .from("wellness_plans")
        .select("id")
        .eq("user_id", userId)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("wellness_plans")
          .update({ is_active: false, end_date: today })
          .eq("id", existing.id);
      }

      const { data: newPlan } = await supabase
        .from("wellness_plans")
        .insert({
          user_id: userId,
          goal: data.goal,
          custom_goal: data.customGoal ?? "",
          start_date: today,
          is_active: true,
        })
        .select("id, user_id, goal, custom_goal, start_date, end_date, is_active")
        .single();

      void logEvent("info", "wellness-plan.saveWellnessPlan", `Plano criado: ${data.goal}`, { goal: data.goal }, userId);
      return { data: newPlan as WellnessPlan };
    },
  );

// ─── Checklist ───

export const getTodaysChecklist = createServerFn({ method: "GET" })
  .inputValidator(z.object({ accessToken: z.string(), planId: z.string() }))
  .handler(
    async ({ data }: { data: { accessToken: string; planId: string } }) => {
      const userId = getUserIdFromAccessToken(data.accessToken);
      if (!userId) return null;

      const supabase = await createClient(data.accessToken);
      const today = new Date().toISOString().split("T")[0];

      const { data: checklist } = await supabase
        .from("wellness_checklist")
        .select("id, user_id, plan_id, date, water_done, walk_done, breathe_done, talk_done, notes")
        .eq("user_id", userId)
        .eq("date", today)
        .maybeSingle();

      return checklist as WellnessChecklist | null;
    },
  );

export const updateChecklist = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      planId: z.string(),
      waterDone: z.boolean().optional(),
      walkDone: z.boolean().optional(),
      breatheDone: z.boolean().optional(),
      talkDone: z.boolean().optional(),
      notes: z.string().optional(),
    }),
  )
  .handler(
    async ({
      data,
    }: {
      data: {
        accessToken: string;
        planId: string;
        waterDone?: boolean;
        walkDone?: boolean;
        breatheDone?: boolean;
        talkDone?: boolean;
        notes?: string;
      };
    }) => {
      const userId = getUserIdFromAccessToken(data.accessToken);
      if (!userId) return null;

      const supabase = await createClient(data.accessToken);
      const today = new Date().toISOString().split("T")[0];

      const payload: Record<string, unknown> = {
        user_id: userId,
        plan_id: data.planId,
        date: today,
      };
      if (data.waterDone !== undefined) payload.water_done = data.waterDone;
      if (data.walkDone !== undefined) payload.walk_done = data.walkDone;
      if (data.breatheDone !== undefined) payload.breathe_done = data.breatheDone;
      if (data.talkDone !== undefined) payload.talk_done = data.talkDone;
      if (data.notes !== undefined) payload.notes = data.notes;

      const { data: result } = await supabase
        .from("wellness_checklist")
        .upsert(payload, { onConflict: "user_id, date" })
        .select("id, user_id, plan_id, date, water_done, walk_done, breathe_done, talk_done, notes")
        .single();

      return result as WellnessChecklist;
    },
  );

// ─── Progress ───

export const getPlanProgress = createServerFn({ method: "GET" })
  .inputValidator(z.object({ accessToken: z.string(), planId: z.string() }))
  .handler(
    async ({ data }: { data: { accessToken: string; planId: string } }) => {
      const userId = getUserIdFromAccessToken(data.accessToken);
      if (!userId) return null;

      const supabase = await createClient(data.accessToken);

      const [planRes, checklistRes] = await Promise.allSettled([
        supabase
          .from("wellness_plans")
          .select("id, user_id, goal, custom_goal, start_date, end_date, is_active")
          .eq("id", data.planId)
          .maybeSingle(),
        supabase
          .from("wellness_checklist")
          .select("id, user_id, plan_id, date, water_done, walk_done, breathe_done, talk_done, notes")
          .eq("user_id", userId)
          .eq("plan_id", data.planId)
          .order("date", { ascending: true }),
      ]);

      const plan = planRes.status === "fulfilled" ? planRes.value.data : null;
      const checklists = checklistRes.status === "fulfilled" ? (checklistRes.value.data ?? []) : [];

      if (!plan) return null;

      const startDate = new Date(plan.start_date);
      const endDate = plan.end_date ? new Date(plan.end_date) : new Date();
      const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000) + 1);

      const daysWithData = checklists.length;
      const completedDays = checklists.filter(
        (c: WellnessChecklist) => c.water_done && c.walk_done && c.breathe_done && c.talk_done,
      ).length;

      const totalItems = checklists.length * 4;
      const doneItems =
        checklists.filter((c: WellnessChecklist) => c.water_done).length +
        checklists.filter((c: WellnessChecklist) => c.walk_done).length +
        checklists.filter((c: WellnessChecklist) => c.breathe_done).length +
        checklists.filter((c: WellnessChecklist) => c.talk_done).length;

      const completionRate = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

      let currentStreak = 0;
      let bestStreak = 0;
      let tempStreak = 0;
      const sorted = [...checklists].sort(
        (a: WellnessChecklist, b: WellnessChecklist) =>
          new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

      for (const c of sorted) {
        const allDone = c.water_done && c.walk_done && c.breathe_done && c.talk_done;
        if (allDone) {
          tempStreak++;
          bestStreak = Math.max(bestStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
      }

      const today = new Date().toISOString().split("T")[0];
      const todayChecklist = checklists.find(
        (c: WellnessChecklist) => c.date === today,
      );
      const todayAllDone = todayChecklist
        ? todayChecklist.water_done && todayChecklist.walk_done && todayChecklist.breathe_done && todayChecklist.talk_done
        : false;

      currentStreak = todayAllDone ? tempStreak : 0;

      const waterCount = checklists.filter((c: WellnessChecklist) => c.water_done).length;
      const walkCount = checklists.filter((c: WellnessChecklist) => c.walk_done).length;
      const breatheCount = checklists.filter((c: WellnessChecklist) => c.breathe_done).length;
      const talkCount = checklists.filter((c: WellnessChecklist) => c.talk_done).length;

      const n = Math.max(daysWithData, 1);

      return {
        totalDays,
        completedDays,
        completionRate,
        currentStreak,
        bestStreak,
        waterRate: Math.round((waterCount / n) * 100),
        walkRate: Math.round((walkCount / n) * 100),
        breatheRate: Math.round((breatheCount / n) * 100),
        talkRate: Math.round((talkCount / n) * 100),
      } as PlanProgress;
    },
  );

// ─── AI Suggestion ───

export const generatePlanSuggestion = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      plan: z.object({
        goal: z.string(),
        completionRate: z.number(),
        currentStreak: z.number(),
        totalDays: z.number(),
        waterRate: z.number(),
        walkRate: z.number(),
        breatheRate: z.number(),
        talkRate: z.number(),
      }),
    }),
  )
  .handler(
    async ({
      data,
    }: {
      data: {
        accessToken: string;
        plan: {
          goal: string;
          completionRate: number;
          currentStreak: number;
          totalDays: number;
          waterRate: number;
          walkRate: number;
          breatheRate: number;
          talkRate: number;
        };
      };
    }) => {
      try {
        // Sugestão baseada em regras no carregamento — evita 10–15s de LLM na abertura da página
        return { suggestion: generateFallbackSuggestion(data.plan) };
      } catch {
        return { suggestion: generateFallbackSuggestion(data.plan) };
      }
    },
  );

function generateFallbackSuggestion(plan: {
  goal: string;
  completionRate: number;
  currentStreak: number;
  waterRate: number;
  walkRate: number;
  breatheRate: number;
  talkRate: number;
}): string {
  const weakest = [
    { key: "água", rate: plan.waterRate },
    { key: "caminhada", rate: plan.walkRate },
    { key: "respiração", rate: plan.breatheRate },
    { key: "conversa", rate: plan.talkRate },
  ].sort((a, b) => a.rate - b.rate)[0];

  if (plan.completionRate >= 80) {
    if (plan.currentStreak >= 5) {
      return `Você está mantendo uma ótima consistência! Seu plano "${plan.goal}" está no caminho certo. Continue cultivando esse hábito.`;
    }
    return `Excelente progresso no plano! Seu comprometimento está fazendo diferença. Que tal celebrar essa conquista?`;
  }

  if (plan.currentStreak >= 3) {
    return `Bom trabalho mantendo a sequência! Para continuar evoluindo, tente focar em ${weakest.key} — pequenos passos fazem diferença.`;
  }

  if (plan.completionRate < 30) {
    return `Começar é o passo mais importante. Que tal definir um lembrete diário para o seu plano "${plan.goal}"? Um item por vez já conta muito.`;
  }

  return `Você está progredindo no plano "${plan.goal}". Focar em ${weakest.key} pode ajudar a melhorar seu bem-estar geral.`;
}
