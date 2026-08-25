import { useRef, useEffect, useState, type RefObject } from "react";
import { DesktopShell } from "@/components/DesktopShell";
import { getSleepLabel, MAIN_MEALS, EXTRA_MEALS, MAIN_MOODS, EXTRA_MOODS } from "@/data";
import { Mascot } from "@/components/Mascot";

interface BemEstarPageProps {
  water: number;
  sleepQuality: number;
  mood: string;
  movementMinutes: number;
  energyLevel: number;
  meals: string[];
  goal: number;
  fromCheckin: { water: boolean; sleep: boolean; mood: boolean };
  hasCheckin?: boolean;
  saving: boolean;
  lastSaved: string | null;
  hasEdits: boolean;
  onSave: () => void;
  onWaterChange: (val: number) => void;
  onSleepChange: (val: number) => void;
  onMoodChange: (val: string) => void;
  onMovementChange: (val: number) => void;
  onEnergyChange: (val: number) => void;
  onMealToggle: (meal: string) => void;
}

export function DesktopBemEstarPage(props: BemEstarPageProps) {
  return (
    <DesktopShell>
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Mascot pose="idle-calm" size="sm" />
            <div>
              <h1 className="font-display text-2xl text-[var(--clay-title)]">Meu Bem-estar</h1>
              <p className="text-sm text-[var(--clay-text)]/70">
                {props.hasCheckin
                  ? "Água, sono e humor vieram do check-in de hoje"
                  : "Preencha seu resumo do dia"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {props.lastSaved && (
              <span className="text-xs text-[var(--clay-title)]/50">✓ Salvo às {props.lastSaved}</span>
            )}
            <button
              onClick={props.onSave}
              disabled={props.saving}
              className="rounded-xl bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] px-5 py-2 text-sm font-bold text-[oklch(0.25_0.04_254)] shadow-sm active:translate-y-px disabled:opacity-50"
            >
              {props.saving ? "Salvando..." : "Salvar dia"}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <WaterCard {...props} readOnly={props.fromCheckin.water} />
          <SleepCard {...props} readOnly={props.fromCheckin.sleep} />
          <MoodCard {...props} readOnly={props.fromCheckin.mood} />
          <MovementCard {...props} />
          <EnergyCard {...props} />
          <MealsCard {...props} />
          <RespiroCard />
        </div>
      </div>
    </DesktopShell>
  );
}

function StaticBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="relative mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/50 shadow-inner">
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function SliderBar({
  pct, color, barRef, onStart,
}: {
  pct: number; color: string; barRef: RefObject<HTMLDivElement | null>; onStart: (cx: number) => void;
}) {
  return (
    <div
      ref={barRef}
      className="relative mt-3 h-2.5 w-full cursor-pointer overflow-hidden rounded-full bg-white/50 shadow-inner"
      onMouseDown={(e) => onStart(e.clientX)}
      onTouchStart={(e) => onStart(e.touches[0].clientX)}
    >
      <div className="h-full rounded-full transition-all duration-150" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function useDrag(barRef: RefObject<HTMLDivElement | null>, onChange: (val: number) => void, max: number) {
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

function WaterCard(props: BemEstarPageProps & { readOnly: boolean }) {
  const barRef = useRef<HTMLDivElement>(null);
  const pct = Math.min(100, (props.water / props.goal) * 100);
  const drag = useDrag(barRef, props.onWaterChange, props.goal);

  return (
    <section className="rounded-2xl bg-white/70 p-5 shadow-sm backdrop-blur-md">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-base text-[var(--clay-title)]">💧 Água</h2>
          <p className="mt-0.5 text-sm font-semibold text-[var(--clay-cta)]">
            {props.water}ml / {props.goal}ml
          </p>
        </div>
        {props.readOnly ? (
          <span className="text-xs font-semibold text-green-600">✓ check-in</span>
        ) : (
          <div className="flex gap-1.5">
            <button onClick={() => props.onWaterChange(Math.max(0, props.water - 100))}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/50 text-sm font-bold text-[var(--clay-title)]/60 hover:bg-white/70">−</button>
            <button onClick={() => props.onWaterChange(Math.min(props.goal, props.water + 100))}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/50 text-sm font-bold text-[var(--clay-title)]/60 hover:bg-white/70">+</button>
          </div>
        )}
      </div>
      {props.readOnly ? (
        <StaticBar pct={pct} color="linear-gradient(90deg, #99BEE5, #C5D9F1)" />
      ) : (
        <SliderBar pct={pct} color="linear-gradient(90deg, #99BEE5, #C5D9F1)" barRef={barRef}
          onStart={(cx) => { const val = drag.getValue(cx); if (val !== undefined) props.onWaterChange(val); drag.setDragging(true); }} />
      )}
    </section>
  );
}

function SleepCard(props: BemEstarPageProps & { readOnly: boolean }) {
  return (
    <section className="rounded-2xl bg-white/70 p-5 shadow-sm backdrop-blur-md">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-base text-[var(--clay-title)]">🌙 Sono</h2>
          <p className="mt-0.5 text-sm font-semibold text-[var(--clay-self)]">
            {getSleepLabel(props.sleepQuality)}
          </p>
        </div>
        {props.readOnly && <span className="text-xs font-semibold text-green-600">✓ check-in</span>}
      </div>
      <StaticBar pct={props.sleepQuality} color="linear-gradient(90deg, #D7CBE8, #C5D9F1)" />
      <div className="mt-1 flex justify-between text-[11px] text-[var(--clay-title)]/60">
        <span>Cansado</span>
        <span>Descansado</span>
      </div>
    </section>
  );
}

function MoodCard(props: BemEstarPageProps & { readOnly: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const allMoods = [...MAIN_MOODS, ...EXTRA_MOODS];
  const visible = expanded ? allMoods : MAIN_MOODS;
  const extraCount = allMoods.length - MAIN_MOODS.length;

  return (
    <section className="rounded-2xl bg-white/70 p-5 shadow-sm backdrop-blur-md">
      <div className="flex items-start justify-between mb-3">
        <h2 className="font-display text-base text-[var(--clay-title)]">😌 Humor</h2>
        {props.readOnly && <span className="text-xs font-semibold text-green-600">✓ check-in</span>}
      </div>
      <div className={`grid ${expanded ? "grid-cols-4 sm:grid-cols-5" : "grid-cols-3 sm:grid-cols-6"} gap-2`}>
        {visible.map((m) => (
          <button key={m.value}
            onClick={() => { if (!props.readOnly) props.onMoodChange(props.mood === m.value ? "" : m.value); }}
            className={`flex flex-col items-center gap-1 rounded-xl p-3 transition-all ${props.mood === m.value ? "bg-gradient-to-br from-[#C8E6C9]/60 to-[#D7CBE8]/50 shadow-sm" : "bg-white/50 hover:bg-white/70"} ${props.readOnly ? "cursor-default" : ""}`}>
            <span className="text-2xl">{m.emoji}</span>
            <span className="text-xs font-semibold text-[var(--clay-text)]">{m.label}</span>
          </button>
        ))}
      </div>
      {!props.readOnly && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 w-full py-1.5 text-xs font-semibold text-[var(--clay-title)]/50 hover:text-[var(--clay-title)]/80 transition-colors"
        >
          {expanded ? "▲ Mostrar menos" : `▼ Ver +${extraCount} humores`}
        </button>
      )}
    </section>
  );
}

function MovementCard(props: BemEstarPageProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const max = 120;
  const drag = useDrag(barRef, props.onMovementChange, max);

  return (
    <section className="rounded-2xl bg-white/70 p-5 shadow-sm backdrop-blur-md">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-base text-[var(--clay-title)]">🏃 Movimento</h2>
          <p className="mt-0.5 text-sm font-semibold text-[var(--clay-anxiety)]">{props.movementMinutes} min</p>
        </div>
      </div>
      <SliderBar pct={(props.movementMinutes / max) * 100} color="linear-gradient(90deg, #C8E6C9, #A8D8A8)" barRef={barRef}
        onStart={(cx) => { const val = drag.getValue(cx); if (val !== undefined) props.onMovementChange(val); drag.setDragging(true); }} />
      <div className="mt-1 flex justify-between text-[11px] text-[var(--clay-title)]/60">
        <span>0 min</span>
        <span>120 min</span>
      </div>
    </section>
  );
}

function EnergyCard(props: BemEstarPageProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const drag = useDrag(barRef, props.onEnergyChange, 100);

  return (
    <section className="rounded-2xl bg-white/70 p-5 shadow-sm backdrop-blur-md">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-base text-[var(--clay-title)]">⚡ Energia</h2>
          <p className="mt-0.5 text-sm font-semibold text-[var(--clay-stress)]">
            {props.energyLevel < 33 ? "Baixa" : props.energyLevel < 66 ? "Média" : "Alta"}
          </p>
        </div>
      </div>
      <SliderBar pct={props.energyLevel} color="linear-gradient(90deg, #F5D78E, #F0C27A)" barRef={barRef}
        onStart={(cx) => { const val = drag.getValue(cx); if (val !== undefined) props.onEnergyChange(val); drag.setDragging(true); }} />
      <div className="mt-1 flex justify-between text-[11px] text-[var(--clay-title)]/60">
        <span>Baixa</span>
        <span>Alta</span>
      </div>
    </section>
  );
}

function MealsCard({ meals, onMealToggle }: BemEstarPageProps) {
  const [expanded, setExpanded] = useState(false);
  const allMeals = [...MAIN_MEALS, ...EXTRA_MEALS];
  const visible = expanded ? allMeals : MAIN_MEALS;
  const extraCount = allMeals.length - MAIN_MEALS.length;

  return (
    <section className="rounded-2xl bg-white/70 p-5 shadow-sm backdrop-blur-md">
      <h2 className="font-display text-base text-[var(--clay-title)] mb-3">🍽️ Alimentação</h2>
      <div className="flex flex-wrap gap-2">
        {visible.map((m) => {
          const active = meals.includes(m.name);
          return (
            <button key={m.name} onClick={() => onMealToggle(m.name)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 transition-all ${
                active
                  ? "bg-gradient-to-br from-[#C8E6C9]/60 to-[#D7CBE8]/50 shadow-sm"
                  : "bg-white/50 hover:bg-white/70"
              }`}>
              <span className="text-base leading-none">{m.emoji}</span>
              <span className={`text-xs font-semibold leading-tight whitespace-nowrap ${
                active ? "text-[var(--clay-title)]" : "text-[var(--clay-text)]/60"
              }`}>{m.name}</span>
            </button>
          );
        })}
      </div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-3 w-full py-1.5 text-xs font-semibold text-[var(--clay-title)]/50 hover:text-[var(--clay-title)]/80 transition-colors"
      >
        {expanded ? "▲ Mostrar menos" : `▼ Ver +${extraCount} refeições`}
      </button>
    </section>
  );
}

function RespiroCard() {
  return (
    <a href="/respiro" className="col-span-full flex items-center gap-4 rounded-2xl bg-gradient-to-br from-[#C5D9F1]/30 to-[#D7CBE8]/30 p-5 shadow-sm backdrop-blur-md lg:col-span-1">
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
