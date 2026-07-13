import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ManagerShell } from "@/components/ManagerShell";
import { Icon } from "@/components/Icon";
import { useAuth } from "@/lib/auth-context";
import { BRANDING } from "@/lib/branding";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/manager/")({
  head: () => ({
    meta: [
      { title: `Dashboard RH — ${BRANDING.shortName}` },
      { name: "description", content: "Painel de indicadores de bem-estar." },
    ],
  }),
  component: ManagerDashboard,
});

const TEAMS = [
  { name: "Comercial", stress: "↑", energy: "↓", sleep: "↓", engagement: "↑", color: "var(--clay-anxiety)" },
  { name: "Financeiro", stress: "→", energy: "↑", sleep: "↑", engagement: "↑", color: "var(--clay-joy)" },
  { name: "Produto", stress: "↑", energy: "→", sleep: "↓", engagement: "→", color: "var(--clay-stress)" },
  { name: "Engenharia", stress: "→", energy: "↑", sleep: "→", engagement: "↑", color: "var(--clay-self)" },
];

function ManagerDashboard() {
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

  return (
    <ManagerShell>
      <h1 className="font-display text-2xl text-[var(--clay-title)]">Dashboard RH</h1>
      <p className="mt-1 text-xs text-[var(--clay-text)]/70">
        Indicadores anônimos · {TEAMS.length} equipes
      </p>

      <div className="mt-6 space-y-4">
        {TEAMS.map((team) => (
          <div
            key={team.name}
            className="p-4 clay-card"
            style={{ borderLeft: `4px solid ${team.color}` }}
          >
            <h3 className="font-display text-base text-[var(--clay-title)]">{team.name}</h3>

            <div className="mt-3 grid grid-cols-4 gap-2">
              <Metric label="Estresse" value={team.stress} />
              <Metric label="Energia" value={team.energy} />
              <Metric label="Sono" value={team.sleep} />
              <Metric label="Engajamento" value={team.engagement} />
            </div>
          </div>
        ))}
      </div>

      <section className="mt-6 p-5 clay-card">
        <h3 className="mb-3 font-display text-base text-[var(--clay-title)]">
          Resumo Geral
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--clay-text)]/70">Colaboradores</span>
            <span className="font-semibold text-[var(--clay-text)]">148</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--clay-text)]/70">Check-ins hoje</span>
            <span className="font-semibold text-[var(--clay-text)]">92</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--clay-text)]/70">Adesão semanal</span>
            <span className="font-semibold text-[var(--clay-text)]">76%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--clay-text)]/70">Alertas ativos</span>
            <span className="font-semibold text-[var(--clay-anxiety)]">2</span>
          </div>
        </div>
      </section>
    </ManagerShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const color =
    value === "↑" ? "var(--clay-anxiety)" : value === "↓" ? "var(--clay-text)/50" : "var(--clay-text)/70";
  return (
    <div className="rounded-xl bg-white/50 p-2 text-center">
      <p className="text-[10px] text-[var(--clay-text)]/60">{label}</p>
      <p className="mt-0.5 text-lg font-bold" style={{ color: `var(${color})` }}>{value}</p>
    </div>
  );
}
