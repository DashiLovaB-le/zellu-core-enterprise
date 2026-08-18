import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { acceptInvite, getInviteByToken } from "@/lib/api/invites.server";
import { useAuth } from "@/lib/auth-context";
import { BRANDING } from "@/lib/branding";
import { Icon } from "@/components/Icon";

export const Route = createFileRoute("/aceitar-convite")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  head: () => ({
    meta: [{ title: `Aceitar convite — ${BRANDING.shortName}` }],
  }),
  component: AcceptInvitePage,
});

function AcceptInvitePage() {
  const { token } = Route.useSearch();
  const { signIn, user, role } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && role) {
      navigate({ to: role === "manager" ? "/manager" : "/onboarding", replace: true });
    }
  }, [user, role, navigate]);

  useEffect(() => {
    if (!token) {
      setError("Link de convite incompleto.");
      return;
    }
    (async () => {
      const result = await getInviteByToken({ data: { token } });
      if (result.error || !result.data) {
        setError(result.error ?? "Convite inválido.");
        return;
      }
      setEmail(result.data.email);
      setCompanyName(result.data.companyName);
      setDisplayName(result.data.email.split("@")[0] ?? "");
    })();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setError(null);
    const result = await acceptInvite({
      data: { token, password, displayName },
    });
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    const login = await signIn(result.email ?? email, password);
    if (login.error) setError(login.error);
    setLoading(false);
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6">
      <div className="mb-8 text-center">
        <h1 className="font-display text-xl text-[var(--clay-title)]">Aceitar convite</h1>
        {companyName && (
          <p className="mt-1 text-sm text-[var(--clay-text)]/70">
            Você foi convidado para {companyName}
          </p>
        )}
      </div>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3">
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          placeholder="Seu nome"
          className="w-full rounded-xl bg-white/70 px-3 py-2.5 text-sm outline-none shadow-sm"
        />
        <input
          type="email"
          value={email}
          readOnly
          className="w-full rounded-xl bg-white/50 px-3 py-2.5 text-sm outline-none shadow-sm"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          placeholder="Senha (mín. 8)"
          className="w-full rounded-xl bg-white/70 px-3 py-2.5 text-sm outline-none shadow-sm"
        />
        {error && <p className="text-center text-xs text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading || !token}
          className="w-full rounded-xl bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] py-2.5 text-sm font-bold text-[oklch(0.25_0.04_254)] disabled:opacity-50"
        >
          {loading ? "Criando conta..." : "Criar conta e entrar"}
        </button>
      </form>
      <Link to="/login" className="mt-5 text-xs text-[var(--clay-cta)] underline">
        Já tenho conta
      </Link>
    </div>
  );
}
