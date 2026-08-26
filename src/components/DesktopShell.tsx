import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Icon } from "./Icon";
import { Avatar } from "./Avatar";
import { BRANDING } from "@/lib/branding";
import { useAuth } from "@/lib/auth-context";
import logo from "@/assets/logo-zellu/icone-app.svg";

interface NavItem {
  to: "/" | "/chat" | "/diario" | "/respiro" | "/meu-bem-estar" | "/checkin" | "/plano-de-cuidado";
  icon: string;
  label: string;
}

const NAV: NavItem[] = [
  { to: "/", icon: "monitoring", label: "Dashboard" },
  { to: "/checkin", icon: "checklist", label: "Check-in" },
  { to: "/chat", icon: "chat_bubble", label: "Chat" },
  { to: "/diario", icon: "auto_stories", label: "Diário" },
  { to: "/plano-de-cuidado", icon: "self_improvement", label: "Plano" },
  { to: "/meu-bem-estar", icon: "favorite", label: "Bem-estar" },
  { to: "/respiro", icon: "air", label: "Respiro" },
];

export function DesktopShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/30 bg-background/70 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-6">
          <Link to="/" className="flex shrink-0 items-center gap-2 whitespace-nowrap">
            <img src={logo} alt={BRANDING.appName} className="h-8 w-8" />
            <span className="hidden font-display text-base text-[var(--clay-title)] lg:inline">
              {BRANDING.shortName}
            </span>
          </Link>

          <nav className="flex min-w-0 flex-1 items-center justify-center gap-0.5">
            {NAV.map((item) => {
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all ${
                    active
                      ? "bg-white/70 text-[var(--icon-stroke)] shadow-sm"
                      : "text-[var(--icon-stroke)]/60 hover:bg-white/40"
                  }`}
                >
                  <Icon name={item.icon} filled={active} className="text-base leading-none" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <Link to="/perfil" className="shrink-0">
            <Avatar name={user?.avatar_url ?? undefined} size={32} />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6">
        {children}
      </main>

      <footer className="border-t border-border/20 py-3 text-center">
        <p className="text-[10px] text-[var(--clay-title)]/30">{BRANDING.poweredBy}</p>
      </footer>
    </div>
  );
}
