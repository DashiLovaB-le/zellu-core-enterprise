import { Link, useRouterState, type LinkProps } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Icon } from "./Icon";
import { Avatar } from "./Avatar";
import { BRANDING } from "@/lib/branding";

interface NavItem {
  to: LinkProps["to"];
  icon: string;
  label: string;
}

const NAV: NavItem[] = [
  { to: "/dashitecnology", icon: "build", label: "Dev Tools" },
  { to: "/perfil", icon: "person", label: "Perfil" },
];

export function DevShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <>
      {/* Mobile layout */}
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[440px] flex-col px-5 pb-28 pt-6 md:hidden">
        <header className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar size={32} />
            <div>
              <span className="font-display text-sm text-[var(--clay-title)]">Dev Panel</span>
              <p className="text-[10px] text-[var(--clay-title)]/50">{BRANDING.shortName}</p>
            </div>
          </div>
        </header>

        {children}

        <footer className="fixed bottom-[76px] left-1/2 z-40 -translate-x-1/2 text-center md:hidden">
          <p className="text-[9px] text-[var(--clay-title)]/25">DashiTecnology Dev</p>
        </footer>

        <nav className="fixed bottom-3 left-1/2 z-50 flex h-14 w-[calc(100%-2rem)] max-w-[420px] -translate-x-1/2 items-center justify-around rounded-2xl bg-white/80 px-2 shadow-[0_2px_10px_rgba(74,106,138,0.08)] backdrop-blur-lg md:hidden">
          {NAV.map((item) => {
            const active =
              item.to === "/dashitecnology"
                ? pathname === "/dashitecnology" || pathname.startsWith("/dashitecnology/")
                : pathname.startsWith(item.to as string);
            return (
              <Link
                key={item.to}
                to={item.to}
                className="flex flex-1 flex-col items-center justify-center gap-0.5"
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 ${
                    active
                      ? "bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] text-[oklch(0.25_0.04_254)] shadow-sm"
                      : "text-[var(--clay-title)]/60"
                  }`}
                >
                  <Icon name={item.icon} filled={active} className="text-lg" />
                </span>
                <span
                  className={`text-[9px] font-semibold tracking-wide ${
                    active ? "text-[var(--clay-title)]" : "text-[var(--clay-title)]/50"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Desktop layout */}
      <div className="hidden min-h-screen bg-background md:block">
        <header className="sticky top-0 z-50 border-b border-border/30 bg-background/70 backdrop-blur-lg">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
            <Link to="/dashitecnology" className="flex items-center gap-2">
              <Avatar size={32} />
              <span className="font-display text-base text-[var(--clay-title)]">
                {BRANDING.shortName}
              </span>
            </Link>
            <span className="text-xs text-[var(--clay-title)]/50">Dev Panel</span>
            <Link to="/perfil">
              <Avatar size={32} />
            </Link>
          </div>
        </header>

        <div className="mx-auto flex max-w-7xl gap-6 px-6 py-6">
          <aside className="sticky top-20 h-fit w-56 shrink-0 rounded-2xl bg-white/70 p-3 shadow-sm backdrop-blur-md">
            <nav className="flex flex-col gap-1">
              {NAV.map((item) => {
                const active =
                  item.to === "/dashitecnology"
                    ? pathname === "/dashitecnology" || pathname.startsWith("/dashitecnology/")
                    : pathname.startsWith(item.to as string);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                      active
                        ? "bg-gradient-to-br from-[#99BEE5]/30 to-[#C5D9F1]/30 text-[var(--clay-title)] shadow-sm"
                        : "text-[var(--clay-title)]/60 hover:bg-white/40"
                    }`}
                  >
                    <Icon name={item.icon} filled={active} className="text-lg" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-4 border-t border-border/20 pt-3">
              <Link
                to="/"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--clay-title)]/50 transition-all hover:bg-white/40"
              >
                <Icon name="arrow_back" className="text-lg" />
                Modo Colaborador
              </Link>
            </div>
          </aside>

          <main className="min-w-0 flex-1">{children}</main>
        </div>

        <footer className="border-t border-border/20 py-3 text-center">
          <p className="text-[10px] text-[var(--clay-title)]/30">DashiTecnology Dev</p>
        </footer>
      </div>
    </>
  );
}
