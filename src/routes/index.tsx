import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { MobileDashboardEmocionalPage } from "@/components/pages/mobile/DashboardEmocionalPage";
import { DesktopDashboardEmocionalPage } from "@/components/pages/desktop/DashboardEmocionalPage";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useAuth } from "@/lib/auth-context";
import { Icon } from "@/components/Icon";
import { loadDashboard, type DashboardData } from "@/lib/services/dashboard-service";
import { generateInsight } from "@/lib/api/insights-ai.server";
import { loadPreventiveAlert, type PreventiveAlert } from "@/lib/services/preventiva-service";
import { PreventiveAlertBanner } from "@/components/PreventiveAlertBanner";
import { loadStreak } from "@/lib/services/streak-service";
import type { StreakData } from "@/lib/api/streak-system.server";
import { MilestoneBanner } from "@/components/MilestoneBanner";
import { BRANDING } from "@/lib/branding";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: BRANDING.shortName },
      { name: "description", content: BRANDING.description },
    ],
  }),
  component: IndexPage,
});

function IndexPage() {
  const { isAuthorized, loading: authLoading } = useRequireAuth("companion");
  const { session } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [aiAnxietyInsight, setAiAnxietyInsight] = useState<string>("");
  const [preventiveAlert, setPreventiveAlert] = useState<PreventiveAlert>({
    type: "none", severity: "none", message: "", suggestion: "",
    details: { sleepChange: 0, moodChange: 0, interactionChange: 0 },
  });
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loaded, setLoaded] = useState(false);

  const navigate = useNavigate();
  const accessToken = session?.access_token ?? null;

  const handlePreventiveSuggestion = useCallback(
    (suggestion: string) => {
      const lower = suggestion.toLowerCase();
      if (lower.includes("respir") || lower.includes("respiração")) {
        navigate({ to: "/respiro" });
      } else if (lower.includes("convers") || lower.includes("conversar")) {
        navigate({ to: "/chat" });
      } else if (lower.includes("caminh") || lower.includes("along") || lower.includes("movimento")) {
        navigate({ to: "/meu-bem-estar" });
      } else if (lower.includes("pausa")) {
        navigate({ to: "/respiro" });
      } else {
        navigate({ to: "/chat" });
      }
    },
    [navigate],
  );

  useEffect(() => {
    if (!accessToken || loaded) return;
    (async () => {
      const [result, alertResult, streakResult] = await Promise.all([
        loadDashboard(accessToken),
        loadPreventiveAlert(accessToken),
        loadStreak(accessToken),
      ]);
      if (streakResult) setStreak(streakResult);
      setData(result);
      setPreventiveAlert(alertResult);
      setLoaded(true);

      // Insight de ansiedade em background — não bloqueia a primeira pintura
      if (result.anxietyChangePercent !== null) {
        try {
          const context = {
            userName: session?.user?.email?.split("@")[0] ?? "Usuário",
            daysTracked: result.daysTracked,
            predominantMood: result.dominantMood,
            moodDistribution: result.currentWeek.moodDistribution,
            avgSleep: result.currentWeek.sleepAvg,
            avgWater: result.currentWeek.waterAvg,
            avgMovement: result.currentWeek.movementAvg,
            anxietyChangePercent: result.anxietyChangePercent,
            contextType: "anxiety-change" as const,
            weeklyComparison: {
              sleep: {
                current: result.currentWeek.sleepAvg,
                previous: result.previousWeek.sleepAvg,
              },
              water: {
                current: result.currentWeek.waterAvg,
                previous: result.previousWeek.waterAvg,
              },
              movement: {
                current: result.currentWeek.movementAvg,
                previous: result.previousWeek.movementAvg,
              },
            },
          };

          const insightResult = await generateInsight({
            data: { accessToken, context },
          });

          if (insightResult.insight) {
            setAiAnxietyInsight(insightResult.insight);
          }
        } catch (error) {
          console.error("Error generating anxiety insight:", error);
        }
      }
    })();
  }, [accessToken, loaded, session]);

  if (authLoading || !isAuthorized || !data) {
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
        <MobileDashboardEmocionalPage
          data={data}
          aiAnxietyInsight={aiAnxietyInsight}
          preventiveAlert={preventiveAlert}
          onSuggestionClick={handlePreventiveSuggestion}
        />
      </div>
      <div className="hidden md:block">
        <DesktopDashboardEmocionalPage
          data={data}
          aiAnxietyInsight={aiAnxietyInsight}
          preventiveAlert={preventiveAlert}
          onSuggestionClick={handlePreventiveSuggestion}
        />
      </div>
    </>
  );
}
