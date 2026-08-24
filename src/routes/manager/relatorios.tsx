import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { ManagerShell } from "@/components/ManagerShell";
import { Icon } from "@/components/Icon";
import { useAuth } from "@/lib/auth-context";
import { BRANDING } from "@/lib/branding";
import {
  downloadCsv,
  loadRhReportPreview,
  loadTeamRoster,
  type RhReportPreviewPayload,
} from "@/lib/services/manager-service";
import {
  REPORT_CATALOG,
  REPORT_PERIODS,
  type ReportPeriodDays,
  type ReportType,
} from "@/lib/rh-reports";

export const Route = createFileRoute("/manager/relatorios")({
  head: () => ({
    meta: [{ title: `Relatórios — ${BRANDING.shortName}` }],
  }),
  component: ManagerRelatorios,
});

function ManagerRelatorios() {
  const { user, session, loading, role } = useAuth();
  const navigate = useNavigate();

  const [periodDays, setPeriodDays] = useState<ReportPeriodDays>(30);
  const [teamName, setTeamName] = useState<string>("");
  const [reportType, setReportType] = useState<ReportType>("teams");
  const [teamOptions, setTeamOptions] = useState<string[]>([]);
  const [previewPayload, setPreviewPayload] = useState<RhReportPreviewPayload | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!session) return;
    void (async () => {
      const roster = await loadTeamRoster();
      const names = (roster?.teams ?? []).map((t) => t.name).filter(Boolean);
      setTeamOptions(names);
    })();
  }, [session]);

  const refreshPreview = useCallback(async () => {
    if (!session) return;
    setLoadingPreview(true);
    setError(null);
    try {
      const data = await loadRhReportPreview({
        periodDays,
        teamName: teamName || null,
        reportType,
      });
      if (!data) {
        setPreviewPayload(null);
        setError("Não foi possível carregar a prévia.");
        return;
      }
      setPreviewPayload(data);
    } catch {
      setPreviewPayload(null);
      setError("Erro ao carregar a prévia.");
    } finally {
      setLoadingPreview(false);
    }
  }, [session, periodDays, teamName, reportType]);

  useEffect(() => {
    void refreshPreview();
  }, [refreshPreview]);

  const flash = (ok: string | null, err: string | null) => {
    setMessage(ok);
    setError(err);
    window.setTimeout(() => {
      setMessage(null);
      setError(null);
    }, 3500);
  };

  const handleExportCsv = async () => {
    if (!session) return;
    setExportingCsv(true);
    try {
      const csv = await downloadCsv(periodDays, {
        teamName: teamName || null,
        reportType,
      });
      if (!csv) {
        flash(null, "Sem dados para exportar no recorte.");
        return;
      }
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-rh-${reportType}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      flash("CSV exportado com sucesso.", null);
    } catch {
      flash(null, "Erro ao exportar CSV.");
    } finally {
      setExportingCsv(false);
    }
  };

  const handleExportPdf = async () => {
    if (!previewPayload) return;
    setExportingPdf(true);
    try {
      const { downloadRhReportPdf } = await import("@/lib/rh-report-pdf");
      await downloadRhReportPdf({
        reportType: previewPayload.reportType,
        periodDays: previewPayload.periodDays,
        teamName: previewPayload.teamName,
        current: previewPayload.current,
        previous: previewPayload.previous,
        exportedBy: user?.email ?? null,
      });
      flash("PDF exportado com sucesso.", null);
    } catch (err) {
      console.error(err);
      flash(null, "Não foi possível gerar o PDF.");
    } finally {
      setExportingPdf(false);
    }
  };

  if (loading || !user || (role !== "manager" && role !== "dev")) {
    return (
      <ManagerShell>
        <div className="flex flex-1 items-center justify-center">
          <Icon name="sync" className="animate-spin text-3xl text-[var(--clay-title)]" />
        </div>
      </ManagerShell>
    );
  }

  const preview = previewPayload?.preview;

  return (
    <ManagerShell>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-[var(--clay-title)]">Relatórios</h1>
          <p className="mt-1 text-xs text-[var(--clay-text)]/70">
            Filtre, visualize a prévia e exporte CSV ou PDF — apenas dados agregados com opt-in RH
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={exportingCsv || loadingPreview}
            onClick={() => void handleExportCsv()}
            className="flex items-center gap-2 rounded-xl bg-white/70 px-4 py-2 text-xs font-semibold text-[var(--clay-title)] shadow-sm disabled:opacity-50"
          >
            <Icon
              name={exportingCsv ? "sync" : "download"}
              className={`text-base ${exportingCsv ? "animate-spin" : ""}`}
            />
            {exportingCsv ? "Exportando…" : "Exportar CSV"}
          </button>
          <button
            type="button"
            disabled={!previewPayload || exportingPdf || loadingPreview}
            onClick={() => void handleExportPdf()}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] px-4 py-2 text-xs font-semibold text-[oklch(0.25_0.04_254)] shadow-sm disabled:opacity-50"
          >
            <Icon
              name={exportingPdf ? "sync" : "picture_as_pdf"}
              className={`text-base ${exportingPdf ? "animate-spin" : ""}`}
            />
            {exportingPdf ? "Gerando PDF…" : "Exportar PDF"}
          </button>
        </div>
      </div>

      {(message || error) && (
        <div
          className={`mt-4 rounded-xl px-4 py-2 text-sm shadow-sm ${
            error
              ? "bg-amber-50 text-amber-900"
              : "bg-white/70 text-[var(--clay-text)]"
          }`}
        >
          {error ?? message}
        </div>
      )}

      <section className="mt-6 space-y-3">
        <h2 className="font-display text-sm text-[var(--clay-title)]">Filtros</h2>
        <div className="flex flex-wrap gap-3">
          <label className="flex min-w-[140px] flex-1 flex-col gap-1 text-xs text-[var(--clay-text)]/70">
            Período
            <select
              value={periodDays}
              onChange={(e) => setPeriodDays(Number(e.target.value) as ReportPeriodDays)}
              className="rounded-xl border-0 bg-white/70 px-3 py-2 text-sm text-[var(--clay-title)] shadow-sm"
            >
              {REPORT_PERIODS.map((d) => (
                <option key={d} value={d}>
                  Últimos {d} dias
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-[160px] flex-1 flex-col gap-1 text-xs text-[var(--clay-text)]/70">
            Equipe
            <select
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="rounded-xl border-0 bg-white/70 px-3 py-2 text-sm text-[var(--clay-title)] shadow-sm"
            >
              <option value="">Todas as equipes</option>
              {teamOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="mt-6 space-y-3">
        <h2 className="font-display text-sm text-[var(--clay-title)]">Tipo de relatório</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {REPORT_CATALOG.map((item) => {
            const active = reportType === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setReportType(item.id)}
                className={`flex w-full items-start gap-3 p-4 text-left transition ${
                  active
                    ? "clay-cta ring-2 ring-[#99BEE5]/60"
                    : "clay-soft active:translate-y-px"
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/50">
                  <Icon name={item.icon} filled className="text-lg" />
                </div>
                <div className="min-w-0">
                  <p className="font-display text-sm text-[var(--clay-title)]">{item.title}</p>
                  <p className="mt-0.5 text-xs text-[var(--clay-text)]/65">{item.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-8 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-sm text-[var(--clay-title)]">
            Prévia {preview ? `— ${preview.title}` : ""}
          </h2>
          {loadingPreview && (
            <Icon name="sync" className="animate-spin text-lg text-[var(--clay-title)]" />
          )}
        </div>

        {preview && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {preview.kpis.map((kpi) => (
                <div key={kpi.label} className="rounded-2xl bg-white/60 p-3 shadow-sm">
                  <p className="text-[10px] uppercase tracking-wide text-[var(--clay-text)]/55">
                    {kpi.label}
                  </p>
                  <p className="mt-1 font-display text-xl text-[var(--clay-title)]">{kpi.value}</p>
                  {kpi.hint ? (
                    <p className="mt-0.5 text-[11px] text-[var(--clay-text)]/60">{kpi.hint}</p>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="overflow-x-auto rounded-2xl bg-white/60 p-3 shadow-sm">
              <table className="min-w-full text-left text-xs text-[var(--clay-text)]">
                <thead>
                  <tr className="border-b border-[var(--clay-title)]/10">
                    {preview.table.headers.map((h) => (
                      <th key={h} className="px-2 py-2 font-semibold text-[var(--clay-title)]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.table.rows.map((row, i) => (
                    <tr key={i} className="border-b border-[var(--clay-title)]/5 last:border-0">
                      {row.map((cell, j) => (
                        <td key={j} className="px-2 py-2 align-top">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="space-y-1 text-[11px] text-[var(--clay-text)]/65">
              {preview.notes.map((note) => (
                <li key={note}>• {note}</li>
              ))}
            </ul>
          </>
        )}

        {!preview && !loadingPreview && (
          <p className="text-sm text-[var(--clay-text)]/70">Nenhuma prévia disponível.</p>
        )}
      </section>
    </ManagerShell>
  );
}
