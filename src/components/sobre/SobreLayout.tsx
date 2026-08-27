import { Link, Outlet } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { BRANDING } from "@/lib/branding";
import { SobreSidebar } from "./SobreSidebar";
import logo from "@/assets/logo-zellu/icone-app.svg";

export function SobreLayout({ children }: { children?: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] bg-background text-[var(--clay-text)]">
      <header className="sticky top-0 z-40 border-b border-white/40 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <Link to="/sobre" className="flex min-w-0 items-center gap-2.5">
            <img src={logo} alt="" className="h-9 w-9 shrink-0" />
            <div className="min-w-0">
              <p className="truncate font-display text-sm text-[var(--clay-title)]">
                Sobre o {BRANDING.shortName}
              </p>
              <p className="truncate text-[10px] text-[var(--clay-title)]/50">Guia para clientes e RH</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-xl bg-white/70 px-3 py-2 text-xs font-semibold text-[var(--clay-title)] shadow-sm md:hidden"
              aria-expanded={mobileNavOpen}
              aria-controls="sobre-mobile-nav"
              onClick={() => setMobileNavOpen((v) => !v)}
            >
              <Icon name="menu" className="text-base" />
              Menu
            </button>
            <Link
              to="/login"
              className="hidden rounded-xl bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] px-4 py-2 text-xs font-bold text-[oklch(0.25_0.04_254)] shadow-sm sm:inline-block"
            >
              Entrar
            </Link>
          </div>
        </div>

        {mobileNavOpen ? (
          <div
            id="sobre-mobile-nav"
            className="border-t border-white/40 bg-white/50 px-4 py-4 md:hidden"
          >
            <SobreSidebar onNavigate={() => setMobileNavOpen(false)} />
            <Link
              to="/login"
              onClick={() => setMobileNavOpen(false)}
              className="mt-4 block w-full rounded-xl bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] py-2.5 text-center text-xs font-bold text-[oklch(0.25_0.04_254)] shadow-sm"
            >
              Entrar na plataforma
            </Link>
          </div>
        ) : null}
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-[260px_minmax(0,1fr)] md:px-6 md:py-10">
        <aside className="hidden md:block">
          <div className="sticky top-24 rounded-2xl bg-white/70 p-3 shadow-sm backdrop-blur-md">
            <SobreSidebar />
          </div>
        </aside>

        <main className="min-w-0 rounded-2xl bg-white/70 p-5 shadow-sm backdrop-blur-md md:p-8">
          {children ?? <Outlet />}
        </main>
      </div>

      <footer className="border-t border-white/40 py-6 text-center text-[11px] text-[var(--clay-title)]/45">
        <p>{BRANDING.poweredBy}</p>
        <p className="mt-2">
          <Link to="/privacidade" className="underline hover:text-[var(--clay-title)]">
            Política de privacidade
          </Link>
          {" · "}
          <Link to="/login" className="underline hover:text-[var(--clay-title)]">
            Login
          </Link>
        </p>
      </footer>
    </div>
  );
}
