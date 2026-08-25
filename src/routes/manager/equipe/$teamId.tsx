import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { ManagerShell } from "@/components/ManagerShell";
import { Icon } from "@/components/Icon";
import { ClayLoader } from "@/components/ClayLoader";
import { Avatar } from "@/components/Avatar";
import { TeamEditorModal } from "@/components/manager/TeamEditorModal";
import { WellnessStatusBadge } from "@/components/manager/WellnessStatusBadge";
import { useAuth } from "@/lib/auth-context";
import { BRANDING } from "@/lib/branding";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  loadDashboard,
  loadMemberSignals,
  loadTeamRoster,
  saveTeamName,
  setTeamMember,
} from "@/lib/services/manager-service";
import type { DashboardData, ManagerDirectoryMember, ManagerTeamRecord } from "@/lib/api/manager.server";
import type { RhMemberSignalRow } from "@/lib/rh-member-summary";

export const Route = createFileRoute("/manager/equipe/$teamId")({
  head: () => ({
    meta: [{ title: `Equipe — ${BRANDING.shortName}` }],
  }),
  component: ManagerEquipeDetalhe,
});

function ManagerEquipeDetalhe() {
  const { teamId } = useParams({ from: "/manager/equipe/$teamId" });
  const { user, session, loading, role } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [team, setTeam] = useState<ManagerTeamRecord | null>(null);
  const [members, setMembers] = useState<ManagerDirectoryMember[]>([]);
  const [allMembers, setAllMembers] = useState<ManagerDirectoryMember[]>([]);
  const [signals, setSignals] = useState<RhMemberSignalRow[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login", replace: true });
      return;
    }
    if (role === "dev") return;
    if (!loading && user && role && role !== "manager") {
      navigate({ to: role === "admin" ? "/admin" : "/", replace: true });
    }
  }, [user, loading, role, navigate]);

  const refresh = useCallback(async () => {
    if (!session) return;
    const [dash, roster, memberSignals] = await Promise.all([
      loadDashboard(),
      loadTeamRoster(),
      loadMemberSignals(teamId),
    ]);
    if (dash) setDashboard(dash);
    if (roster) {
      setAllMembers(roster.members);
      setTeam(roster.teams.find((t) => t.id === teamId) ?? null);
      setMembers(roster.members.filter((m) => m.team_id === teamId));
    }
    setSignals(memberSignals);
    setReady(true);
  }, [session, teamId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const metrics = useMemo(
    () => dashboard?.teams.find((t) => t.name === team?.name) ?? null,
    [dashboard, team],
  );

  const signalById = useMemo(() => {
    const map = new Map(signals.map((s) => [s.id, s.wellness]));
    return map;
  }, [signals]);

  const candidates = allMembers.filter((m) => m.team_id !== teamId && m.is_active);

  const showMsg = (type: "ok" | "err", text: string) => {
    setMessage({ type, text });
    window.setTimeout(() => setMessage(null), 3200);
  };

  if (loading || !user || (role !== "manager" && role !== "dev")) {
    return (
      <ManagerShell>
        <div className="flex flex-1 items-center justify-center">
          <ClayLoader size="lg" />
        </div>
      </ManagerShell>
    );
  }

  if (ready && !team) {
    return (
      <ManagerShell>
        <p className="text-sm text-[var(--clay-text)]">Equipe não encontrada.</p>
        <Link to="/manager/equipes" className="mt-3 inline-block text-sm font-semibold text-[var(--clay-title)]">
          Voltar às equipes
        </Link>
      </ManagerShell>
    );
  }

  return (
    <ManagerShell>
      <Link
        to="/manager/equipes"
        className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--clay-title)]/70"
      >
        <Icon name="arrow_back" className="text-sm" />
        Equipes
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-[var(--clay-title)]">{team?.name ?? "Equipe"}</h1>
          <p className="mt-1 text-xs text-[var(--clay-text)]/70">
            Visão macro da equipe — sem humor individual, diário ou chat
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex items-center gap-1 rounded-xl bg-white/80 px-3 py-2 text-xs font-semibold shadow-sm"
        >
          <Icon name="edit" className="text-sm" />
          Editar
        </button>
      </div>

      {message && (
        <div
          className={`mt-3 rounded-xl px-3 py-2 text-xs ${
            message.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
          }`}
        >
          {message.text}
        </div>
      )}

      <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MacroCard label="Membros" value={String(members.length)} />
        <MacroCard
          label="Status da equipe"
          value={
            metrics?.metricsHidden
              ? "Oculto"
              : metrics?.stress === "\u2191" || metrics?.energy === "\u2193"
                ? "Atenção"
                : "Estável"
          }
        />
        <MacroCard
          label="Métricas"
          value={metrics?.metricsHidden ? "k-anonimato" : "Visíveis"}
        />
        <MacroCard label="Com opt-in" value={String(signals.filter((s) => s.wellness.available).length)} />
      </section>

      <h2 className="mt-8 text-sm font-bold text-[var(--clay-title)]">Colaboradores</h2>
      <ul className="mt-3 space-y-2">
        {members.map((m) => {
          const wellness = signalById.get(m.id);
          return (
            <li key={m.id}>
              <Link
                to="/manager/colaborador/$profileId"
                params={{ profileId: m.id }}
                className="flex items-center justify-between gap-3 rounded-xl bg-white/70 p-3 shadow-sm active:translate-y-px"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={m.avatar_url ?? undefined} size={40} className="shrink-0" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--clay-title)]">
                      {m.display_name || "Sem nome"}
                    </p>
                    {m.job_title ? (
                      <p className="truncate text-[11px] text-[var(--clay-text)]/60">{m.job_title}</p>
                    ) : null}
                  </div>
                </div>
                <WellnessStatusBadge
                  status={wellness?.status ?? "unknown"}
                  available={wellness?.available}
                />
              </Link>
            </li>
          );
        })}
        {ready && members.length === 0 && (
          <li className="rounded-xl bg-white/70 p-4 text-center text-xs text-[var(--clay-text)]/60">
            Ninguém nesta equipe ainda.
          </li>
        )}
      </ul>

      {editing && team && (
        <TeamEditorModal
          team={team}
          members={members}
          candidates={candidates}
          busy={busy}
          onClose={() => setEditing(false)}
          onRename={async (name) => {
            setBusy(true);
            const result = await saveTeamName(team.id, name);
            setBusy(false);
            if (result.error) {
              showMsg("err", result.error);
              return;
            }
            showMsg("ok", "Nome atualizado");
            await refresh();
          }}
          onAdd={async (profileId) => {
            setBusy(true);
            const result = await setTeamMember(profileId, team.id);
            setBusy(false);
            if (result.error) {
              showMsg("err", result.error);
              return;
            }
            showMsg("ok", "Pessoa adicionada");
            await refresh();
          }}
          onRemove={async (profileId) => {
            setBusy(true);
            const result = await setTeamMember(profileId, null);
            setBusy(false);
            if (result.error) {
              showMsg("err", result.error);
              return;
            }
            showMsg("ok", "Pessoa removida");
            await refresh();
          }}
        />
      )}
    </ManagerShell>
  );
}

function MacroCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/70 p-3 shadow-sm">
      <p className="text-[10px] uppercase tracking-wide text-[var(--clay-text)]/50">{label}</p>
      <p className="mt-1 font-display text-lg text-[var(--clay-title)]">{value}</p>
    </div>
  );
}
