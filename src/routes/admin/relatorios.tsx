import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BRANDING } from "@/lib/branding";
import { AdminPageFrame, AdminSection, useAdminGate } from "@/components/admin/AdminShared";
import { Icon } from "@/components/Icon";
import { downloadAdminCsv, downloadAdminPdf } from "@/lib/services/admin-service";

export const Route = createFileRoute("/admin/relatorios")({
  head: () => ({
    meta: [
      { title: `Relatórios — Admin ${BRANDING.shortName}` },
      { name: "description", content: "Exportação de relatórios PDF e CSV." },
    ],
  }),
  component: AdminRelatoriosPage,
});

function AdminRelatoriosPage() {
  const { session, loading, isAuthorized } = useAdminGate();
  const [periodDays, setPeriodDays] = useState(30);
  const [reportType, setReportType] = useState<"checkins" | "companies" | "employees">(
    "checkins",
  );
  const [busy, setBusy] = useState<"csv" | "pdf" | null>(null);
  const [message, setMessage] = useState("");

  const handleCsv = async () => {
    if (!session) return;
    setBusy("csv");
    setMessage("");
    try {
      const csv = await downloadAdminCsv(periodDays, reportType);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mm-admin-${reportType}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage("CSV baixado com sucesso.");
    } catch {
      setMessage("Falha ao exportar CSV.");
    } finally {
      setBusy(null);
    }
  };

  const handlePdf = async () => {
    if (!session) return;
    setBusy("pdf");
    setMessage("");
    try {
      const pdfBase64 = await downloadAdminPdf(periodDays);
      if (!pdfBase64) {
        setMessage("Falha ao gerar PDF.");
        return;
      }
      const binary = atob(pdfBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mm-admin-relatorio-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage("PDF baixado com sucesso.");
    } catch {
      setMessage("Falha ao exportar PDF.");
    } finally {
      setBusy(null);
    }
  };

  if (loading || !isAuthorized) return <AdminPageFrame loading />;

  return (
    <AdminPageFrame>
      <div>
        <h1 className="font-display text-2xl text-slate-800">Relatórios exportáveis</h1>
        <p className="mt-1 text-xs text-slate-500">
          Exporte dados operacionais em CSV ou um resumo executivo em PDF
        </p>
      </div>

      <AdminSection title="Parâmetros">
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Período (dias)
            </label>
            <select
              value={periodDays}
              onChange={(e) => setPeriodDays(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value={7}>7 dias</option>
              <option value={30}>30 dias</option>
              <option value={90}>90 dias</option>
              <option value={365}>365 dias</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Tipo (CSV)
            </label>
            <select
              value={reportType}
              onChange={(e) =>
                setReportType(e.target.value as "checkins" | "companies" | "employees")
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="checkins">Check-ins</option>
              <option value="companies">Empresas</option>
              <option value="employees">Funcionários</option>
            </select>
          </div>
        </div>
      </AdminSection>

      <AdminSection title="Exportar">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={!!busy}
            onClick={handleCsv}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-slate-300 disabled:opacity-50"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <Icon name="table_chart" className="text-xl" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {busy === "csv" ? "Gerando CSV…" : "Baixar CSV"}
              </p>
              <p className="text-[11px] text-slate-400">
                Dados tabulares para Excel / BI
              </p>
            </div>
          </button>

          <button
            type="button"
            disabled={!!busy}
            onClick={handlePdf}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-slate-300 disabled:opacity-50"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Icon name="picture_as_pdf" className="text-xl" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {busy === "pdf" ? "Gerando PDF…" : "Baixar PDF"}
              </p>
              <p className="text-[11px] text-slate-400">
                Resumo executivo de KPIs e empresas
              </p>
            </div>
          </button>
        </div>
        {message && <p className="mt-3 text-xs text-emerald-600">{message}</p>}
      </AdminSection>
    </AdminPageFrame>
  );
}
