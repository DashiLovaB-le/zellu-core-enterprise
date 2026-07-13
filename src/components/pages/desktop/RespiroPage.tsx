import { useState, useEffect } from "react";
import { DesktopShell } from "@/components/DesktopShell";
import { Icon } from "@/components/Icon";
import { SOUNDS, BREATH_PHASES } from "@/data";

interface RespiroPageProps {
  activeSound: string | null;
  onSoundToggle: (name: string | null) => void;
}

export function DesktopRespiroPage({ activeSound, onSoundToggle }: RespiroPageProps) {
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
    <DesktopShell>
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="flex-1">
          <header className="mb-6">
            <h1 className="font-display text-4xl text-[var(--clay-title)]">Espaço do Respiro</h1>
            <p className="mt-1 text-base text-[var(--clay-text)]/80">
              Faça uma pausa. O mundo pode esperar um minuto.
            </p>
          </header>

          <button
            className="mb-8 flex w-full items-center gap-4 p-5 text-left clay-soft hover:bg-white/60 active:translate-y-px"
            style={{
              background: "linear-gradient(135deg, rgba(245,214,193,0.55), rgba(249,231,181,0.5))",
            }}
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/90 shadow-inner">
              <Icon name="favorite" filled className="text-[#c44545] text-2xl" />
            </div>
            <div>
              <p className="font-display text-lg text-[#a14a2a]">Precisa de ajuda agora?</p>
              <p className="text-xs font-bold uppercase tracking-wider text-[#a14a2a]/70">
                (Botão do pânico)
              </p>
            </div>
          </button>

          <div className="flex flex-col items-center py-6">
            <div className="relative flex h-80 w-80 items-center justify-center">
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
                className="relative font-display text-3xl text-[var(--clay-title)] transition-all duration-300"
                style={{
                  opacity: fadeIn ? 1 : 0,
                  transform: `scale(${fadeIn ? 1 : 0.85})`,
                }}
              >
                {BREATH_PHASES[phaseIndex].text}
              </p>
            </div>
            <p className="mt-4 text-sm text-[var(--clay-text)]/70">Siga o ritmo do círculo</p>
          </div>
        </div>

        <aside className="w-full lg:w-72 lg:sticky lg:top-24">
          <div className="p-5 clay-card">
            <h3 className="mb-4 font-display text-base text-[var(--clay-title)]">
              Sons para sintonizar
            </h3>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
              {SOUNDS.map((s) => {
                const isActive = activeSound === s.name;
                return (
                  <button
                    key={s.name}
                    onClick={() => onSoundToggle(isActive ? null : s.name)}
                    className={`flex items-center gap-3 p-3 transition-all ${
                      isActive ? "clay-pressed" : "clay-soft"
                    }`}
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
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
          </div>
        </aside>
      </div>
    </DesktopShell>
  );
}
