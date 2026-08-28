import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { DevShell } from "@/components/DevShell";
import { Icon } from "@/components/Icon";
import { ClayLoader } from "@/components/ClayLoader";
import { useAuth } from "@/lib/auth-context";
import { BRANDING } from "@/lib/branding";
import { useEffect } from "react";

export const Route = createFileRoute("/dashitecnology/")({
  head: () => ({
    meta: [
      { title: `Dev Tools — ${BRANDING.shortName}` },
      { name: "description", content: "Painel de ferramentas de desenvolvimento." },
    ],
  }),
  component: DevIndex,
});

const PANELS = [
  {
    id: "llm-config",
    icon: "smart_toy",
    label: "LLM Config",
    description:
      "Configuração do modelo de IA via OpenRouter (modelo, temperatura, prompt, chave da API)",
  },
  {
    id: "system-logs",
    icon: "list_alt",
    label: "System Logs",
    description:
      "Visualização de todos os logs do sistema (erros, warnings, eventos)",
  },
];

function DevIndex() {
  const { user, loading, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login", replace: true });
      return;
    }
    
    if (!loading && user && role && role !== "dev") {
      const target = role === "manager" ? "/manager/rh-dashboard" : role === "admin" ? "/dashiadmin" : "/";
      navigate({ to: target, replace: true });
    }
  }, [user, loading, role, navigate]);

  if (loading || !user || role !== "dev") {
    return (
      <DevShell>
        <div className="flex flex-1 items-center justify-center">
          <ClayLoader size="lg" />
        </div>
      </DevShell>
    );
  }

  return (
    <DevShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-2xl text-[var(--clay-title)]">Dev Tools</h1>
          <p className="mt-1 text-xs text-[var(--clay-text)]/70">
            Painéis de configuração e diagnóstico — DashiTecnology
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PANELS.map((panel) => (
            <Link
              key={panel.id}
              to="/dashitecnology/$painelDev"
              params={{ painelDev: panel.id }}
              className="p-4 clay-card hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] text-[oklch(0.25_0.04_254)]">
                  <Icon name={panel.icon} className="text-lg" />
                </span>
                <div>
                  <h3 className="font-display text-base text-[var(--clay-title)]">{panel.label}</h3>
                  <p className="mt-0.5 text-xs text-[var(--clay-text)]/60">{panel.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </DevShell>
  );
}
