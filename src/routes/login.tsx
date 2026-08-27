import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { PageLoader } from "@/components/ClayLoader";
import { Mascot } from "@/components/Mascot";
import { Icon } from "@/components/Icon";
import { BRANDING } from "@/lib/branding";
import { CLINICAL_DISCLAIMER } from "@/lib/privacy";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: `Entrar — ${BRANDING.shortName}` },
      { name: "description", content: BRANDING.tagline },
    ],
  }),
  component: LoginPage,
});

const fieldClass =
  "w-full rounded-full border border-[var(--clay-title)]/10 bg-white py-2 text-xs text-[var(--clay-text)] shadow-[inset_2px_2px_5px_rgba(74,106,138,0.06)] outline-none transition-shadow placeholder:text-[var(--clay-title)]/40 focus:border-[var(--clay-cta)]/40 focus:ring-2 focus:ring-[var(--clay-cta)]/25 sm:py-2.5 sm:text-sm";

function LoginPage() {
  const { signIn, loading, user, role } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && role) {
      const target =
        role === "admin" ? "/admin" : role === "manager" ? "/manager/rh-dashboard" : "/";
      navigate({ to: target, replace: true });
    }
  }, [user, role, navigate]);

  if (loading || user) {
    return <PageLoader />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await signIn(email, password);
    if (result.error) setError(result.error);
    setSubmitting(false);
  };

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
                className="material-symbols-outlined absolute -left-0.5 top-3 hidden text-sm text-[var(--clay-anxiety)]/60 sm:block"
              >
                favorite
              </span>
              <span
                aria-hidden
                className="material-symbols-outlined absolute -right-0.5 top-2 hidden text-base text-[var(--clay-self)]/50 sm:block"
              >
                psychology
              </span>
              <Mascot pose="wave" size="sm" className="sm:hidden" />
              <Mascot pose="wave" size="md" className="hidden sm:block" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <img
                  src={BRANDING.logoMark}
                  alt=""
                  width={32}
                  height={32}
                  className="size-8 shrink-0 rounded-lg sm:size-9"
                />
                <h1 className="truncate font-display text-sm leading-tight text-[var(--clay-title)] sm:text-base">
                  {BRANDING.shortName}
                </h1>
              </div>
              <p className="mt-0.5 line-clamp-1 text-[10px] leading-snug text-[var(--clay-text)]/60 sm:text-xs">
                {BRANDING.tagline}
              </p>
              <p className="mt-1 text-[10px] font-semibold text-[var(--clay-title)]/70 sm:text-xs">
                Entrar · e-mail corporativo
              </p>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-2.5">
            <div>
              <label
                htmlFor="login-email"
                className="mb-0.5 block text-[9px] font-bold uppercase tracking-widest text-[var(--clay-title)]/45 sm:text-[10px]"
              >
                E-mail
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--clay-title)]/40 sm:left-3.5">
                  <Icon name="person" className="text-base sm:text-lg" />
                </span>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className={`${fieldClass} pl-9 pr-3 sm:pl-10 sm:pr-4`}
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="mb-0.5 block text-[9px] font-bold uppercase tracking-widest text-[var(--clay-title)]/45 sm:text-[10px]"
              >
                Senha
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--clay-title)]/40 sm:left-3.5">
                  <Icon name="lock" className="text-base sm:text-lg" />
                </span>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="current-password"
                  className={`${fieldClass} pl-9 pr-9 sm:pl-10 sm:pr-10`}
                  placeholder="mínimo 8 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-[var(--clay-title)]/40 hover:text-[var(--clay-title)]/65 sm:right-2.5"
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
              disabled={submitting}
              className="clay-cta w-full py-2 text-xs font-bold active:clay-cta-active disabled:cursor-not-allowed disabled:opacity-50 sm:py-2.5 sm:text-sm"
            >
              {submitting ? "Entrando…" : "Entrar"}
            </button>
          </form>

          <p className="mt-2 text-center text-[9px] leading-snug text-[var(--clay-title)]/45 sm:mt-3 sm:text-[10px] sm:leading-relaxed">
            {CLINICAL_DISCLAIMER}
          </p>

          <div className="mt-2 border-t border-[var(--clay-title)]/8 pt-2 text-center sm:mt-3 sm:pt-2.5">
            <p className="text-[10px] leading-snug text-[var(--clay-title)]/55">
              Acesso por convite da sua empresa.{" "}
              <Link
                to="/aceitar-convite"
                search={{ token: "" }}
                className="font-semibold text-[var(--clay-cta)] underline-offset-2 hover:underline"
              >
                Recebi um convite
              </Link>
              {" · "}
              <Link
                to="/privacidade"
                className="font-semibold text-[var(--clay-cta)] underline-offset-2 hover:underline"
              >
                Privacidade
              </Link>
              {" · "}
              <Link
                to="/sobre"
                className="font-semibold text-[var(--clay-cta)] underline-offset-2 hover:underline"
              >
                Como funciona
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
