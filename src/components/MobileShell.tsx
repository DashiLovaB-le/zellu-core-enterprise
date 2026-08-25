import { Link, useRouterState, type LinkProps } from "@tanstack/react-router";
import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "./Icon";
import { Avatar } from "./Avatar";
import { BRANDING } from "@/lib/branding";
import { useAuth } from "@/lib/auth-context";
import logo from "@/assets/logo.png";

interface NavItem {
  to: LinkProps["to"];
  icon: string;
  label: string;
}

const NAV: NavItem[] = [
  { to: "/chat", icon: "chat_bubble", label: "Chat" },
  { to: "/checkin", icon: "checklist", label: "Check-in" },
  { to: "/", icon: "monitoring", label: "Dashboard" },
  { to: "/diario", icon: "auto_stories", label: "Diário" },
  { to: "/plano-de-cuidado", icon: "self_improvement", label: "Plano" },
  { to: "/meu-bem-estar", icon: "favorite", label: "Bem-estar" },
  { to: "/respiro", icon: "air", label: "Respiro" },
  { to: "/perfil", icon: "person", label: "Perfil" },
];

/** Quantos itens cabem visíveis no navbar mobile por vez */
const VISIBLE_SLOTS = 5;

function isNavActive(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  return pathname.startsWith(to);
}

export function MobileShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const scrollerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = scrollerRef.current;
    if (!nav) return;
    const active = nav.querySelector<HTMLElement>("[data-nav-active='true']");
    if (!active) return;

    // Scroll apenas no container do menu (não no documento) — evita micro-travamento na troca de rota
    const navRect = nav.getBoundingClientRect();
    const itemRect = active.getBoundingClientRect();
    const overflowLeft = itemRect.left < navRect.left + 4;
    const overflowRight = itemRect.right > navRect.right - 4;
    if (!overflowLeft && !overflowRight) return;

    const delta =
      itemRect.left - navRect.left - (navRect.width - itemRect.width) / 2;
    nav.scrollTo({ left: nav.scrollLeft + delta, behavior: "auto" });
  }, [pathname]);

  return (
    <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[440px] flex-col px-5 pb-28">
      <header className="sticky top-0 z-50 -mx-5 mb-4 flex items-center justify-between bg-background/70 px-5 py-3 backdrop-blur-lg">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt={BRANDING.appName} className="h-8 w-8" />
          <span className="font-display text-sm text-[var(--clay-title)]">
            {BRANDING.shortName}
          </span>
        </Link>
        <Link to="/perfil">
          <Avatar name={user?.avatar_url ?? undefined} size={32} />
        </Link>
      </header>

      {children}

      <footer className="pointer-events-none fixed bottom-[76px] left-1/2 z-40 -translate-x-1/2 text-center">
        <p className="text-[9px] text-[var(--clay-title)]/25">{BRANDING.poweredBy}</p>
      </footer>

      <nav
        ref={scrollerRef}
        aria-label="Navegação principal"
        className="mobile-nav-scroll fixed bottom-3 left-1/2 z-50 h-[58px] w-[calc(100%-2rem)] max-w-[420px] -translate-x-1/2 overflow-x-auto overscroll-x-contain rounded-full border border-white/50 bg-white/85 px-1.5 py-1 shadow-[0_4px_20px_rgba(74,106,138,0.12)] backdrop-blur-xl"
      >
        <div
          className="grid h-full"
          style={{
            width: `${(NAV.length / VISIBLE_SLOTS) * 100}%`,
            gridTemplateColumns: `repeat(${NAV.length}, minmax(0, 1fr))`,
          }}
        >
          {NAV.map((item) => {
            const active = isNavActive(pathname, item.to as string);
            return (
              <Link
                key={item.to}
                to={item.to}
                data-nav-active={active ? "true" : undefined}
                className="flex h-full snap-start flex-col items-center justify-center gap-0.5 px-0.5"
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
                    active
                      ? "bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] text-[oklch(0.25_0.04_254)] shadow-sm"
                      : "text-[var(--icon-stroke)]/55"
                  }`}
                >
                  <Icon name={item.icon} filled={active} className="text-[18px]" />
                </span>
                <span
                  className={`max-w-full truncate px-0.5 text-center text-[8px] font-semibold tracking-wide ${
                    active ? "text-[var(--icon-stroke)]" : "text-[var(--icon-stroke)]/45"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
