import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { MobileDiarioPage } from "@/components/pages/mobile/DiarioPage";
import { DesktopDiarioPage } from "@/components/pages/desktop/DiarioPage";
import { BRANDING } from "@/lib/branding";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useAuth } from "@/lib/auth-context";
import { Icon } from "@/components/Icon";
import { loadDiaryEntries, saveEntry, type DiaryEntry } from "@/lib/services/diario-service";

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
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  const accessToken = session?.access_token ?? null;

  useEffect(() => {
    if (!accessToken || loaded) return;
    (async () => {
      const data = await loadDiaryEntries(accessToken);
      setEntries(data);
      setLoaded(true);
    })();
  }, [accessToken, loaded]);

  const handleSaveEntry = useCallback(
    async (content: string, mood?: string) => {
      if (!accessToken) return;
      const result = await saveEntry(accessToken, { content, mood });
      if (result.data) {
        setEntries((prev) => [result.data!, ...prev]);
      }
    },
    [accessToken],
  );

  if (authLoading || !isAuthorized) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Icon name="sync" className="animate-spin text-3xl text-[var(--clay-title)]" />
      </div>
    );
  }

  return (
    <>
      <div className="block md:hidden">
        <MobileDiarioPage entries={entries} onSaveEntry={handleSaveEntry} />
      </div>
      <div className="hidden md:block">
        <DesktopDiarioPage entries={entries} onSaveEntry={handleSaveEntry} />
      </div>
    </>
  );
}
