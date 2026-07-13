import { useState, useRef, useEffect } from "react";
import { MobileShell } from "@/components/MobileShell";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { MEALS, WATER_GOAL, getSleepLabel } from "@/data";

interface HabitosPageProps {
  water: number;
  onWaterChange: (val: number) => void;
  sleepQuality: number;
  onSleepChange: (val: number) => void;
}

export function MobileHabitosPage({
  water,
  onWaterChange,
  sleepQuality,
  onSleepChange,
}: HabitosPageProps) {
  const [isWaterDragging, setIsWaterDragging] = useState(false);
  const [sleepBounce, setSleepBounce] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const sleepBarRef = useRef<HTMLDivElement>(null);

  const pct = Math.min(100, (water / WATER_GOAL) * 100);

  const getWaterFromEvent = (clientX: number) => {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    return Math.round((x / rect.width) * WATER_GOAL);
  };

  useEffect(() => {
    if (!isWaterDragging) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
      const val = getWaterFromEvent(cx);
      if (val !== undefined) onWaterChange(val);
    };
    const onUp = () => setIsWaterDragging(false);
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
  }, [isWaterDragging, onWaterChange]);

  const handleSleepChange = (clientX: number) => {
    if (!sleepBarRef.current) return;
    const rect = sleepBarRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    onSleepChange(Math.round((x / rect.width) * 100));
    setSleepBounce(true);
    setTimeout(() => setSleepBounce(false), 300);
  };

  return (
    <MobileShell>
      <header className="mb-4 flex items-center gap-3">
        <Avatar size={36} />
        <div>
          <h1 className="font-display text-xl text-[var(--clay-title)]">Meus Hábitos</h1>
          <p className="text-xs text-[var(--clay-text)]/70">
            Cuidar do corpo é o primeiro passo para acolher a mente.
          </p>
        </div>
      </header>

      <section className="mb-5 rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-base text-[var(--clay-title)]">Hidratação</h2>
            <p className="mt-0.5 text-xs font-semibold text-[var(--clay-cta)]">
              {water} ml de {WATER_GOAL} ml
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/60 shadow-sm">
            <Icon name="water_drop" filled className="text-sm text-[var(--clay-cta)]" />
          </div>
        </div>

        <div
          ref={barRef}
          className="relative mt-3 h-2 w-full overflow-hidden rounded-full bg-white/50 shadow-inner cursor-pointer"
          onMouseDown={(e) => {
            setIsWaterDragging(true);
            const val = getWaterFromEvent(e.clientX);
            if (val !== undefined) onWaterChange(val);
          }}
          onTouchStart={(e) => {
            setIsWaterDragging(true);
            const val = getWaterFromEvent(e.touches[0].clientX);
            if (val !== undefined) onWaterChange(val);
          }}
        >
          <div
            className="h-full rounded-full transition-all duration-150 bg-gradient-to-r from-[#99BEE5] to-[#C5D9F1]"
            style={{ width: `${pct}%` }}
          />
        </div>
      </section>

      <section className="mb-5">
        <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
          Alimentação
        </h3>
        <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
          {MEALS.map((m) => (
            <button
              key={m.name}
              className="flex w-28 shrink-0 flex-col items-center gap-2 rounded-xl bg-white/60 p-3 shadow-sm"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/70 text-xl shadow-sm">
                {m.emoji}
              </span>
              <span className="text-xs font-semibold" style={{ color: m.textColor }}>
                {m.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
          Sono
        </h3>
        <div className="rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-[var(--clay-title)]/60">Qualidade da noite</p>
              <p className="font-display text-lg" style={{ color: "var(--clay-self)" }}>
                {getSleepLabel(sleepQuality)}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/60 shadow-sm">
              <Icon name="bedtime" filled className="text-sm text-[var(--clay-self)]" />
            </div>
          </div>

          <div
            ref={sleepBarRef}
            className="relative mt-3 h-20 cursor-pointer"
            onMouseDown={(e) => handleSleepChange(e.clientX)}
            onTouchStart={(e) => handleSleepChange(e.touches[0].clientX)}
          >
            <svg
              viewBox="0 0 200 70"
              className="pointer-events-none absolute inset-0 h-full w-full"
            >
              <path
                d="M 10 60 Q 100 0 190 60"
                fill="none"
                stroke="rgba(142,163,193,0.2)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <div
              className={`absolute -top-1 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#D7CBE8] to-[#C5D9F1] shadow-sm transition-all duration-200 ${
                sleepBounce ? "scale-125" : "scale-100"
              }`}
              style={{ left: `calc(${10 + sleepQuality * 0.8}%)` }}
            >
              <span className="select-none text-sm">🌙</span>
            </div>
          </div>

          <div className="mt-1 flex justify-between text-[10px] text-[var(--clay-title)]/60">
            <span>Cansado</span>
            <span>Radiante</span>
          </div>
        </div>
      </section>
    </MobileShell>
  );
}
