import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MobileShell, Icon } from "@/components/MobileShell";

export const Route = createFileRoute("/habitos")({
  head: () => ({
    meta: [
      { title: "Meus Hábitos — Sereno" },
      { name: "description", content: "Cuidar do corpo é o primeiro passo para acolher a mente." },
    ],
  }),
  component: HabitosPage,
});

const MEALS = [
  { name: "Café da Manhã", emoji: "🥞", tint: "var(--clay-anxiety)", textColor: "#c44a2a" },
  { name: "Almoço", emoji: "🥗", tint: "var(--clay-joy)", textColor: "#2a6b3a" },
  { name: "Lanche", emoji: "🍎", tint: "var(--clay-stress)", textColor: "#8a6a1a" },
  { name: "Jantar", emoji: "🍲", tint: "var(--clay-self)", textColor: "#5a3a8a" },
];

function HabitosPage() {
  const [water, setWater] = useState(1200);
  const goal = 2000;
  const pct = Math.min(100, (water / goal) * 100);

  return (
    <MobileShell>
      <header className="mb-5 p-5 text-center clay-card">
        <h1 className="font-display text-2xl text-[var(--clay-title)]">Meus Hábitos</h1>
        <p className="mt-1 text-sm text-[var(--clay-text)]/80">
          Cuidar do corpo é o primeiro passo para acolher a mente.
        </p>
      </header>

      <section
        className="mb-6 p-5 clay-card"
        style={{ background: "linear-gradient(160deg, rgba(211,228,255,0.7), rgba(255,255,255,0.85))" }}
      >
        <div className="text-center">
          <h2 className="font-display text-xl text-[var(--clay-title)]">
            Dê um gole na sua hidratação.
          </h2>
          <p className="mt-1 text-sm font-semibold text-[var(--clay-cta)]">
            {water} ml inseridos hoje
          </p>
        </div>

        <div className="my-5 flex justify-center">
          <div className="relative h-32 w-24 overflow-hidden rounded-2xl border-2 border-white/80 bg-white/50 shadow-inner">
            <div
              className="absolute bottom-0 left-0 right-0 transition-all duration-500"
              style={{
                height: `${pct}%`,
                background: "linear-gradient(180deg, #C5D9F1, #A9C7E9 80%)",
                boxShadow: "inset 2px 4px 8px rgba(255,255,255,0.6)",
              }}
            />
          </div>
        </div>

        <div className="relative h-5 w-full overflow-hidden rounded-full bg-white/60 shadow-inner">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, #A9C7E9, #C5D9F1)",
              boxShadow: "inset 1px 1px 2px rgba(255,255,255,0.6)",
            }}
          />
          <button
            onClick={() => setWater((w) => Math.min(goal, w + 200))}
            className="absolute top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full clay-cta"
            style={{ left: `calc(${pct}% - 16px)` }}
            aria-label="Adicionar água"
          >
            <Icon name="water_drop" filled className="text-[16px]" />
          </button>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="mb-3 font-display text-base text-[var(--clay-title)]">Alimentação Afetiva</h3>
        <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2">
          {MEALS.map((m) => (
            <button
              key={m.name}
              className="flex w-32 shrink-0 flex-col items-center gap-3 p-4 clay-soft"
              style={{ background: `linear-gradient(160deg, color-mix(in oklab, ${m.tint} 80%, white), rgba(255,255,255,0.7))` }}
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/80 text-3xl shadow-inner">
                {m.emoji}
              </span>
              <span className="text-sm font-bold" style={{ color: m.textColor }}>
                {m.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 font-display text-base text-[var(--clay-title)]">
          Monitoramento do Sono
        </h3>
        <div className="p-5 clay-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-[var(--clay-text)]/70">Qualidade da noite</p>
              <p className="font-display text-xl" style={{ color: "var(--clay-self)" }}>
                Revigorante
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full clay-soft">
              <Icon name="bedtime" filled className="text-[var(--clay-self)]" />
            </div>
          </div>

          <div className="relative mt-4 h-24">
            <svg viewBox="0 0 200 80" className="absolute inset-0 h-full w-full">
              <path
                d="M 10 70 Q 100 0 190 70"
                fill="none"
                stroke="rgba(142,163,193,0.3)"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            <div
              className="absolute -top-1 right-4 flex h-10 w-10 items-center justify-center rounded-full clay-cta"
              style={{ background: "linear-gradient(135deg, #D7CBE8, #C5D9F1)" }}
            >
              <span className="text-lg">🌙</span>
            </div>
          </div>

          <div className="mt-2 flex justify-between text-xs text-[var(--clay-text)]/70">
            <span>Cansado</span>
            <span>Radiante</span>
          </div>
        </div>
      </section>
    </MobileShell>
  );
}
