import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { MobileTimelinePage } from "@/components/pages/mobile/TimelinePage";
import { DesktopTimelinePage } from "@/components/pages/desktop/TimelinePage";
import { BRANDING } from "@/lib/branding";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useAuth } from "@/lib/auth-context";
import { Icon } from "@/components/Icon";
import { loadTimeline, type TimelineData } from "@/lib/services/timeline-service";
import { saveEntry } from "@/lib/services/diario-service";

export const Route = createFileRoute("/diario")({
  head: () => ({
    meta: [
      { title: `Meu Diário — ${BRANDING.shortName}` },
      { name: "description", content: "Olhe para trás com carinho e autocompreensão." },
    ],
  }),
  component: DiarioPage,
});

function DiarioPage() {
  const { isAuthorized, loading: authLoading } = useRequireAuth("companion");
  const { session } = useAuth();
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [loaded, setLoaded] = useState(false);

  const accessToken = session?.access_token ?? null;

  const loadData = useCallback(async () => {
    if (!accessToken) return;
    const data = await loadTimeline(accessToken);
    setTimelineData(data);
    setLoaded(true);
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || loaded) return;
    loadData();
  }, [accessToken, loaded, loadData]);

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
        <MobileTimelinePage data={timelineData} onSaveEntry={handleSaveEntry} />
      </div>
      <div className="hidden md:block">
        <DesktopTimelinePage data={timelineData} onSaveEntry={handleSaveEntry} />
      </div>
    </>
  );
}
