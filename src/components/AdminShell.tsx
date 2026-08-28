import { Link, useRouterState, type LinkProps } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Icon } from "./Icon";
import { Avatar } from "./Avatar";
import { BRANDING } from "@/lib/branding";
import { useAuth } from "@/lib/auth-context";
import logo from "@/assets/logo-zellu/icone-app.svg";

interface NavItem {
  to: LinkProps["to"];
  icon: string;
  label: string;
  short?: string;
}

const NAV: NavItem[] = [
  { to: "/admin", icon: "dashboard", label: "KPIs", short: "KPIs" },
  { to: "/admin/leads", icon: "inbox", label: "Leads", short: "Leads" },
  { to: "/admin/empresas", icon: "apartment", label: "Empresas", short: "Empresas" },
  { to: "/admin/funcionarios", icon: "badge", label: "Funcionários", short: "Pessoas" },
  { to: "/admin/licencas", icon: "verified", label: "Licenças", short: "Licenças" },
  { to: "/admin/metricas", icon: "monitoring", label: "Métricas", short: "Uso" },
  { to: "/admin/sentimentos", icon: "sentiment_satisfied", label: "Sentimentos", short: "Humor" },
  { to: "/admin/alertas", icon: "notifications_active", label: "Alertas", short: "Alertas" },
  { to: "/admin/relatorios", icon: "download", label: "Relatórios", short: "Export" },
];

function isActive(pathname: string, to: string) {
  if (to === "/admin") return pathname === "/admin" || pathname === "/admin/";
  return pathname.startsWith(to);
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();

  return (
    <>
      {/* Mobile */}
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[440px] flex-col px-4 pb-32 pt-5 md:hidden">
        <header className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt={BRANDING.appName} className="h-8 w-8" />
            <div>
              <span className="font-display text-sm text-[var(--clay-title)]">
                Portal Admin
              </span>
              <p className="text-[10px] text-[var(--clay-title)]/50">{BRANDING.shortName}</p>
            </div>
          </div>
          <Link to="/perfil">
            <Avatar name={user?.avatar_url ?? undefined} size={32} />
          </Link>
        </header>

        {children}

        <footer className="fixed bottom-[88px] left-1/2 z-40 -translate-x-1/2 text-center md:hidden">
          <p className="text-[9px] text-[var(--clay-title)]/25">{BRANDING.poweredBy}</p>
        </footer>

        <nav className="fixed bottom-2 left-1/2 z-50 flex h-[72px] w-[calc(100%-1rem)] max-w-[420px] -translate-x-1/2 items-center gap-0.5 overflow-x-auto rounded-2xl bg-slate-900/95 px-1.5 shadow-lg backdrop-blur-lg md:hidden">
          {NAV.map((item) => {
            const active = isActive(pathname, item.to as string);
            return (
              <Link
                key={item.to}
                to={item.to}
                className="flex min-w-[52px] flex-1 flex-col items-center justify-center gap-0.5 px-0.5"
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                    active
                      ? "bg-sky-500/30 text-sky-100"
                      : "text-slate-400"
                  }`}
                >
                  <Icon name={item.icon} filled={active} className="text-base" />
                </span>
                <span
                  className={`text-[8px] font-semibold tracking-wide ${
                    active ? "text-sky-100" : "text-slate-500"
                  }`}
                >
                  {item.short ?? item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Desktop — painel B2B limpo */}
      <div className="hidden min-h-screen bg-slate-50 md:block">
        <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-6">
            <Link to="/admin" className="flex items-center gap-2.5">
              <img src={logo} alt={BRANDING.appName} className="h-8 w-8" />
              <div className="leading-tight">
                <span className="font-display text-sm text-slate-800">
                  {BRANDING.shortName}
                </span>
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  Portal Administrativo
                </p>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Super-admin
              </span>
              <Link to="/perfil">
                <Avatar name={user?.avatar_url ?? undefined} size={32} />
              </Link>
            </div>
          </div>
        </header>

        <div className="mx-auto flex max-w-[1400px] gap-6 px-6 py-6">
          <aside className="sticky top-20 h-fit w-56 shrink-0 rounded-xl border border-slate-200/80 bg-white p-2 shadow-sm">
            <nav className="flex flex-col gap-0.5">
              {NAV.map((item) => {
                const active = isActive(pathname, item.to as string);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                      active
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Icon name={item.icon} filled={active} className="text-[18px]" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-3 border-t border-slate-100 pt-2">
              <Link
                to="/manager/rh-dashboard"
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <Icon name="groups" className="text-[18px]" />
                Painel RH
              </Link>
              <Link
                to="/"
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <Icon name="arrow_back" className="text-[18px]" />
                App colaborador
              </Link>
            </div>
          </aside>

          <main className="min-w-0 flex-1">{children}</main>
        </div>

        <footer className="border-t border-slate-200/60 py-3 text-center">
          <p className="text-[10px] text-slate-400">{BRANDING.poweredBy}</p>
        </footer>
      </div>
    </>
  );
}
