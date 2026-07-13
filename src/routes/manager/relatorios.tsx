import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { ManagerShell } from "@/components/ManagerShell";
import { Icon } from "@/components/Icon";
import { useAuth } from "@/lib/auth-context";
import { BRANDING } from "@/lib/branding";
import { loadCheckinStats, downloadCsv } from "@/lib/services/manager-service";

export const Route = createFileRoute("/manager/relatorios")({
  head: () => ({
    meta: [{ title: `Relatórios — ${BRANDING.shortName}` }],
  }),
  component: ManagerRelatorios,
});

function ManagerRelatorios() {
  const { user, session, loading, role } = useAuth();
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || role !== "manager")) {
      navigate({ to: "/login", replace: true });
    }
  }, [user, loading, role, navigate]);

  const handleExport = useCallback(async () => {
    if (!session?.access_token) return;
    setExporting(true);
    setMessage(null);
    try {
      const csv = await downloadCsv(session.access_token, 30);
      if (csv) {
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `relatorio-mm-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        setMessage("CSV exportado com sucesso!");
      } else {
        setMessage("Sem dados para exportar no período.");
      }
    } catch {
      setMessage("Erro ao exportar.");
    } finally {
      setExporting(false);
      setTimeout(() => setMessage(null), 3000);
    }
  }, [session]);

  if (loading || !user || role !== "manager") {
    return (
      <ManagerShell>
        <div className="flex flex-1 items-center justify-center">
          <Icon name="sync" className="animate-spin text-3xl text-[var(--clay-title)]" />
        </div>
      </ManagerShell>
    );
  }

  return (
    <ManagerShell>
      <h1 className="font-display text-2xl text-[var(--clay-title)]">Relatórios</h1>
      <p className="mt-1 text-xs text-[var(--clay-text)]/70">
        Exporte e acompanhe a evolução dos indicadores
      </p>

      {message && (
        <div className="mt-4 rounded-xl bg-white/70 px-4 py-2 text-sm text-[var(--clay-text)] shadow-sm">
          {message}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex w-full items-center gap-4 p-4 text-left clay-soft active:translate-y-px disabled:opacity-50"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full clay-cta">
            <Icon name="calendar_month" filled className="text-xl" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm text-[var(--clay-title)] truncate">
              {exporting ? "Exportando..." : "Relatório Mensal"}
            </p>
            <p className="text-xs text-[var(--clay-text)]/60 truncate">
              Indicadores agregados dos últimos 30 dias
            </p>
          </div>
          <Icon name="chevron_right" className="shrink-0 text-[var(--clay-title)]/50" />
        </button>

        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex w-full items-center gap-4 p-4 text-left clay-soft active:translate-y-px disabled:opacity-50"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full clay-cta">
            <Icon name="download" filled className="text-xl" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm text-[var(--clay-title)] truncate">
              {exporting ? "Exportando..." : "Exportar Dados"}
            </p>
            <p className="text-xs text-[var(--clay-text)]/60 truncate">
              CSV com indicadores anônimos
            </p>
          </div>
          <Icon name="chevron_right" className="shrink-0 text-[var(--clay-title)]/50" />
        </button>
      </div>
    </ManagerShell>
  );
}
