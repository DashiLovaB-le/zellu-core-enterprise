import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ManagerShell } from "@/components/ManagerShell";
import { Icon } from "@/components/Icon";
import { useAuth } from "@/lib/auth-context";
import { BRANDING } from "@/lib/branding";
import { useEffect } from "react";

export const Route = createFileRoute("/manager/equipes")({
  head: () => ({
    meta: [
      { title: `Equipes — ${BRANDING.shortName}` },
    ],
  }),
  component: ManagerEquipes,
});

function ManagerEquipes() {
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
      <h1 className="font-display text-2xl text-[var(--clay-title)]">Equipes</h1>
      <p className="mt-1 text-xs text-[var(--clay-text)]/70">
        Acompanhe o bem-estar por departamento
      </p>

      <div className="mt-6 space-y-3">
        {[
          { name: "Comercial", members: 34, status: "Atenção" },
          { name: "Financeiro", members: 18, status: "Estável" },
          { name: "Produto", members: 22, status: "Monitorar" },
          { name: "Engenharia", members: 45, status: "Estável" },
          { name: "RH", members: 12, status: "Estável" },
          { name: "Marketing", members: 17, status: "Atenção" },
        ].map((team) => (
          <div key={team.name} className="flex items-center justify-between p-4 clay-soft active:translate-y-px">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full clay-cta">
                <Icon name="groups" filled className="text-lg" />
              </div>
              <div>
                <p className="font-display text-sm text-[var(--clay-title)]">{team.name}</p>
                <p className="text-xs text-[var(--clay-text)]/60">{team.members} membros</p>
              </div>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              team.status === "Estável" ? "bg-[var(--clay-joy)]/40 text-green-800" :
              team.status === "Atenção" ? "bg-[var(--clay-anxiety)]/40 text-orange-800" :
              "bg-[var(--clay-stress)]/40 text-yellow-800"
            }`}>
              {team.status}
            </span>
          </div>
        ))}
      </div>
    </ManagerShell>
  );
}
