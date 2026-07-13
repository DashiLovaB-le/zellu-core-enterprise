import { useRef, useEffect, useState, type RefObject } from "react";
import { DesktopShell } from "@/components/DesktopShell";
import { WATER_GOAL, getSleepLabel, MEALS } from "@/data";

interface BemEstarPageProps {
  water: number;
  sleepQuality: number;
  mood: string;
  movementMinutes: number;
  energyLevel: number;
  meals: string[];
  goal: number;
  onWaterChange: (val: number) => void;
  onSleepChange: (val: number) => void;
  onMoodChange: (val: string) => void;
  onMovementChange: (val: number) => void;
  onEnergyChange: (val: number) => void;
  onMealToggle: (meal: string) => void;
}

const MOODS = [
  { emoji: "😊", label: "Feliz", value: "feliz" },
  { emoji: "😌", label: "Calmo", value: "calmo" },
  { emoji: "😐", label: "Neutro", value: "neutro" },
  { emoji: "😟", label: "Ansioso", value: "ansioso" },
  { emoji: "😢", label: "Triste", value: "triste" },
  { emoji: "😤", label: "Irritado", value: "irritado" },
];

export function DesktopBemEstarPage(props: BemEstarPageProps) {
  return (
    <DesktopShell>
      <div className="mx-auto max-w-4xl">
        <header className="mb-6">
          <h1 className="font-display text-2xl text-[var(--clay-title)]">Meu Bem-estar</h1>
          <p className="text-sm text-[var(--clay-text)]/70">
            Seu resumo completo do dia
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <WaterCard {...props} />
          <SleepCard {...props} />
          <MoodCard {...props} />
          <MovementCard {...props} />
          <EnergyCard {...props} />
          <MealsCard {...props} />
          <RespiroCard />
        </div>
      </div>
    </DesktopShell>
  );
}

function SliderBar({
  pct,
  color,
  barRef,
  onStart,
}: {
  pct: number;
  color: string;
  barRef: RefObject<HTMLDivElement | null>;
  onStart: (clientX: number) => void;
}) {
  return (
    <div
      ref={barRef}
      className="relative mt-3 h-2.5 w-full cursor-pointer overflow-hidden rounded-full bg-white/50 shadow-inner"
      onMouseDown={(e) => onStart(e.clientX)}
      onTouchStart={(e) => onStart(e.touches[0].clientX)}
    >
      <div
        className="h-full rounded-full transition-all duration-150"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

function useDrag(
  barRef: RefObject<HTMLDivElement | null>,
  onChange: (val: number) => void,
  max: number,
) {
  const [dragging, setDragging] = useState(false);

  const getValue = (clientX: number) => {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    return Math.round((x / rect.width) * max);
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
      const val = getValue(cx);
      if (val !== undefined) onChange(val);
    };
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [dragging, barRef, onChange, max]);

  return { dragging, setDragging, getValue };
}

function WaterCard({ water, goal, onWaterChange }: BemEstarPageProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const pct = Math.min(100, (water / goal) * 100);
  const drag = useDrag(barRef, onWaterChange, goal);

  return (
    <section className="rounded-2xl bg-white/70 p-5 shadow-sm backdrop-blur-md">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-base text-[var(--clay-title)]">💧 Água</h2>
          <p className="mt-0.5 text-sm font-semibold text-[var(--clay-cta)]">
            {water}ml / {goal}ml
          </p>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => onWaterChange(Math.max(0, water - 100))}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/50 text-sm font-bold text-[var(--clay-title)]/60 hover:bg-white/70"
          >
            −
          </button>
          <button
            onClick={() => onWaterChange(Math.min(goal, water + 100))}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/50 text-sm font-bold text-[var(--clay-title)]/60 hover:bg-white/70"
          >
            +
          </button>
        </div>
      </div>
      <SliderBar
        pct={pct}
        color="linear-gradient(90deg, #99BEE5, #C5D9F1)"
        barRef={barRef}
        onStart={(cx) => {
          const val = drag.getValue(cx);
          if (val !== undefined) onWaterChange(val);
          drag.setDragging(true);
        }}
      />
    </section>
  );
}

function SleepCard({ sleepQuality, onSleepChange }: BemEstarPageProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const drag = useDrag(barRef, (val) => onSleepChange(val), 100);

  return (
    <section className="rounded-2xl bg-white/70 p-5 shadow-sm backdrop-blur-md">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-base text-[var(--clay-title)]">🌙 Sono</h2>
          <p className="mt-0.5 text-sm font-semibold text-[var(--clay-self)]">
            {getSleepLabel(sleepQuality)}
          </p>
        </div>
      </div>
      <SliderBar
        pct={sleepQuality}
        color="linear-gradient(90deg, #D7CBE8, #C5D9F1)"
        barRef={barRef}
        onStart={(cx) => {
          const val = drag.getValue(cx);
          if (val !== undefined) onSleepChange(val);
          drag.setDragging(true);
        }}
      />
      <div className="mt-1 flex justify-between text-[11px] text-[var(--clay-title)]/60">
        <span>Cansado</span>
        <span>Radiante</span>
      </div>
    </section>
  );
}

function MoodCard({ mood, onMoodChange }: BemEstarPageProps) {
  return (
    <section className="rounded-2xl bg-white/70 p-5 shadow-sm backdrop-blur-md">
      <h2 className="font-display text-base text-[var(--clay-title)] mb-3">😌 Humor</h2>
      <div className="grid grid-cols-3 gap-2">
        {MOODS.map((m) => (
          <button
            key={m.value}
            onClick={() => onMoodChange(mood === m.value ? "" : m.value)}
            className={`flex flex-col items-center gap-1 rounded-xl p-3 transition-all ${
              mood === m.value
                ? "bg-gradient-to-br from-[#C8E6C9]/60 to-[#D7CBE8]/50 shadow-sm"
                : "bg-white/50 hover:bg-white/70"
            }`}
          >
            <span className="text-2xl">{m.emoji}</span>
            <span className="text-xs font-semibold text-[var(--clay-text)]">{m.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function MovementCard({ movementMinutes, onMovementChange }: BemEstarPageProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const max = 120;
  const drag = useDrag(barRef, (val) => onMovementChange(val), max);

  return (
    <section className="rounded-2xl bg-white/70 p-5 shadow-sm backdrop-blur-md">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-base text-[var(--clay-title)]">🏃 Movimento</h2>
          <p className="mt-0.5 text-sm font-semibold text-[var(--clay-anxiety)]">
            {movementMinutes} min
          </p>
        </div>
      </div>
      <SliderBar
        pct={(movementMinutes / max) * 100}
        color="linear-gradient(90deg, #C8E6C9, #A8D8A8)"
        barRef={barRef}
        onStart={(cx) => {
          const val = drag.getValue(cx);
          if (val !== undefined) onMovementChange(val);
          drag.setDragging(true);
        }}
      />
      <div className="mt-1 flex justify-between text-[11px] text-[var(--clay-title)]/60">
        <span>0 min</span>
        <span>120 min</span>
      </div>
    </section>
  );
}

function EnergyCard({ energyLevel, onEnergyChange }: BemEstarPageProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const drag = useDrag(barRef, (val) => onEnergyChange(val), 100);

  return (
    <section className="rounded-2xl bg-white/70 p-5 shadow-sm backdrop-blur-md">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-base text-[var(--clay-title)]">⚡ Energia</h2>
          <p className="mt-0.5 text-sm font-semibold text-[var(--clay-stress)]">
            {energyLevel < 33 ? "Baixa" : energyLevel < 66 ? "Média" : "Alta"}
          </p>
        </div>
      </div>
      <SliderBar
        pct={energyLevel}
        color="linear-gradient(90deg, #F5D78E, #F0C27A)"
        barRef={barRef}
        onStart={(cx) => {
          const val = drag.getValue(cx);
          if (val !== undefined) onEnergyChange(val);
          drag.setDragging(true);
        }}
      />
      <div className="mt-1 flex justify-between text-[11px] text-[var(--clay-title)]/60">
        <span>Baixa</span>
        <span>Alta</span>
      </div>
    </section>
  );
}

function MealsCard({ meals, onMealToggle }: BemEstarPageProps) {
  return (
    <section className="rounded-2xl bg-white/70 p-5 shadow-sm backdrop-blur-md">
      <h2 className="font-display text-base text-[var(--clay-title)] mb-3">🍽️ Alimentação</h2>
      <div className="grid grid-cols-2 gap-2">
        {MEALS.map((m) => {
          const active = meals.includes(m.name);
          return (
            <button
              key={m.name}
              onClick={() => onMealToggle(m.name)}
              className={`flex items-center gap-2 rounded-xl p-3 transition-all ${
                active
                  ? "bg-gradient-to-br from-[#C8E6C9]/60 to-[#D7CBE8]/50 shadow-sm"
                  : "bg-white/50 hover:bg-white/70"
              }`}
            >
              <span className="text-xl">{m.emoji}</span>
              <span className={`text-xs font-semibold ${active ? "text-[var(--clay-title)]" : "text-[var(--clay-text)]/60"}`}>
                {m.name}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function RespiroCard() {
  return (
    <a
      href="/respiro"
      className="col-span-full flex items-center gap-4 rounded-2xl bg-gradient-to-br from-[#C5D9F1]/30 to-[#D7CBE8]/30 p-5 shadow-sm backdrop-blur-md lg:col-span-1"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/60">
        <span className="text-2xl">🫁</span>
      </div>
      <div className="flex-1">
        <p className="font-display text-base text-[var(--clay-title)]">Respiração Guiada</p>
        <p className="text-sm text-[var(--clay-title)]/60">Pratique uma respiração guiada para relaxar</p>
      </div>
      <span className="text-lg text-[var(--clay-title)]/40">→</span>
    </a>
  );
}
