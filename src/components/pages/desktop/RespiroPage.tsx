import { useState, useEffect } from "react";
import { DesktopShell } from "@/components/DesktopShell";
import { Avatar } from "@/components/Avatar";
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
          <header className="mb-5 flex items-center gap-3">
            <Avatar size={36} />
            <div>
              <h1 className="font-display text-2xl text-[var(--clay-title)]">Espaço do Respiro</h1>
              <p className="text-sm text-[var(--clay-text)]/70">
                Uma pausa breve para retomar o foco e o equilíbrio.
              </p>
            </div>
          </header>

          <div className="flex flex-col items-center py-6">
            <div className="relative flex h-72 w-72 items-center justify-center">
              <div
                className="absolute inset-0 rounded-full animate-breathe"
                style={{
                  background:
                    "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(153,190,229,0.4) 60%, rgba(153,190,229,0.15) 100%)",
                  boxShadow:
                    "0 20px 40px rgba(74,106,138,0.15), inset 4px 4px 12px rgba(255,255,255,0.7), inset -4px -4px 12px rgba(74,106,138,0.08)",
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
            <p className="mt-3 text-sm text-[var(--clay-title)]/60">Siga o ritmo do círculo</p>
          </div>
        </div>

        <aside className="w-full lg:w-64 lg:sticky lg:top-24">
          <div className="rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur-md">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
              Sons
            </h3>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
              {SOUNDS.map((s) => {
                const isActive = activeSound === s.name;
                return (
                  <button
                    key={s.name}
                    onClick={() => onSoundToggle(isActive ? null : s.name)}
                    className={`flex items-center gap-3 rounded-xl p-3 transition-all ${
                      isActive ? "bg-white/80 shadow-sm" : "bg-white/50 shadow-sm"
                    }`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/70 shadow-sm">
                      <Icon name={s.icon} filled className="text-sm text-[var(--clay-text)]" />
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
