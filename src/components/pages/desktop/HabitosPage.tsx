import { useState, useRef, useEffect } from "react";
import { DesktopShell } from "@/components/DesktopShell";
import { Icon } from "@/components/Icon";
import { MEALS, WATER_GOAL, getSleepLabel } from "@/data";

interface HabitosPageProps {
  water: number;
  onWaterChange: (val: number) => void;
  sleepQuality: number;
  onSleepChange: (val: number) => void;
}

export function DesktopHabitosPage({
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
    <DesktopShell>
      <header className="mb-8">
        <h1 className="font-display text-4xl text-[var(--clay-title)]">Meus Hábitos</h1>
        <p className="mt-1 text-base text-[var(--clay-text)]/80">
          Cuidar do corpo é o primeiro passo para acolher a mente.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section
          className="p-6 clay-card lg:col-span-2"
          style={{
            background: "linear-gradient(160deg, rgba(211,228,255,0.7), rgba(255,255,255,0.85))",
          }}
        >
          <div className="flex flex-col items-center lg:flex-row lg:gap-10">
            <div className="text-center lg:text-left">
              <h2 className="font-display text-2xl text-[var(--clay-title)]">
                Dê um gole na sua hidratação.
              </h2>
              <p className="mt-1 text-lg font-semibold text-[var(--clay-cta)]">
                {water} ml inseridos hoje
              </p>
            </div>

            <div className="my-5 flex justify-center lg:my-0">
              <div className="relative h-40 w-28 overflow-hidden rounded-2xl border-2 border-white/80 bg-white/50 shadow-inner">
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

            <div className="flex-1 self-center">
              <div
                ref={barRef}
                className="relative h-6 w-full overflow-hidden rounded-full bg-white/60 shadow-inner cursor-pointer"
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
                  className="h-full rounded-full transition-all duration-150"
                  style={{
                    width: `${pct}%`,
                    background: "linear-gradient(90deg, #A9C7E9, #C5D9F1)",
                    boxShadow: "inset 1px 1px 2px rgba(255,255,255,0.6)",
                  }}
                />
                <div
                  className="absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full clay-cta cursor-grab active:cursor-grabbing"
                  style={{ left: `calc(${pct}% - 20px)` }}
                  aria-label="Ajustar hidratação"
                >
                  <Icon name="water_drop" filled className="text-[18px]" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="p-6 clay-card">
          <h3 className="mb-4 font-display text-lg text-[var(--clay-title)]">
            Alimentação Afetiva
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {MEALS.map((m) => (
              <button
                key={m.name}
                className="flex flex-col items-center gap-3 p-5 clay-soft hover:bg-white/60"
                style={{
                  background: `linear-gradient(160deg, color-mix(in oklab, ${m.tint} 80%, white), rgba(255,255,255,0.7))`,
                }}
              >
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/80 text-4xl shadow-inner">
                  {m.emoji}
                </span>
                <span className="text-base font-bold" style={{ color: m.textColor }}>
                  {m.name}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="p-6 clay-card">
          <h3 className="mb-4 font-display text-lg text-[var(--clay-title)]">
            Monitoramento do Sono
          </h3>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[var(--clay-text)]/70">Qualidade da noite</p>
              <p className="font-display text-2xl" style={{ color: "var(--clay-self)" }}>
                {getSleepLabel(sleepQuality)}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full clay-soft">
              <Icon name="bedtime" filled className="text-[var(--clay-self)] text-2xl" />
            </div>
          </div>

          <div
            ref={sleepBarRef}
            className="relative mt-6 h-28 cursor-pointer"
            onMouseDown={(e) => handleSleepChange(e.clientX)}
            onTouchStart={(e) => handleSleepChange(e.touches[0].clientX)}
          >
            <svg
              viewBox="0 0 200 80"
              className="pointer-events-none absolute inset-0 h-full w-full"
            >
              <path
                d="M 10 70 Q 100 0 190 70"
                fill="none"
                stroke="rgba(142,163,193,0.3)"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            <div
              className={`absolute -top-1 flex h-12 w-12 items-center justify-center rounded-full clay-cta transition-all duration-200 ${
                sleepBounce ? "scale-125" : "scale-100"
              }`}
              style={{
                left: `calc(${10 + sleepQuality * 0.8}%)`,
                background: "linear-gradient(135deg, #D7CBE8, #C5D9F1)",
              }}
            >
              <span className="select-none text-xl">🌙</span>
            </div>
          </div>

          <div className="mt-3 flex justify-between text-sm text-[var(--clay-text)]/70">
            <span>Cansado</span>
            <span>Radiante</span>
          </div>
        </section>
      </div>
    </DesktopShell>
  );
}
