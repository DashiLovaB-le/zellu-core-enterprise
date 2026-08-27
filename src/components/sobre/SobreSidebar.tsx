import { Link, useRouterState } from "@tanstack/react-router";
import { Icon } from "@/components/Icon";
import { getSobreNavItems } from "@/lib/sobre";

type SobreSidebarProps = {
  onNavigate?: () => void;
  className?: string;
};

export function SobreSidebar({ onNavigate, className = "" }: SobreSidebarProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = getSobreNavItems();

  return (
    <nav aria-label="Conteúdo sobre o Zēllu" className={className}>
      <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-widest text-[var(--clay-title)]/50">
        Neste guia
      </p>
      <ul className="space-y-1">
        {items.map((item) => {
          const href = `/sobre/${item.slug}`;
          const active = pathname === href;
          return (
            <li key={item.slug}>
              <Link
                to="/sobre/$slug"
                params={{ slug: item.slug }}
                onClick={onNavigate}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-gradient-to-br from-[#99BEE5]/35 to-[#C5D9F1]/35 font-semibold text-[var(--clay-title)] shadow-sm"
                    : "text-[var(--clay-text)]/80 hover:bg-white/60 hover:text-[var(--clay-title)]"
                }`}
              >
                <Icon
                  name={item.icon}
                  filled={active}
                  className={`text-base ${active ? "text-[var(--clay-cta)]" : "text-[var(--clay-title)]/45"}`}
                />
                <span className="leading-snug">{item.title}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
