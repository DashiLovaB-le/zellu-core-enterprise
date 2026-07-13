import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ManagerShell } from "@/components/ManagerShell";
import { Icon } from "@/components/Icon";
import { useAuth } from "@/lib/auth-context";
import { BRANDING } from "@/lib/branding";
import { useState, useEffect } from "react";
import { loadDashboard } from "@/lib/services/manager-service";
import type { DashboardData } from "@/lib/api/manager.server";

export const Route = createFileRoute("/manager/equipes")({
  head: () => ({
    meta: [{ title: `Equipes — ${BRANDING.shortName}` }],
  }),
  component: ManagerEquipes,
});

function ManagerEquipes() {
  const { user, session, loading, role } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (!loading && (!user || role !== "manager")) {
      navigate({ to: "/login", replace: true });
    }
  }, [user, loading, role, navigate]);

  useEffect(() => {
    if (!session?.access_token || dataLoaded) return;
    (async () => {
      const data = await loadDashboard(session.access_token!);
      if (data) setDashboard(data);
      setDataLoaded(true);
    })();
  }, [session, dataLoaded]);

  if (loading || !user || role !== "manager") {
    return (
      <ManagerShell>
        <div className="flex flex-1 items-center justify-center">
          <Icon name="sync" className="animate-spin text-3xl text-[var(--clay-title)]" />
        </div>
      </ManagerShell>
    );
  }

  const teams = dashboard?.teams ?? [];

  return (
    <ManagerShell>
      <h1 className="font-display text-2xl text-[var(--clay-title)]">Equipes</h1>
      <p className="mt-1 text-xs text-[var(--clay-text)]/70">
        Acompanhe o bem-estar por departamento
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <div
            key={team.name}
            className="flex items-center justify-between p-4 clay-soft active:translate-y-px"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full clay-cta">
                <Icon name="groups" filled className="text-lg" />
              </div>
              <div>
                <p className="font-display text-sm text-[var(--clay-title)]">{team.name}</p>
                <p className="text-xs text-[var(--clay-text)]/60">{team.memberCount} membros</p>
              </div>
            </div>
            <StatusBadge stress={team.stress} energy={team.energy} sleep={team.sleep} />
          </div>
        ))}
      </div>
    </ManagerShell>
  );
}

function StatusBadge({ stress, energy, sleep }: { stress: string; energy: string; sleep: string }) {
  const alerts = [stress, energy, sleep].filter((v) => v === "\u2191" || v === "\u2193").length;
  let status: "Estável" | "Atenção" | "Monitorar";
  if (alerts >= 2) status = "Atenção";
  else if (alerts === 1) status = "Monitorar";
  else status = "Estável";

  const colors = {
    Estável: "bg-[var(--clay-joy)]/40 text-green-800",
    Atenção: "bg-[var(--clay-anxiety)]/40 text-orange-800",
    Monitorar: "bg-[var(--clay-stress)]/40 text-yellow-800",
  };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${colors[status]}`}>{status}</span>
  );
}
