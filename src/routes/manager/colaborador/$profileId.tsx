import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { ManagerShell } from "@/components/ManagerShell";
import { Icon } from "@/components/Icon";
import { ClayLoader } from "@/components/ClayLoader";
import { WellnessStatusBadge } from "@/components/manager/WellnessStatusBadge";
import { useAuth } from "@/lib/auth-context";
import { BRANDING } from "@/lib/branding";
import { useEffect, useState } from "react";
import { loadMemberSummary, saveMemberJobTitle } from "@/lib/services/manager-service";
import type { RhMemberSummary } from "@/lib/rh-member-summary";
import {
  participationLabelPt,
  sleepSignalLabelPt,
  statusLabelPt,
  trendLabelPt,
} from "@/lib/rh-member-summary";

export const Route = createFileRoute("/manager/colaborador/$profileId")({
  head: () => ({
    meta: [{ title: `Colaborador — ${BRANDING.shortName}` }],
  }),
  component: ManagerColaboradorPage,
});

function ManagerColaboradorPage() {
  const { profileId } = useParams({ from: "/manager/colaborador/$profileId" });
  const { user, session, loading, role } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<RhMemberSummary | null>(null);
  const [ready, setReady] = useState(false);
  const [editingJob, setEditingJob] = useState(false);
  const [jobDraft, setJobDraft] = useState("");
  const [busy, setBusy] = useState(false);
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

  const refresh = async () => {
    const data = await loadMemberSummary(profileId);
    setSummary(data);
    setReady(true);
  };

  useEffect(() => {
    if (!session) return;
    void refresh();
  }, [session, profileId]);

  const handleSaveJob = async () => {
    if (!summary) return;
    setBusy(true);
    setMessage(null);
    const result = await saveMemberJobTitle(profileId, jobDraft);
    setBusy(false);
    if (result.error) {
      setMessage({ type: "err", text: result.error });
      return;
    }
    setEditingJob(false);
    setMessage({ type: "ok", text: "Cargo atualizado" });
    window.setTimeout(() => setMessage(null), 2500);
    await refresh();
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

  return (
    <ManagerShell>
      {summary?.teamId ? (
        <Link
          to="/manager/equipe/$teamId"
          params={{ teamId: summary.teamId }}
          className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--clay-title)]/70"
        >
          <Icon name="arrow_back" className="text-sm" />
          Voltar à equipe
        </Link>
      ) : (
        <Link
          to="/manager/convites"
          className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--clay-title)]/70"
        >
          <Icon name="arrow_back" className="text-sm" />
          Pessoas
        </Link>
      )}

      {ready && !summary && (
        <p className="text-sm text-[var(--clay-text)]">Não foi possível carregar este colaborador.</p>
      )}

      {message && (
        <div
          className={`mb-3 rounded-xl px-3 py-2 text-xs ${
            message.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
          }`}
        >
          {message.text}
        </div>
      )}

      {summary && (
        <>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl text-[var(--clay-title)]">
                {summary.displayName || "Colaborador"}
              </h1>
              <p className="mt-1 text-xs text-[var(--clay-text)]/70">
                {summary.teamName || "Sem equipe"} · {summary.role === "manager" ? "Gestor" : "Colaborador"}
              </p>
            </div>
            <WellnessStatusBadge
              status={summary.wellness.status}
              available={summary.wellness.available}
            />
          </div>

          <section className="mt-5 rounded-2xl bg-white/70 p-4 shadow-sm">
            <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--clay-text)]/50">
              Dados operacionais
            </h2>
            <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="E-mail" value={summary.email || "—"} />
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-[var(--clay-text)]/45">Cargo</dt>
                {editingJob ? (
                  <div className="mt-1 space-y-2">
                    <input
                      value={jobDraft}
                      onChange={(e) => setJobDraft(e.target.value)}
                      maxLength={100}
                      placeholder="Ex.: Analista de RH"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#99BEE5]"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleSaveJob()}
                        className="rounded-lg bg-[var(--clay-cta)] px-3 py-1 text-xs font-bold text-white disabled:opacity-40"
                      >
                        Salvar
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setEditingJob(false)}
                        className="rounded-lg bg-white/70 px-3 py-1 text-xs text-[var(--clay-title)]/60"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <dd className="mt-0.5 flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-[var(--clay-title)]">
                      {summary.jobTitle || "—"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setJobDraft(summary.jobTitle ?? "");
                        setEditingJob(true);
                      }}
                      className="rounded-lg p-1 text-[var(--clay-title)]/50 hover:bg-white/80"
                      aria-label="Editar cargo"
                    >
                      <Icon name="edit" className="text-sm" />
                    </button>
                  </dd>
                )}
              </div>
              <Field label="Situação" value={summary.isActive ? "Ativo" : "Inativo"} />
              <Field
                label="Na plataforma desde"
                value={
                  summary.createdAt ? new Date(summary.createdAt).toLocaleDateString("pt-BR") : "—"
                }
              />
            </dl>
          </section>

          <section className="mt-4 rounded-2xl bg-white/70 p-4 shadow-sm">
            <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--clay-text)]/50">
              Como está
            </h2>
            {summary.wellness.available ? (
              <>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Status" value={statusLabelPt(summary.wellness.status)} />
                  <Field label="Tendência (7 dias)" value={trendLabelPt(summary.wellness.trend)} />
                  <Field
                    label="Participação"
                    value={participationLabelPt(summary.wellness.participation)}
                  />
                  <Field label="Sono (sinal)" value={sleepSignalLabelPt(summary.wellness.sleepSignal)} />
                </div>
                <p className="mt-3 text-sm text-[var(--clay-title)]">{summary.wellness.lastActivity}</p>
                <p className="mt-2 text-[10px] text-[var(--clay-text)]/50">
                  Resumo derivado de check-ins da última semana. Sem humor dia a dia, diário ou conversas.
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-[var(--clay-text)]">
                Esta pessoa não autorizou o resumo de bem-estar para o RH. Só os dados operacionais
                estão visíveis.
              </p>
            )}
          </section>
        </>
      )}
    </ManagerShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wide text-[var(--clay-text)]/45">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-[var(--clay-title)]">{value}</dd>
    </div>
  );
}
