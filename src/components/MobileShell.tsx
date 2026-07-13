import { Link, useRouterState, type LinkProps } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

interface NavItem {
  to: LinkProps["to"];
  icon: string;
  label: string;
}

const NAV: NavItem[] = [
  { to: "/", icon: "chat_bubble", label: "Chat" },
  { to: "/diario", icon: "auto_stories", label: "Diário" },
  { to: "/habitos", icon: "task_alt", label: "Hábitos" },
  { to: "/respiro", icon: "air", label: "Respiro" },
  { to: "/perfil", icon: "person", label: "Perfil" },
];

export function MobileShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[440px] flex-col px-5 pb-32 pt-6">
      {children}

      <nav className="fixed bottom-4 left-1/2 z-50 flex h-[68px] w-[calc(100%-2rem)] max-w-[420px] -translate-x-1/2 items-center justify-around px-3 clay-card">
        {NAV.map((item) => {
          const active =
            item.to === "/"
              ? pathname === "/"
              : pathname.startsWith(item.to as string);
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-1 flex-col items-center justify-center gap-0.5"
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-300 ${
                  active ? "clay-cta scale-100" : "text-[var(--clay-title)] scale-95"
                }`}
              >
                <Icon name={item.icon} filled={active} className="text-[22px]" />
              </span>
              <span
                className={`text-[10px] font-semibold tracking-wide ${
                  active ? "text-[var(--clay-title)]" : "text-[var(--clay-title)]/60"
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
