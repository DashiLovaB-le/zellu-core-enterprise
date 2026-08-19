import { useState, useEffect } from "react";
import { MobileShell } from "@/components/MobileShell";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { useAuth } from "@/lib/auth-context";
import { SOUNDS, BREATH_PHASES } from "@/data";
import { BRANDING } from "@/lib/branding";

interface RespiroPageProps {
  activeSound: string | null;
  onSoundToggle: (name: string | null) => void;
}

export function MobileRespiroPage({ activeSound, onSoundToggle }: RespiroPageProps) {
  const { user } = useAuth();
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
          <Avatar name={user?.avatar_url ?? undefined} size={32} />
          <span className="font-display text-sm text-[var(--clay-title)]">
            {BRANDING.shortName}
          </span>
        </div>
      </header>

      <h1 className="font-display text-xl text-[var(--clay-title)]">Espaço do Respiro</h1>
      <p className="mt-1 text-xs text-[var(--clay-text)]/70">
        Uma pausa breve para retomar o foco e o equilíbrio.
      </p>

      <div className="my-8 flex flex-col items-center">
        <div className="relative flex h-56 w-56 items-center justify-center">
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
            className="relative font-display text-xl text-[var(--clay-title)] transition-all duration-300"
            style={{
              opacity: fadeIn ? 1 : 0,
              transform: `scale(${fadeIn ? 1 : 0.85})`,
            }}
          >
            {BREATH_PHASES[phaseIndex].text}
          </p>
        </div>
        <p className="mt-3 text-[10px] text-[var(--clay-title)]/60">Siga o ritmo do círculo</p>
      </div>

      <section>
        <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
          Sons
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {SOUNDS.map((s) => {
            const isActive = activeSound === s.name;
            return (
              <button
                key={s.name}
                onClick={() => onSoundToggle(isActive ? null : s.name)}
                className={`flex items-center gap-2 rounded-xl p-3 transition-all ${
                  isActive ? "bg-white/80 shadow-sm" : "bg-white/50 shadow-sm"
                }`}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/70 shadow-sm">
                  <Icon name={s.icon} filled className="text-sm text-[var(--clay-text)]" />
                </span>
                <span className="text-xs font-semibold text-[var(--clay-text)]">{s.name}</span>
              </button>
            );
          })}
        </div>
      </section>
    </MobileShell>
  );
}
