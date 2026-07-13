import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { MobileDashboardEmocionalPage } from "@/components/pages/mobile/DashboardEmocionalPage";
import { DesktopDashboardEmocionalPage } from "@/components/pages/desktop/DashboardEmocionalPage";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useAuth } from "@/lib/auth-context";
import { Icon } from "@/components/Icon";
import { loadDashboard, type DashboardData } from "@/lib/services/dashboard-service";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mundo Mental Care" },
      { name: "description", content: "Acompanhe sua evolução emocional com gráficos e insights." },
    ],
  }),
  component: IndexPage,
});

function IndexPage() {
  const { isAuthorized, loading: authLoading } = useRequireAuth("companion");
  const { session } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loaded, setLoaded] = useState(false);

  const accessToken = session?.access_token ?? null;

  useEffect(() => {
    if (!accessToken || loaded) return;
    (async () => {
      const result = await loadDashboard(accessToken);
      setData(result);
      setLoaded(true);
    })();
  }, [accessToken, loaded]);

  if (authLoading || !isAuthorized || !data) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Icon name="sync" className="animate-spin text-3xl text-[var(--clay-title)]" />
      </div>
    );
  }

  return (
    <>
      <div className="block md:hidden">
        <MobileDashboardEmocionalPage data={data} />
      </div>
      <div className="hidden md:block">
        <DesktopDashboardEmocionalPage data={data} />
      </div>
    </>
  );
}
