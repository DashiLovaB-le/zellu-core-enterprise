import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { acceptInvite, getInviteByToken } from "@/lib/api/invites.server";
import { useAuth } from "@/lib/auth-context";
import { ClayLoader, PageLoader } from "@/components/ClayLoader";
import { Mascot } from "@/components/Mascot";
import { Icon } from "@/components/Icon";
import { BRANDING } from "@/lib/branding";
import { CLINICAL_DISCLAIMER } from "@/lib/privacy";

export const Route = createFileRoute("/aceitar-convite")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  head: () => ({
    meta: [
      { title: `Aceitar convite — ${BRANDING.shortName}` },
      { name: "description", content: "Ative sua conta com o convite da empresa." },
    ],
  }),
  component: AcceptInvitePage,
});

const fieldClass =
  "w-full rounded-full border border-[var(--clay-title)]/10 bg-white py-2 text-xs text-[var(--clay-text)] shadow-[inset_2px_2px_5px_rgba(74,106,138,0.06)] outline-none transition-shadow placeholder:text-[var(--clay-title)]/40 focus:border-[var(--clay-cta)]/40 focus:ring-2 focus:ring-[var(--clay-cta)]/25 sm:py-2.5 sm:text-sm";

function AcceptInvitePage() {
  const { token } = Route.useSearch();
  const { signIn, loading: authLoading, user, role } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(!!token);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && role) {
      navigate({ to: role === "manager" ? "/manager" : "/onboarding", replace: true });
    }
  }, [user, role, navigate]);

  useEffect(() => {
    if (!token) {
      setInviteLoading(false);
      setError("Link de convite incompleto.");
      return;
    }
    (async () => {
      setInviteLoading(true);
      setError(null);
      const result = await getInviteByToken({ data: { token } });
      if (result.error || !result.data) {
        setError(result.error ?? "Convite inválido.");
        setInviteLoading(false);
        return;
      }
      setEmail(result.data.email);
      setCompanyName(result.data.companyName);
      setDisplayName(result.data.email.split("@")[0] ?? "");
      setInviteLoading(false);
    })();
  }, [token]);

  if (authLoading || user) {
    return <PageLoader />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || inviteLoading) return;
    setSubmitting(true);
    setError(null);
    const result = await acceptInvite({
      data: { token, password, displayName },
    });
    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }
    const login = await signIn(result.email ?? email, password);
    if (login.error) setError(login.error);
    setSubmitting(false);
  };

  const fieldsDisabled = submitting || inviteLoading || !email;

  return (
    <div className="flex max-h-[100dvh] min-h-[100dvh] items-center justify-center overflow-hidden px-3 py-2 sm:px-5 sm:py-4">
      <div className="w-full max-w-[420px]">
        <div
          className="rounded-[1.25rem] bg-white/90 px-4 py-4 backdrop-blur-sm sm:rounded-[1.75rem] sm:px-6 sm:py-5"
          style={{
            boxShadow:
              "0 6px 24px rgba(74, 106, 138, 0.09), inset 2px 2px 4px rgba(255, 255, 255, 0.9)",
          }}
        >
          <header className="mb-3 flex items-center gap-2.5 sm:mb-4 sm:gap-3">
            <div className="relative shrink-0">
              <span
                aria-hidden
                className="material-symbols-outlined absolute -left-0.5 top-3 hidden text-sm text-[var(--clay-joy)]/70 sm:block"
              >
                celebration
              </span>
              <span
                aria-hidden
                className="material-symbols-outlined absolute -right-0.5 top-2 hidden text-base text-[var(--clay-cta)]/55 sm:block"
              >
                groups
              </span>
              <Mascot pose="cheer" size="sm" className="sm:hidden" />
              <Mascot pose="cheer" size="md" className="hidden sm:block" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <img
                  src="/logo.png"
                  alt=""
                  width={32}
                  height={32}
                  className="size-8 shrink-0 rounded-lg sm:size-9"
                />
                <p className="truncate font-display text-sm leading-tight text-[var(--clay-title)] sm:text-base">
                  {BRANDING.shortName}
                </p>
              </div>
              <p className="mt-0.5 line-clamp-1 text-[10px] leading-snug text-[var(--clay-text)]/60 sm:text-xs">
                {companyName
                  ? `Convite para ${companyName}`
                  : "Ative sua conta com o convite da empresa"}
              </p>
              <p className="mt-1 text-[10px] font-semibold text-[var(--clay-title)]/70 sm:text-xs">
                Aceitar convite · criar senha
              </p>
            </div>
          </header>

          {inviteLoading ? (
            <div className="flex justify-center py-8">
              <ClayLoader size="lg" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-2.5">
              <div>
                <label
                  htmlFor="invite-name"
                  className="mb-0.5 block text-[9px] font-bold uppercase tracking-widest text-[var(--clay-title)]/45 sm:text-[10px]"
                >
                  Seu nome
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--clay-title)]/40 sm:left-3.5">
                    <Icon name="person" className="text-base sm:text-lg" />
                  </span>
                  <input
                    id="invite-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    autoComplete="name"
                    disabled={fieldsDisabled}
                    className={`${fieldClass} pl-9 pr-3 sm:pl-10 sm:pr-4 disabled:cursor-not-allowed disabled:opacity-60`}
                    placeholder="Como quer ser chamado(a)"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="invite-email"
                  className="mb-0.5 block text-[9px] font-bold uppercase tracking-widest text-[var(--clay-title)]/45 sm:text-[10px]"
                >
                  E-mail do convite
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--clay-title)]/40 sm:left-3.5">
                    <Icon name="mail" className="text-base sm:text-lg" />
                  </span>
                  <input
                    id="invite-email"
                    type="email"
                    value={email}
                    readOnly
                    className={`${fieldClass} cursor-default bg-white/60 pl-9 pr-3 text-[var(--clay-title)]/75 sm:pl-10 sm:pr-4`}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="invite-password"
                  className="mb-0.5 block text-[9px] font-bold uppercase tracking-widest text-[var(--clay-title)]/45 sm:text-[10px]"
                >
                  Crie sua senha
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--clay-title)]/40 sm:left-3.5">
                    <Icon name="lock" className="text-base sm:text-lg" />
                  </span>
                  <input
                    id="invite-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    disabled={fieldsDisabled}
                    className={`${fieldClass} pl-9 pr-9 sm:pl-10 sm:pr-10 disabled:cursor-not-allowed disabled:opacity-60`}
                    placeholder="mínimo 8 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    disabled={fieldsDisabled}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-[var(--clay-title)]/40 hover:text-[var(--clay-title)]/65 disabled:opacity-40 sm:right-2.5"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    <Icon name={showPassword ? "visibility_off" : "visibility"} className="text-base" />
                  </button>
                </div>
              </div>

              {error ? (
                <p
                  role="alert"
                  className="rounded-xl bg-red-50 px-2.5 py-1.5 text-center text-[10px] leading-snug text-red-600 sm:text-xs"
                >
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting || !token || !email}
                className="clay-cta w-full py-2 text-xs font-bold active:clay-cta-active disabled:cursor-not-allowed disabled:opacity-50 sm:py-2.5 sm:text-sm"
              >
                {submitting ? "Criando conta…" : "Criar conta e entrar"}
              </button>
            </form>
          )}

          <p className="mt-2 text-center text-[9px] leading-snug text-[var(--clay-title)]/45 sm:mt-3 sm:text-[10px] sm:leading-relaxed">
            {CLINICAL_DISCLAIMER}
          </p>

          <div className="mt-2 border-t border-[var(--clay-title)]/8 pt-2 text-center sm:mt-3 sm:pt-2.5">
            <p className="text-[10px] leading-snug text-[var(--clay-title)]/55">
              Já tem conta?{" "}
              <Link
                to="/login"
                className="font-semibold text-[var(--clay-cta)] underline-offset-2 hover:underline"
              >
                Entrar
              </Link>
              {" · "}
              <Link
                to="/privacidade"
                className="font-semibold text-[var(--clay-cta)] underline-offset-2 hover:underline"
              >
                Privacidade
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
