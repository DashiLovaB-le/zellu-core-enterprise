import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { MobileTimelinePage } from "@/components/pages/mobile/TimelinePage";
import { DesktopTimelinePage } from "@/components/pages/desktop/TimelinePage";
import { BRANDING } from "@/lib/branding";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useAuth } from "@/lib/auth-context";
import { Icon } from "@/components/Icon";
import { loadTimeline, type TimelineData } from "@/lib/services/timeline-service";
import { saveEntry } from "@/lib/services/diario-service";
import { loadPreventiveAlert, type PreventiveAlert } from "@/lib/services/preventiva-service";
import { PreventiveAlertBanner } from "@/components/PreventiveAlertBanner";

export const Route = createFileRoute("/diario")({
  head: () => ({
    meta: [
      { title: `Meu Diário — ${BRANDING.shortName}` },
      { name: "description", content: "Registre e acompanhe sua evolução emocional." },
    ],
  }),
  component: DiarioPage,
});

function DiarioPage() {
  const { isAuthorized, loading: authLoading } = useRequireAuth("companion");
  const { session } = useAuth();
  const navigate = useNavigate();
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [preventiveAlert, setPreventiveAlert] = useState<PreventiveAlert>({
    type: "none", severity: "none", message: "", suggestion: "",
    details: { sleepChange: 0, moodChange: 0, interactionChange: 0 },
  });
  const [loaded, setLoaded] = useState(false);

  const accessToken = session?.access_token ?? null;

  const loadData = useCallback(async () => {
    if (!accessToken) return;
    const [data, alertResult] = await Promise.all([
      loadTimeline(accessToken),
      loadPreventiveAlert(accessToken),
    ]);
    setTimelineData(data);
    setPreventiveAlert(alertResult);
    setLoaded(true);
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || loaded) return;
    loadData();
  }, [accessToken, loaded, loadData]);

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

  const handleSaveEntry = useCallback(
    async (content: string, mood?: string) => {
      if (!accessToken) return;
      const result = await saveEntry(accessToken, { content, mood });
      if (result.data) {
        loadData();
      }
    },
    [accessToken, loadData],
  );

  if (authLoading || !isAuthorized || !timelineData) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Icon name="sync" className="animate-spin text-3xl text-[var(--clay-title)]" />
      </div>
    );
  }

  return (
    <>
      <div className="block md:hidden">
        <MobileTimelinePage
          data={timelineData}
          onSaveEntry={handleSaveEntry}
          preventiveAlert={preventiveAlert}
          onSuggestionClick={handlePreventiveSuggestion}
        />
      </div>
      <div className="hidden md:block">
        <DesktopTimelinePage
          data={timelineData}
          onSaveEntry={handleSaveEntry}
          preventiveAlert={preventiveAlert}
          onSuggestionClick={handlePreventiveSuggestion}
        />
      </div>
    </>
  );
}
