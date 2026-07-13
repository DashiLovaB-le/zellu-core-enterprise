import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ManagerShell } from "@/components/ManagerShell";
import { Icon } from "@/components/Icon";
import { useAuth } from "@/lib/auth-context";
import { BRANDING } from "@/lib/branding";
import { useState, useEffect } from "react";
import { loadDashboard } from "@/lib/services/manager-service";
import type { DashboardData } from "@/lib/api/manager.server";

export const Route = createFileRoute("/manager/")({
  head: () => ({
    meta: [
      { title: `Dashboard RH — ${BRANDING.shortName}` },
      { name: "description", content: "Painel de indicadores de bem-estar." },
    ],
  }),
  component: ManagerDashboard,
});

function ManagerDashboard() {
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
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1">
          <h1 className="font-display text-2xl text-[var(--clay-title)]">Dashboard RH</h1>
          <p className="mt-1 text-xs text-[var(--clay-text)]/70">
            Indicadores anônimos · {teams.length} equipes
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {teams.map((team) => (
              <div
                key={team.name}
                className="p-4 clay-card"
                style={{ borderLeft: `4px solid ${team.color}` }}
              >
                <h3 className="font-display text-base text-[var(--clay-title)]">{team.name}</h3>
                <p className="text-[10px] text-[var(--clay-text)]/50">{team.memberCount} membros</p>

                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Metric label="Estresse" value={team.stress} />
                  <Metric label="Energia" value={team.energy} />
                  <Metric label="Sono" value={team.sleep} />
                  <Metric label="Engajamento" value={team.engagement} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <section className="h-fit w-full shrink-0 p-5 clay-card lg:w-64">
          <h3 className="mb-3 font-display text-base text-[var(--clay-title)]">Resumo Geral</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--clay-text)]/70">Colaboradores</span>
              <span className="font-semibold text-[var(--clay-text)]">
                {dashboard?.totalUsers ?? "—"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--clay-text)]/70">Check-ins hoje</span>
              <span className="font-semibold text-[var(--clay-text)]">
                {dashboard?.checkinsToday ?? "—"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--clay-text)]/70">Adesão semanal</span>
              <span className="font-semibold text-[var(--clay-text)]">
                {dashboard?.weeklyAdhesion ?? "—"}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--clay-text)]/70">Alertas ativos</span>
              <span className="font-semibold text-[var(--clay-anxiety)]">
                {dashboard?.activeAlerts ?? 0}
              </span>
            </div>
          </div>
        </section>
      </div>
    </ManagerShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const color =
    value === "↑"
      ? "var(--clay-anxiety)"
      : value === "↓"
        ? "var(--clay-text)/50"
        : "var(--clay-text)/70";
  return (
    <div className="rounded-xl bg-white/50 p-2 text-center">
      <p className="text-[10px] text-[var(--clay-text)]/60">{label}</p>
      <p className="mt-0.5 text-lg font-bold" style={{ color: `var(${color})` }}>
        {value}
      </p>
    </div>
  );
}
