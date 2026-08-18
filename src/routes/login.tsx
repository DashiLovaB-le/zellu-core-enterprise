import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import * as React from "react";
import { useAuth } from "@/lib/auth-context";
import { Icon } from "@/components/Icon";
import { BRANDING } from "@/lib/branding";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: `Entrar — ${BRANDING.shortName}` },
      { name: "description", content: BRANDING.tagline },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { signIn, loading, user, role } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (user && role) {
      const target =
        role === "admin" ? "/admin" : role === "manager" ? "/manager" : "/";
      navigate({ to: target, replace: true });
    }
  }, [user, role, navigate]);

  if (user && role) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Icon name="sync" className="animate-spin text-3xl text-[var(--clay-title)]" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = await signIn(email, password);
    if (result.error) setError(result.error);
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6">
      <div className="mb-8 flex flex-col items-center gap-3">
        <img src="/logo.png" alt={BRANDING.appName} width={56} height={56} className="rounded-2xl" />
        <h1 className="font-display text-xl text-[var(--clay-title)]">{BRANDING.shortName}</h1>
        <p className="text-center text-sm text-[var(--clay-text)]/70">{BRANDING.tagline}</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3">
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
            E-mail
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl bg-white/70 px-3 py-2.5 text-sm text-[var(--clay-text)] outline-none shadow-sm placeholder:text-[var(--clay-title)]/50"
            placeholder="seu@email.com"
          />
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
            Senha
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-xl bg-white/70 px-3 py-2.5 text-sm text-[var(--clay-text)] outline-none shadow-sm placeholder:text-[var(--clay-title)]/50"
            placeholder="mínimo 8 caracteres"
          />
        </div>

        {error && <p className="text-center text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] py-2.5 text-sm font-bold text-[oklch(0.25_0.04_254)] shadow-sm active:translate-y-px disabled:opacity-50"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-[var(--clay-title)]/60">
        Acesso por convite da sua empresa.{" "}
        <Link to="/aceitar-convite" search={{ token: "" }} className="font-semibold text-[var(--clay-cta)] underline">
          Recebi um convite
        </Link>
        {" · "}
        <Link to="/privacidade" className="font-semibold text-[var(--clay-cta)] underline">
          Privacidade
        </Link>
      </p>
    </div>
  );
}
