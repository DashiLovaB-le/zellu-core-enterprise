import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme";
import { MobileShell } from "@/components/MobileShell";
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
  const { user, loading, signOut } = useAuth();
  const { mode, toggle } = useTheme();

  if (loading) {
    return (
      <MobileShell>
        <div className="flex flex-1 items-center justify-center">
          <Icon name="sync" className="animate-spin text-3xl text-[var(--clay-title)]" />
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <header className="mb-6">
        <h1 className="font-display text-3xl text-[var(--clay-title)]">Perfil</h1>
      </header>

      <section className="mb-6 p-5 clay-card">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full clay-cta">
            <Icon name="person" filled className="text-3xl" />
          </div>
          <div>
            <h2 className="font-display text-lg text-[var(--clay-title)]">
              {user?.email ?? "Convidado"}
            </h2>
            <p className="text-sm text-[var(--clay-text)]/70">
              {user ? "Logado" : "Não logado"}
            </p>
          </div>
        </div>
      </section>

      <section className="mb-6 p-5 clay-card">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--clay-title)]">
          Aparência
        </h3>
        <button
          onClick={toggle}
          className="flex w-full items-center justify-between rounded-xl p-3 clay-soft active:translate-y-px"
        >
          <span className="flex items-center gap-3 text-sm text-[var(--clay-text)]">
            <Icon name={mode === "light" ? "light_mode" : "dark_mode"} />
            Modo {mode === "light" ? "Claro" : "Escuro"}
          </span>
          <span className="text-xs text-[var(--clay-title)]">Tocar</span>
        </button>
      </section>

      {user && (
        <section className="mb-6 p-5 clay-card">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--clay-title)]">
            Conta
          </h3>
          <button
            onClick={() => signOut()}
            className="flex w-full items-center justify-between rounded-xl p-3 clay-soft active:translate-y-px"
          >
            <span className="flex items-center gap-3 text-sm text-[var(--clay-text)]">
              <Icon name="logout" />
              Sair
            </span>
          </button>
        </section>
      )}
    </MobileShell>
  );
}
