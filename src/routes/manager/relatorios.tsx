import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ManagerShell } from "@/components/ManagerShell";
import { Icon } from "@/components/Icon";
import { useAuth } from "@/lib/auth-context";
import { BRANDING } from "@/lib/branding";
import { useEffect } from "react";

export const Route = createFileRoute("/manager/relatorios")({
  head: () => ({
    meta: [
      { title: `Relatórios — ${BRANDING.shortName}` },
    ],
  }),
  component: ManagerRelatorios,
});

function ManagerRelatorios() {
  const { user, loading, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || role !== "manager")) {
      navigate({ to: "/login", replace: true });
    }
  }, [user, loading, role, navigate]);

  if (loading || !user || role !== "manager") {
    return (
      <ManagerShell>
        <div className="flex flex-1 items-center justify-center">
          <Icon name="sync" className="animate-spin text-3xl text-[var(--clay-title)]" />
        </div>
      </ManagerShell>
    );
  }

  const reports = [
    { name: "Relatório Mensal", desc: "Indicadores agregados do mês", icon: "calendar_month" },
    { name: "Evolução por Equipe", desc: "Comparativo entre departamentos", icon: "trending_up" },
    { name: "Adesão ao Programa", desc: "Taxa de engajamento dos colaboradores", icon: "group_add" },
    { name: "Alertas de Risco", desc: "Equipes com queda consistente", icon: "warning" },
    { name: "Exportar Dados", desc: "CSV com indicadores anônimos", icon: "download" },
  ];

  return (
    <ManagerShell>
      <h1 className="font-display text-2xl text-[var(--clay-title)]">Relatórios</h1>
      <p className="mt-1 text-xs text-[var(--clay-text)]/70">
        Exporte e acompanhe a evolução dos indicadores
      </p>

      <div className="mt-6 space-y-3">
        {reports.map((r) => (
          <button
            key={r.name}
            className="flex w-full items-center gap-4 p-4 text-left clay-soft active:translate-y-px"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full clay-cta">
              <Icon name={r.icon} filled className="text-xl" />
            </div>
            <div className="flex-1">
              <p className="font-display text-sm text-[var(--clay-title)]">{r.name}</p>
              <p className="text-xs text-[var(--clay-text)]/60">{r.desc}</p>
            </div>
            <Icon name="chevron_right" className="text-[var(--clay-title)]/50" />
          </button>
        ))}
      </div>
    </ManagerShell>
  );
}
