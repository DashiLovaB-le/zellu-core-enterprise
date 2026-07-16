import { useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { Avatar } from "@/components/Avatar";
import { getSleepLabel, MAIN_MOODS, EXTRA_MOODS, MOOD_MAP } from "@/data";

interface CheckinData {
  id: string;
  user_id: string;
  sleep_hours: number;
  sleep_label: string;
  water_ml: number;
  mood: string;
  created_at: string;
}

interface CheckinPageProps {
  onSave: (data: {
    sleepHours: number;
    sleepLabel: string;
    waterMl: number;
    mood: string;
  }) => Promise<void>;
  saved: boolean;
  saving: boolean;
  todaysCheckin: CheckinData | null;
}

const sleepHoursPresets = [5, 6, 7, 8, 9];
const waterPresets = [500, 1000, 1500, 2000, 2500];

export function MobileCheckinPage({ onSave, saved, saving, todaysCheckin }: CheckinPageProps) {
  const [step, setStep] = useState(0);
  const [sleepHours, setSleepHours] = useState(7);
  const [waterMl, setWaterMl] = useState(1000);
  const [mood, setMood] = useState("");
  const [moodExpanded, setMoodExpanded] = useState(false);

  const sleepLabel = getSleepLabel((sleepHours / 12) * 100);
  const visibleMoods = moodExpanded ? [...MAIN_MOODS, ...EXTRA_MOODS] : MAIN_MOODS;
  const extraCount = EXTRA_MOODS.length;

  const canProceed = () => {
    if (step === 0) return true;
    if (step === 1) return true;
    if (step === 2) return mood !== "";
    return true;
  };

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      onSave({ sleepHours, sleepLabel, waterMl, mood });
    }
  };

  if (todaysCheckin) {
    const moodInfo = MOOD_MAP[todaysCheckin.mood];
    return (
      <MobileShell>
        <div className="flex flex-1 flex-col items-center gap-5 px-4 pt-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#C8E6C9]/60 to-[#D7CBE8]/50">
            <span className="text-4xl">✓</span>
          </div>
          <div>
            <h2 className="font-display text-xl text-[var(--clay-title)]">Check-in completo!</h2>
            <p className="mt-1 text-sm text-[var(--clay-text)]/70">
              Registrado hoje às{" "}
              {new Date(todaysCheckin.created_at).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          <div className="w-full rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur-md">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-white/60 p-3 text-center">
                <span className="block text-xl">{"\uD83D\uDCA4"}</span>
                <span className="mt-1 block text-lg font-bold text-[var(--clay-title)]">
                  {todaysCheckin.sleep_hours}h
                </span>
                <span className="text-[10px] text-[var(--clay-text)]/60">Sono</span>
                <span className="block text-[10px] font-medium text-[var(--clay-self)]">
                  {todaysCheckin.sleep_label}
                </span>
              </div>
              <div className="rounded-xl bg-white/60 p-3 text-center">
                <span className="block text-xl">{"\uD83D\uDCA7"}</span>
                <span className="mt-1 block text-lg font-bold text-[var(--clay-cta)]">
                  {todaysCheckin.water_ml}ml
                </span>
                <span className="text-[10px] text-[var(--clay-text)]/60">Água</span>
              </div>
              <div className="rounded-xl bg-white/60 p-3 text-center">
                <span className="block text-xl">{moodInfo?.emoji ?? ""}</span>
                <span className="mt-1 block text-sm font-bold text-[var(--clay-title)]">
                  {moodInfo?.label ?? todaysCheckin.mood}
                </span>
                <span className="text-[10px] text-[var(--clay-text)]/60">Humor</span>
              </div>
            </div>
          </div>

          <a
            href="/"
            className="w-full rounded-xl bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] py-3 text-sm font-bold text-[oklch(0.25_0.04_254)] shadow-sm"
          >
            Ir para o Chat
          </a>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <header className="mb-4 flex items-center gap-3">
        <Avatar size={36} />
        <div>
          <h1 className="font-display text-xl text-[var(--clay-title)]">Check-in Matinal</h1>
          <p className="text-xs text-[var(--clay-text)]/70">Como você está hoje?</p>
        </div>
      </header>

      <div className="mb-4 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= step ? "bg-gradient-to-r from-[#99BEE5] to-[#C5D9F1]" : "bg-white/40"
            }`}
          />
        ))}
      </div>

      <div className="flex-1">
        {step === 0 && (
          <section className="rounded-2xl bg-white/70 p-5 shadow-sm backdrop-blur-md">
            <h2 className="font-display text-base text-[var(--clay-title)]">Como foi seu sono?</h2>
            <p className="mt-1 text-xs text-[var(--clay-text)]/60">Horas de sono</p>

            <div className="mt-4 flex justify-center gap-2">
              {sleepHoursPresets.map((h) => (
                <button
                  key={h}
                  onClick={() => setSleepHours(h)}
                  className={`flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold transition-all ${
                    sleepHours === h
                      ? "bg-gradient-to-br from-[#D7CBE8] to-[#C5D9F1] text-[var(--clay-title)] shadow-sm"
                      : "bg-white/50 text-[var(--clay-title)]/60"
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-xl bg-white/50 p-3 text-center">
              <span className="text-xs text-[var(--clay-text)]/60">Qualidade: </span>
              <span className="font-semibold text-[var(--clay-self)]">{sleepLabel}</span>
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="rounded-2xl bg-white/70 p-5 shadow-sm backdrop-blur-md">
            <h2 className="font-display text-base text-[var(--clay-title)]">Hidratação</h2>
            <p className="mt-1 text-xs text-[var(--clay-text)]/60">
              Quanto de água você já bebeu hoje?
            </p>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {waterPresets.map((ml) => (
                <button
                  key={ml}
                  onClick={() => setWaterMl(ml)}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                    waterMl === ml
                      ? "bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] text-[oklch(0.25_0.04_254)] shadow-sm"
                      : "bg-white/50 text-[var(--clay-title)]/60"
                  }`}
                >
                  {ml}ml
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-xl bg-white/50 p-3">
              <span className="text-lg">💧</span>
              <div className="flex-1">
                <div className="h-2 overflow-hidden rounded-full bg-white/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#99BEE5] to-[#C5D9F1] transition-all"
                    style={{ width: `${Math.min(100, (waterMl / 2000) * 100)}%` }}
                  />
                </div>
              </div>
              <span className="text-sm font-semibold text-[var(--clay-cta)]">{waterMl}ml</span>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="rounded-2xl bg-white/70 p-5 shadow-sm backdrop-blur-md">
            <h2 className="font-display text-base text-[var(--clay-title)]">Humor</h2>
            <p className="mt-1 text-xs text-[var(--clay-text)]/60">
              Como você está se sentindo agora?
            </p>

            <div
              className={`mt-4 grid gap-1.5 ${moodExpanded ? "grid-cols-4" : "grid-cols-3"}`}
            >
              {visibleMoods.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMood(m.value)}
                  className={`flex flex-col items-center gap-0.5 rounded-xl p-2 transition-all ${
                    mood === m.value
                      ? "bg-gradient-to-br from-[#C8E6C9]/60 to-[#D7CBE8]/50 shadow-sm"
                      : "bg-white/50"
                  }`}
                >
                  <span className="text-lg">{m.emoji}</span>
                  <span className="text-[8px] font-semibold text-[var(--clay-text)]">
                    {m.label}
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setMoodExpanded(!moodExpanded)}
              className="mt-2 w-full py-1.5 text-[10px] font-semibold text-[var(--clay-title)]/50 transition-colors hover:text-[var(--clay-title)]/80"
            >
              {moodExpanded ? "▲ Mostrar menos" : `▼ Ver +${extraCount} humores`}
            </button>
          </section>
        )}
      </div>

      <div className="mt-5">
        <button
          onClick={handleNext}
          disabled={!canProceed() || saving}
          className="w-full rounded-xl bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] py-3 text-sm font-bold text-[oklch(0.25_0.04_254)] shadow-sm active:translate-y-px disabled:opacity-50"
        >
          {saving ? "Salvando..." : step < 2 ? "Próximo" : "Finalizar check-in"}
        </button>
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            disabled={saving}
            className="mt-2 w-full py-2 text-xs text-[var(--clay-title)]/50 underline"
          >
            Voltar
          </button>
        )}
      </div>
    </MobileShell>
  );
}
