import { useState, useEffect } from "react";
import { MobileShell } from "@/components/MobileShell";
import { Icon } from "@/components/Icon";
import { SOUNDS, BREATH_PHASES } from "@/data";
import { BRANDING } from "@/lib/branding";

interface RespiroPageProps {
  activeSound: string | null;
  onSoundToggle: (name: string | null) => void;
}

export function MobileRespiroPage({ activeSound, onSoundToggle }: RespiroPageProps) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    const phase = BREATH_PHASES[phaseIndex];
    const hideTimer = setTimeout(() => setFadeIn(false), phase.duration - 200);
    const nextTimer = setTimeout(() => {
      setPhaseIndex((prev) => (prev + 1) % BREATH_PHASES.length);
      setFadeIn(true);
    }, phase.duration);
    return () => {
      clearTimeout(hideTimer);
      clearTimeout(nextTimer);
    };
  }, [phaseIndex]);

  return (
    <MobileShell>
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full clay-cta">
            <Icon name="cloud" filled />
          </div>
          <span className="font-display text-lg text-[var(--clay-title)]">{BRANDING.shortName}</span>
        </div>
        <button className="flex h-10 w-10 items-center justify-center rounded-full clay-soft text-[var(--clay-title)]">
          <Icon name="person" filled />
        </button>
      </header>

      <h1 className="font-display text-3xl text-[var(--clay-title)]">Espaço do Respiro</h1>
      <p className="mt-1 text-sm text-[var(--clay-text)]/80">
        Faça uma pausa. O mundo pode esperar um minuto.
      </p>

      <button
        className="mt-5 flex w-full items-center gap-4 p-4 text-left clay-soft active:translate-y-px"
        style={{
          background: "linear-gradient(135deg, rgba(245,214,193,0.55), rgba(249,231,181,0.5))",
        }}
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/90 shadow-inner">
          <Icon name="favorite" filled className="text-[#c44545]" />
        </div>
        <div>
          <p className="font-display text-base text-[#a14a2a]">Precisa de ajuda agora?</p>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#a14a2a]/70">
            (Botão do pânico)
          </p>
        </div>
      </button>

      <div className="my-10 flex flex-col items-center">
        <div className="relative flex h-64 w-64 items-center justify-center">
          <div
            className="absolute inset-0 rounded-full animate-breathe"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95), rgba(169,199,233,0.55) 60%, rgba(169,199,233,0.25) 100%)",
              boxShadow:
                "0 30px 60px rgba(142,163,193,0.35), inset 8px 8px 20px rgba(255,255,255,0.9), inset -8px -8px 20px rgba(142,163,193,0.18)",
            }}
          />
          <p
            className="relative font-display text-2xl text-[var(--clay-title)] transition-all duration-300"
            style={{
              opacity: fadeIn ? 1 : 0,
              transform: `scale(${fadeIn ? 1 : 0.85})`,
            }}
          >
            {BREATH_PHASES[phaseIndex].text}
          </p>
        </div>
        <p className="mt-4 text-xs text-[var(--clay-text)]/70">Siga o ritmo do círculo</p>
      </div>

      <section>
        <h3 className="mb-3 font-display text-base text-[var(--clay-title)]">
          Sons para sintonizar
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {SOUNDS.map((s) => {
            const isActive = activeSound === s.name;
            return (
              <button
                key={s.name}
                onClick={() => onSoundToggle(isActive ? null : s.name)}
                className={`flex flex-col items-center gap-2 p-4 transition-all ${
                  isActive ? "clay-pressed" : "clay-soft"
                }`}
              >
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{
                    background: `linear-gradient(135deg, ${s.color}, color-mix(in oklab, ${s.color} 60%, white))`,
                    boxShadow:
                      "inset 2px 2px 4px rgba(255,255,255,0.7), inset -2px -2px 4px rgba(142,163,193,0.15)",
                  }}
                >
                  <Icon name={s.icon} filled className="text-[var(--clay-text)]" />
                </span>
                <span className="text-sm font-semibold text-[var(--clay-text)]">{s.name}</span>
              </button>
            );
          })}
        </div>
      </section>
    </MobileShell>
  );
}
