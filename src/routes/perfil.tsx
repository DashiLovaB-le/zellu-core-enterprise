import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme";
import { useRequireAuth } from "@/lib/use-require-auth";
import { MobileShell } from "@/components/MobileShell";
import { ManagerShell } from "@/components/ManagerShell";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil" },
      { name: "description", content: "Seu perfil e configurações." },
    ],
  }),
  component: PerfilPage,
});

function PerfilPage() {
  const { user, signOut, role } = useAuth();
  const { mode, toggle } = useTheme();
  const { isAuthorized, loading } = useRequireAuth();
  const navigate = useNavigate();

  if (loading || !isAuthorized) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Icon name="sync" className="animate-spin text-3xl text-[var(--clay-title)]" />
      </div>
    );
  }

  const Shell = role === "manager" ? ManagerShell : MobileShell;

  const switchMode = () => {
    const target = role === "manager" ? "/" : "/manager";
    navigate({ to: target, replace: true });
  };

  return (
    <Shell>
      <header className="mb-6">
        <h1 className="font-display text-xl text-[var(--clay-title)]">Perfil</h1>
      </header>

      <section className="mb-5 rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Avatar size={48} />
          <div>
            <h2 className="font-display text-base text-[var(--clay-title)]">
              {user?.email ?? "Convidado"}
            </h2>
            <p className="text-xs text-[var(--clay-title)]/60">
              {role === "manager" ? "RH / Gestor" : "Colaborador"}
            </p>
          </div>
        </div>
      </section>

      <section className="mb-5 rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur-md">
        <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
          Modo de Acesso
        </h3>
        <button
          onClick={switchMode}
          className="flex w-full items-center justify-between rounded-xl bg-white/50 p-3 shadow-sm active:translate-y-px"
        >
          <span className="flex items-center gap-2 text-sm text-[var(--clay-text)]">
            <Icon name={role === "manager" ? "person" : "business"} className="text-sm" />
            {role === "manager" ? "Ir para Companion" : "Ir para Painel RH"}
          </span>
          <Icon name="arrow_forward" className="text-sm text-[var(--clay-title)]/50" />
        </button>
      </section>

      <section className="mb-5 rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur-md">
        <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
          Aparência
        </h3>
        <button
          onClick={toggle}
          className="flex w-full items-center justify-between rounded-xl bg-white/50 p-3 shadow-sm active:translate-y-px"
        >
          <span className="flex items-center gap-2 text-sm text-[var(--clay-text)]">
            <Icon name={mode === "light" ? "light_mode" : "dark_mode"} className="text-sm" />
            Modo {mode === "light" ? "Claro" : "Escuro"}
          </span>
          <span className="text-[10px] text-[var(--clay-title)]/50">Tocar</span>
        </button>
      </section>

      {user && (
        <section className="mb-5 rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur-md">
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
            Conta
          </h3>
          <button
            onClick={() => signOut()}
            className="flex w-full items-center justify-between rounded-xl bg-white/50 p-3 shadow-sm active:translate-y-px"
          >
            <span className="flex items-center gap-2 text-sm text-[var(--clay-text)]">
              <Icon name="logout" className="text-sm" />
              Sair
            </span>
          </button>
        </section>
      )}
    </Shell>
  );
}
