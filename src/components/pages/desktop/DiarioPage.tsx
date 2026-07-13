import { DesktopShell } from "@/components/DesktopShell";
import { Icon } from "@/components/Icon";
import { MOOD_COLORS, DAYS, CONVERSATIONS, AI_SUMMARY } from "@/data";

export function DesktopDiarioPage() {
  return (
    <DesktopShell>
      <header className="mb-8">
        <h1 className="font-display text-4xl text-[var(--clay-title)]">Meu Diário</h1>
        <p className="mt-1 text-base text-[var(--clay-text)]/80">
          Olhando para trás com carinho e autocompreensão
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="p-6 clay-card">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full clay-cta">
                <Icon name="auto_awesome" filled className="text-[20px]" />
              </div>
              <h2 className="font-display text-lg text-[var(--clay-title)]">Resumo da IA</h2>
            </div>
            <p className="text-base leading-relaxed text-[var(--clay-text)]">{AI_SUMMARY}</p>
          </div>

          <div className="mt-6">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-[var(--clay-title)]">
              Humor Recente
            </h3>
            <div className="p-5 clay-soft">
              <div className="mb-3 grid grid-cols-7 gap-3 text-center text-xs font-semibold text-[var(--clay-title)]/70">
                {DAYS.map((d, i) => (
                  <span key={i}>{d}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-3">
                {MOOD_COLORS.map((c, i) => (
                  <div
                    key={i}
                    className={`flex aspect-square items-center justify-center rounded-full text-sm font-bold ${
                      i === 9
                        ? "ring-2 ring-[var(--clay-cta)] ring-offset-2 ring-offset-white/40"
                        : ""
                    }`}
                    style={{
                      background: c
                        ? `linear-gradient(135deg, ${c}, color-mix(in oklab, ${c} 70%, white))`
                        : "rgba(142,163,193,0.08)",
                      color: c ? "var(--clay-text)" : "var(--clay-title)",
                      boxShadow: c
                        ? "inset 2px 2px 4px rgba(255,255,255,0.6), inset -2px -2px 4px rgba(142,163,193,0.15)"
                        : "inset 2px 2px 4px rgba(142,163,193,0.1)",
                    }}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-[var(--clay-title)]">
            Conversas Anteriores
          </h3>
          <div className="flex flex-col gap-3">
            {CONVERSATIONS.map((c, i) => (
              <button
                key={i}
                className="flex items-center gap-3 p-4 text-left clay-soft hover:bg-white/60 active:translate-y-px"
              >
                <span
                  className="h-full w-1 self-stretch rounded-full"
                  style={{ background: c.tint }}
                />
                <div className="flex-1">
                  <p className="text-xs text-[var(--clay-title)]">{c.when}</p>
                  <p className="mt-0.5 text-sm leading-snug text-[var(--clay-text)]">{c.excerpt}</p>
                </div>
                <Icon name="chevron_right" className="text-[var(--clay-title)]" />
              </button>
            ))}
          </div>
        </section>
      </div>
    </DesktopShell>
  );
}
