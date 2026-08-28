import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ManagerShell } from "@/components/ManagerShell";
import { Icon } from "@/components/Icon";
import { ClayLoader } from "@/components/ClayLoader";
import { useAuth } from "@/lib/auth-context";
import { BRANDING } from "@/lib/branding";
import { useCallback, useEffect, useMemo, useState } from "react";
import { loadDashboard, loadTeamRoster } from "@/lib/services/manager-service";
import type { DashboardData, ManagerDirectoryMember, ManagerTeamRecord } from "@/lib/api/manager.server";

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
  const [teams, setTeams] = useState<ManagerTeamRecord[]>([]);
  const [members, setMembers] = useState<ManagerDirectoryMember[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login", replace: true });
      return;
    }

    if (role === "dev") return;

    if (!loading && user && role && role !== "manager") {
      navigate({ to: role === "admin" ? "/dashiadmin" : "/", replace: true });
    }
  }, [user, loading, role, navigate]);

  const refresh = useCallback(async () => {
    if (!session) return;
    const [dash, roster] = await Promise.all([loadDashboard(), loadTeamRoster()]);
    if (dash) setDashboard(dash);
    if (roster) {
      setTeams(roster.teams);
      setMembers(roster.members);
    }
    setDataLoaded(true);
  }, [session]);

  useEffect(() => {
    if (!session || dataLoaded) return;
    void refresh();
  }, [session, dataLoaded, refresh]);

  const metricsByName = useMemo(() => {
    const map = new Map<string, DashboardData["teams"][number]>();
    for (const t of dashboard?.teams ?? []) map.set(t.name, t);
    return map;
  }, [dashboard]);

  if (loading || !user || (role !== "manager" && role !== "dev")) {
    return (
      <ManagerShell>
        <div className="flex flex-1 items-center justify-center">
          <ClayLoader size="lg" />
        </div>
      </ManagerShell>
    );
  }

  return (
    <ManagerShell>
      <h1 className="font-display text-2xl text-[var(--clay-title)]">Equipes</h1>
      <p className="mt-1 text-xs text-[var(--clay-text)]/70">
        Toque no card para ver o resumo da equipe e os colaboradores
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => {
          const metrics = metricsByName.get(team.name);
          const count = members.filter((m) => m.team_id === team.id).length;
          return (
            <Link
              key={team.id}
              to="/manager/equipe/$teamId"
              params={{ teamId: team.id }}
              className="flex flex-col gap-3 p-4 clay-soft active:translate-y-px"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full clay-cta">
                    <Icon name="groups" filled className="text-lg" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm text-[var(--clay-title)]">{team.name}</p>
                    <p className="text-xs text-[var(--clay-text)]/60">
                      {metrics?.metricsHidden
                        ? `${count} membros · métricas ocultas (k-anonimato)`
                        : `${count} membros`}
                    </p>
                  </div>
                </div>
                {metrics && (
                  <TeamMacroBadge stress={metrics.stress} energy={metrics.energy} sleep={metrics.sleep} />
                )}
              </div>
              <span className="text-center text-[11px] font-semibold text-[var(--clay-title)]/70">
                Ver detalhes da equipe
              </span>
            </Link>
          );
        })}
        {teams.length === 0 && dataLoaded && (
          <p className="col-span-full text-sm text-[var(--clay-text)]/60">
            Nenhuma equipe cadastrada. Peça ao admin para criar equipes em Funcionários.
          </p>
        )}
      </div>
    </ManagerShell>
  );
}

function TeamMacroBadge({ stress, energy, sleep }: { stress: string; energy: string; sleep: string }) {
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
    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${colors[status]}`}>{status}</span>
  );
}
