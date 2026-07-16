import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { MobilePlanoDeCuidadoPage } from "@/components/pages/mobile/PlanoDeCuidadoPage";
import { DesktopPlanoDeCuidadoPage } from "@/components/pages/desktop/PlanoDeCuidadoPage";
import { BRANDING } from "@/lib/branding";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useAuth } from "@/lib/auth-context";
import { Icon } from "@/components/Icon";
import {
  loadWellnessPlan,
  createWellnessPlan,
  loadTodaysChecklist,
  saveChecklist,
  loadPlanProgress,
  loadPlanSuggestion,
  type WellnessPlan,
  type WellnessChecklist,
  type PlanProgress,
} from "@/lib/services/wellness-plan-service";
import { loadStreak } from "@/lib/services/streak-service";
import type { StreakData } from "@/lib/api/streak-system.server";
import { MilestoneBanner } from "@/components/MilestoneBanner";

export const Route = createFileRoute("/plano-de-cuidado")({
  head: () => ({
    meta: [
      { title: `Plano de Cuidado — ${BRANDING.shortName}` },
      { name: "description", content: "Seu plano de cuidado personalizado com objetivo e progresso diário." },
    ],
  }),
  component: PlanoDeCuidadoPage,
});

type ChecklistKey = "water_done" | "walk_done" | "breathe_done" | "talk_done";

function buildInsight(progress: PlanProgress | null, checklist: WellnessChecklist | null): string {
  const todayDone = checklist
    ? [checklist.water_done, checklist.walk_done, checklist.breathe_done, checklist.talk_done].filter(Boolean)
        .length
    : 0;

  if (todayDone === 4) {
    return "Hoje você completou todos os cuidados. Excelente consistência.";
  }
  if (todayDone > 0) {
    return `Hoje: ${todayDone} de 4 feitos. Continue — um item de cada vez já conta.`;
  }
  if (!progress) {
    return "Marque o primeiro cuidado do dia para começar seu progresso.";
  }
  if (progress.completionRate >= 80) {
    return "Você está bem no plano. Mantenha o ritmo com o checklist de hoje.";
  }
  if (progress.currentStreak >= 3) {
    return `Sequência de ${progress.currentStreak} dias. Foque no item mais fácil agora.`;
  }
  const weakest = [
    { label: "água", rate: progress.waterRate },
    { label: "caminhada", rate: progress.walkRate },
    { label: "respiração", rate: progress.breatheRate },
    { label: "conversa", rate: progress.talkRate },
  ].sort((a, b) => a.rate - b.rate)[0];
  return `Sugestão: priorize ${weakest.label} hoje — pequenos passos somam.`;
}

function PlanoDeCuidadoPage() {
  const { isAuthorized, loading: authLoading } = useRequireAuth("companion");
  const { session } = useAuth();
  const navigate = useNavigate();

  const [plan, setPlan] = useState<WellnessPlan | null>(null);
  const [checklist, setChecklist] = useState<WellnessChecklist | null>(null);
  const [progress, setProgress] = useState<PlanProgress | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [goalError, setGoalError] = useState("");
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [confirmNewPlan, setConfirmNewPlan] = useState(false);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const accessToken = session?.access_token ?? null;
  const insight = buildInsight(progress, checklist);

  const refreshSuggestion = useCallback(
    async (activePlan: WellnessPlan, activeProgress: PlanProgress) => {
      if (!accessToken) return;
      const suggestion = await loadPlanSuggestion(accessToken, {
        goal: activePlan.custom_goal || activePlan.goal,
        completionRate: activeProgress.completionRate,
        currentStreak: activeProgress.currentStreak,
        totalDays: activeProgress.totalDays,
        waterRate: activeProgress.waterRate,
        walkRate: activeProgress.walkRate,
        breatheRate: activeProgress.breatheRate,
        talkRate: activeProgress.talkRate,
      });
      setAiSuggestion(suggestion);
    },
    [accessToken],
  );

  const loadData = useCallback(async () => {
    if (!accessToken) return;
    const [currentPlan, streakResult] = await Promise.all([
      loadWellnessPlan(accessToken),
      loadStreak(accessToken),
    ]);
    if (streakResult) setStreak(streakResult);
    setPlan(currentPlan);
    // Sem plano: ir direto para escolha de objetivo
    setShowGoalForm(!currentPlan);
    setConfirmNewPlan(false);

    if (currentPlan) {
      const [currentChecklist, currentProgress] = await Promise.all([
        loadTodaysChecklist(accessToken, currentPlan.id),
        loadPlanProgress(accessToken, currentPlan.id),
      ]);
      setChecklist(currentChecklist);
      setProgress(currentProgress);
      setLoaded(true);

      // IA depois da primeira pintura — não bloqueia
      if (currentProgress) {
        void refreshSuggestion(currentPlan, currentProgress);
      }
    } else {
      setChecklist(null);
      setProgress(null);
      setAiSuggestion("");
      setLoaded(true);
    }
  }, [accessToken, refreshSuggestion]);

  useEffect(() => {
    if (!accessToken || loaded) return;
    void loadData();
  }, [accessToken, loaded, loadData]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const persistChecklist = useCallback(
    async (next: WellnessChecklist, planId: string) => {
      if (!accessToken) return;
      setSaving(true);
      try {
        const saved = await saveChecklist(accessToken, planId, {
          waterDone: next.water_done,
          walkDone: next.walk_done,
          breatheDone: next.breathe_done,
          talkDone: next.talk_done,
        });
        if (saved) setChecklist(saved);
        const refreshedProgress = await loadPlanProgress(accessToken, planId);
        setProgress(refreshedProgress);
      } finally {
        setSaving(false);
      }
    },
    [accessToken],
  );

  const handleSaveGoal = useCallback(
    async (goal: string, customGoal?: string) => {
      if (!accessToken || creating) return;
      setCreating(true);
      setGoalError("");
      try {
        const result = await createWellnessPlan(accessToken, goal, customGoal);
        if (result.error) {
          setGoalError(result.error);
          return;
        }
        if (result.data) {
          setPlan(result.data);
          setShowGoalForm(false);
          setConfirmNewPlan(false);
          setChecklist(null);
          setProgress(null);
          setAiSuggestion("");
          setLoaded(false);
        } else {
          setGoalError("Não foi possível criar o plano. Tente novamente.");
        }
      } catch {
        setGoalError("Erro ao criar o plano. Tente novamente.");
      } finally {
        setCreating(false);
      }
    },
    [accessToken, creating],
  );

  const handleRequestNewPlan = useCallback(() => {
    if (plan) {
      setConfirmNewPlan(true);
    } else {
      setShowGoalForm(true);
    }
  }, [plan]);

  const handleConfirmNewPlan = useCallback(() => {
    setConfirmNewPlan(false);
    setShowGoalForm(true);
  }, []);

  const handleCancelNewPlan = useCallback(() => {
    setConfirmNewPlan(false);
    setShowGoalForm(false);
  }, []);

  const handleToggleItem = useCallback(
    (key: string, value: boolean) => {
      if (!plan) return;
      const checklistKey = key as ChecklistKey;

      setChecklist((prev) => {
        const base: WellnessChecklist = prev ?? {
          id: "",
          user_id: "",
          plan_id: plan.id,
          date: new Date().toISOString().split("T")[0],
          water_done: false,
          walk_done: false,
          breathe_done: false,
          talk_done: false,
          notes: "",
        };
        const next = { ...base, [checklistKey]: value };

        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
          void persistChecklist(next, plan.id);
        }, 250);

        return next;
      });
    },
    [plan, persistChecklist],
  );

  const handleItemAction = useCallback(
    (key: string) => {
      if (key === "breathe_done") {
        navigate({ to: "/respiro" });
        return;
      }
      if (key === "talk_done") {
        navigate({ to: "/chat" });
        return;
      }
      if (key === "walk_done" || key === "water_done") {
        navigate({ to: "/meu-bem-estar" });
      }
    },
    [navigate],
  );

  const handleRefreshSuggestion = useCallback(async () => {
    if (!plan || !progress) return;
    await refreshSuggestion(plan, progress);
  }, [plan, progress, refreshSuggestion]);

  if (authLoading || !isAuthorized || (!loaded && accessToken)) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Icon name="sync" className="animate-spin text-3xl text-[var(--clay-title)]" />
      </div>
    );
  }

  const pageProps = {
    plan,
    checklist,
    progress,
    aiSuggestion,
    insight,
    saving,
    creating,
    goalError,
    showGoalForm,
    confirmNewPlan,
    onShowGoalForm: setShowGoalForm,
    onRequestNewPlan: handleRequestNewPlan,
    onConfirmNewPlan: handleConfirmNewPlan,
    onCancelNewPlan: handleCancelNewPlan,
    onSaveGoal: handleSaveGoal,
    onToggleItem: handleToggleItem,
    onItemAction: handleItemAction,
    onRefreshSuggestion: handleRefreshSuggestion,
  };

  return (
    <>
      {streak && (
        <div className="mx-auto max-w-[440px] px-5 pt-4 md:max-w-none md:px-6">
          <MilestoneBanner
            currentStreak={streak.currentStreak}
            todayActive={streak.todayActive}
            milestones={streak.milestones}
          />
        </div>
      )}
      <div className="block md:hidden">
        <MobilePlanoDeCuidadoPage {...pageProps} />
      </div>
      <div className="hidden md:block">
        <DesktopPlanoDeCuidadoPage {...pageProps} />
      </div>
    </>
  );
}
