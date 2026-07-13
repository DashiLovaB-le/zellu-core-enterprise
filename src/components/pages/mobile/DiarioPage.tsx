import { MobileShell } from "@/components/MobileShell";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { MOOD_COLORS, DAYS, CONVERSATIONS, AI_SUMMARY } from "@/data";

export function MobileDiarioPage() {
  return (
    <MobileShell>
      <header className="mb-5 flex items-center gap-3">
        <Avatar size={36} />
        <div>
          <h1 className="font-display text-xl text-[var(--clay-title)]">Meu Diário</h1>
          <p className="text-xs text-[var(--clay-text)]/70">
            Olhando para trás com carinho e autocompreensão
          </p>
        </div>
      </header>

      <section className="mb-5 rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur-md">
        <div className="mb-2 flex items-center gap-2">
          <Icon name="auto_awesome" filled className="text-sm text-[var(--clay-cta)]" />
          <h2 className="text-xs font-semibold text-[var(--clay-title)]">Resumo da IA</h2>
        </div>
        <p className="text-sm leading-relaxed text-[var(--clay-text)]">{AI_SUMMARY}</p>
      </section>

      <section className="mb-5">
        <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
          Humor Recente
        </h3>
        <div className="rounded-xl bg-white/60 p-3 shadow-sm">
          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-[var(--clay-title)]/60">
            {DAYS.map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {MOOD_COLORS.map((c, i) => (
              <div
                key={i}
                className={`flex aspect-square items-center justify-center rounded-full text-[10px] font-bold ${
                  i === 9 ? "ring-2 ring-[var(--clay-cta)] ring-offset-1 ring-offset-white/50" : ""
                }`}
                style={{
                  background: c
                    ? `linear-gradient(135deg, ${c}, color-mix(in oklab, ${c} 70%, white))`
                    : "rgba(142,163,193,0.06)",
                  color: c ? "var(--clay-text)" : "var(--clay-title)",
                }}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
          Conversas Anteriores
        </h3>
        <div className="flex flex-col gap-2">
          {CONVERSATIONS.map((c, i) => (
            <button
              key={i}
              className="flex items-center gap-3 rounded-xl bg-white/60 p-3 text-left shadow-sm active:translate-y-px"
            >
              <span
                className="h-8 w-1 shrink-0 rounded-full"
                style={{ background: c.tint }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-[var(--clay-title)]/60">{c.when}</p>
                <p className="mt-0.5 text-sm leading-snug text-[var(--clay-text)] truncate">{c.excerpt}</p>
              </div>
              <Icon name="chevron_right" className="text-sm text-[var(--clay-title)]/40" />
            </button>
          ))}
        </div>
      </section>
    </MobileShell>
  );
}
