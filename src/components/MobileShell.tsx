import { Link, useRouterState, type LinkProps } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Icon } from "./Icon";
import { BRANDING } from "@/lib/branding";

interface NavItem {
  to: LinkProps["to"];
  icon: string;
  label: string;
}

const NAV: NavItem[] = [
  { to: "/", icon: "chat_bubble", label: "Chat" },
  { to: "/checkin", icon: "checklist", label: "Check-in" },
  { to: "/diario", icon: "auto_stories", label: "Diário" },
  { to: "/meu-bem-estar", icon: "favorite", label: "Bem-estar" },
  { to: "/respiro", icon: "air", label: "Respiro" },
  { to: "/perfil", icon: "person", label: "Perfil" },
];

export function MobileShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[440px] flex-col px-5 pb-28 pt-6">
      {children}

      <footer className="fixed bottom-[76px] left-1/2 z-40 -translate-x-1/2 text-center">
        <p className="text-[9px] text-[var(--clay-title)]/25">{BRANDING.poweredBy}</p>
      </footer>

      <nav className="fixed bottom-3 left-1/2 z-50 flex h-14 w-[calc(100%-2rem)] max-w-[420px] -translate-x-1/2 items-center justify-around rounded-2xl bg-white/80 px-1 shadow-[0_2px_10px_rgba(74,106,138,0.08)] backdrop-blur-lg">
        {NAV.map((item) => {
          const active =
            item.to === "/" ? pathname === "/" : pathname.startsWith(item.to as string);
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-1 flex-col items-center justify-center gap-0.5"
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200 ${
                  active
                    ? "bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] text-[oklch(0.25_0.04_254)] shadow-sm"
                    : "text-[var(--clay-title)]/60"
                }`}
              >
                <Icon name={item.icon} filled={active} className="text-base" />
              </span>
              <span
                className={`text-[8px] font-semibold tracking-wide ${
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
  );
}
