import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
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

function PlanoDeCuidadoPage() {
  const { isAuthorized, loading: authLoading } = useRequireAuth("companion");
  const { session } = useAuth();

  const [plan, setPlan] = useState<WellnessPlan | null>(null);
  const [checklist, setChecklist] = useState<WellnessChecklist | null>(null);
  const [progress, setProgress] = useState<PlanProgress | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [saving, setSaving] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loaded, setLoaded] = useState(false);

  const accessToken = session?.access_token ?? null;

  const loadData = useCallback(async () => {
    if (!accessToken) return;
    const [currentPlan, streakResult] = await Promise.all([
      loadWellnessPlan(accessToken),
      loadStreak(accessToken),
    ]);
    if (streakResult) setStreak(streakResult);
    setPlan(currentPlan);
    setShowGoalForm(!currentPlan);

    if (currentPlan) {
      const [currentChecklist, currentProgress] = await Promise.all([
        loadTodaysChecklist(accessToken, currentPlan.id),
        loadPlanProgress(accessToken, currentPlan.id),
      ]);
      setChecklist(currentChecklist);
      setProgress(currentProgress);
      setLoaded(true);

      if (currentProgress) {
        const suggestion = await loadPlanSuggestion(accessToken, {
          goal: currentPlan.custom_goal || currentPlan.goal,
          completionRate: currentProgress.completionRate,
          currentStreak: currentProgress.currentStreak,
          totalDays: currentProgress.totalDays,
          waterRate: currentProgress.waterRate,
          walkRate: currentProgress.walkRate,
          breatheRate: currentProgress.breatheRate,
          talkRate: currentProgress.talkRate,
        });
        setAiSuggestion(suggestion);
      }
    } else {
      setLoaded(true);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || loaded) return;
    loadData();
  }, [accessToken, loaded, loadData]);

  const handleSaveGoal = useCallback(
    async (goal: string, customGoal?: string) => {
      if (!accessToken) return;
      const result = await createWellnessPlan(accessToken, goal, customGoal);
      if (result.data) {
        setPlan(result.data);
        setShowGoalForm(false);
        setChecklist(null);
        setProgress(null);
        setAiSuggestion("");
        setLoaded(false);
      }
    },
    [accessToken],
  );

  const handleToggleItem = useCallback(
    (key: string, value: boolean) => {
      setChecklist((prev) => {
        if (!prev && !plan) return null;
        const base = prev ?? {
          id: "",
          user_id: "",
          plan_id: plan?.id ?? "",
          date: new Date().toISOString().split("T")[0],
          water_done: false,
          walk_done: false,
          breathe_done: false,
          talk_done: false,
          notes: "",
        };
        return { ...base, [key]: value };
      });
    },
    [plan],
  );

  const handleSaveChecklist = useCallback(async () => {
    if (!accessToken || !plan) return;
    setSaving(true);
    try {
      await saveChecklist(accessToken, plan.id, {
        waterDone: checklist?.water_done ?? false,
        walkDone: checklist?.walk_done ?? false,
        breatheDone: checklist?.breathe_done ?? false,
        talkDone: checklist?.talk_done ?? false,
      });
      const refreshedProgress = await loadPlanProgress(accessToken, plan.id);
      setProgress(refreshedProgress);
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }, [accessToken, plan, checklist]);

  const handleRefreshSuggestion = useCallback(async () => {
    if (!accessToken || !plan || !progress) return;
    const suggestion = await loadPlanSuggestion(accessToken, {
      goal: plan.custom_goal || plan.goal,
      completionRate: progress.completionRate,
      currentStreak: progress.currentStreak,
      totalDays: progress.totalDays,
      waterRate: progress.waterRate,
      walkRate: progress.walkRate,
      breatheRate: progress.breatheRate,
      talkRate: progress.talkRate,
    });
    setAiSuggestion(suggestion);
  }, [accessToken, plan, progress]);

  if (authLoading || !isAuthorized) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Icon name="sync" className="animate-spin text-3xl text-[var(--clay-title)]" />
      </div>
    );
  }

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
        <MobilePlanoDeCuidadoPage
          plan={plan}
          checklist={checklist}
          progress={progress}
          aiSuggestion={aiSuggestion}
          saving={saving}
          showGoalForm={showGoalForm}
          onShowGoalForm={setShowGoalForm}
          onSaveGoal={handleSaveGoal}
          onToggleItem={handleToggleItem}
          onSaveChecklist={handleSaveChecklist}
          onRefreshSuggestion={handleRefreshSuggestion}
        />
      </div>
      <div className="hidden md:block">
        <DesktopPlanoDeCuidadoPage
          plan={plan}
          checklist={checklist}
          progress={progress}
          aiSuggestion={aiSuggestion}
          saving={saving}
          showGoalForm={showGoalForm}
          onShowGoalForm={setShowGoalForm}
          onSaveGoal={handleSaveGoal}
          onToggleItem={handleToggleItem}
          onSaveChecklist={handleSaveChecklist}
          onRefreshSuggestion={handleRefreshSuggestion}
        />
      </div>
    </>
  );
}
