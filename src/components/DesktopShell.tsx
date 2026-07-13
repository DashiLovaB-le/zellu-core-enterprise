import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Icon } from "./Icon";
import { BRANDING } from "@/lib/branding";

interface NavItem {
  to: "/" | "/diario" | "/respiro" | "/habitos";
  icon: string;
  label: string;
}

const NAV: NavItem[] = [
  { to: "/diario", icon: "auto_stories", label: "Diário" },
  { to: "/respiro", icon: "air", label: "Respiro" },
  { to: "/", icon: "chat_bubble", label: "Chat" },
  { to: "/habitos", icon: "task_alt", label: "Hábitos" },
];

export function DesktopShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full clay-cta">
              <Icon name="cloud" filled />
            </div>
            <span className="font-display text-lg text-[var(--clay-title)] hidden sm:inline">
              {BRANDING.shortName}
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {NAV.map((item) => {
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    active ? "clay-cta" : "text-[var(--clay-title)] hover:bg-white/40"
                  }`}
                >
                  <Icon name={item.icon} filled={active} />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <button className="flex h-9 w-9 items-center justify-center rounded-full clay-soft text-[var(--clay-title)]">
            <Icon name="person" filled />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>

      <footer className="border-t border-border/20 py-3 text-center">
        <p className="text-[10px] text-[var(--clay-title)]/40">{BRANDING.poweredBy}</p>
      </footer>
    </div>
  );
}
