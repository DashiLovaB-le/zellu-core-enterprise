import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { DesktopShell } from "@/components/DesktopShell";
import { Avatar } from "@/components/Avatar";
import { useAuth } from "@/lib/auth-context";
import { getSleepLabel, MAIN_MOODS, EXTRA_MOODS, MOOD_MAP } from "@/data";
import { Mascot } from "@/components/Mascot";

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

export function DesktopCheckinPage({ onSave, saved, saving, todaysCheckin }: CheckinPageProps) {
  const { user } = useAuth();
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
      <DesktopShell>
        <div className="mx-auto max-w-2xl">
          <header className="mb-6 flex items-center gap-3">
            <Avatar name={user?.avatar_url ?? undefined} size={40} />
            <div>
              <h1 className="font-display text-2xl text-[var(--clay-title)]">Check-in Matinal</h1>
              <p className="text-sm text-[var(--clay-text)]/70">
                Check-in de hoje já foi registrado
              </p>
            </div>
          </header>

          <div className="rounded-2xl bg-white/70 p-6 shadow-sm backdrop-blur-md">
            <div className="mb-5 flex items-center gap-3">
              <Mascot pose="cheer" size="md" />
              <div>
                <h2 className="font-display text-lg text-[var(--clay-title)]">
                  Check-in completo!
                </h2>
                <p className="text-xs text-[var(--clay-text)]/60">
                  Registrado em{" "}
                  {new Date(todaysCheckin.created_at).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl bg-white/60 p-4 text-center">
                <span className="block text-2xl">{"\uD83D\uDCA4"}</span>
                <span className="mt-1 block text-xl font-bold text-[var(--clay-title)]">
                  {todaysCheckin.sleep_hours}h
                </span>
                <span className="text-xs text-[var(--clay-text)]/60">Sono</span>
                <span className="block text-xs font-medium text-[var(--clay-self)]">
                  {todaysCheckin.sleep_label}
                </span>
              </div>
              <div className="rounded-xl bg-white/60 p-4 text-center">
                <span className="block text-2xl">{"\uD83D\uDCA7"}</span>
                <span className="mt-1 block text-xl font-bold text-[var(--clay-cta)]">
                  {todaysCheckin.water_ml}ml
                </span>
                <span className="text-xs text-[var(--clay-text)]/60">Água</span>
              </div>
              <div className="rounded-xl bg-white/60 p-4 text-center">
                <span className="block text-2xl">{moodInfo?.emoji ?? ""}</span>
                <span className="mt-1 block text-lg font-bold text-[var(--clay-title)]">
                  {moodInfo?.label ?? todaysCheckin.mood}
                </span>
                <span className="text-xs text-[var(--clay-text)]/60">Humor</span>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/chat"
              className="inline-block rounded-xl bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] px-6 py-2.5 text-sm font-bold text-[oklch(0.25_0.04_254)] shadow-sm"
            >
              Ir para o Chat
            </Link>
          </div>
        </div>
      </DesktopShell>
    );
  }

  return (
    <DesktopShell>
      <div className="mx-auto max-w-2xl">
        <header className="mb-6 flex items-center gap-3">
          <Mascot pose="encourage" size="md" />
          <Avatar name={user?.avatar_url ?? undefined} size={40} />
          <div>
            <h1 className="font-display text-2xl text-[var(--clay-title)]">Check-in Matinal</h1>
            <p className="text-sm text-[var(--clay-text)]/70">Como você está hoje?</p>
          </div>
        </header>

        <div className="mb-6 flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-gradient-to-r from-[#99BEE5] to-[#C5D9F1]" : "bg-white/40"
              }`}
            />
          ))}
        </div>

        {step === 0 && (
          <section className="rounded-2xl bg-white/70 p-6 shadow-sm backdrop-blur-md">
            <h2 className="font-display text-lg text-[var(--clay-title)]">Como foi seu sono?</h2>
            <p className="mt-1 text-sm text-[var(--clay-text)]/60">Horas de sono</p>

            <div className="mt-5 flex justify-center gap-3">
              {sleepHoursPresets.map((h) => (
                <button
                  key={h}
                  onClick={() => setSleepHours(h)}
                  className={`flex h-14 w-14 items-center justify-center rounded-xl text-base font-bold transition-all ${
                    sleepHours === h
                      ? "bg-gradient-to-br from-[#D7CBE8] to-[#C5D9F1] text-[var(--clay-title)] shadow-sm"
                      : "bg-white/50 text-[var(--clay-title)]/60 hover:bg-white/70"
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-xl bg-white/50 p-3 text-center">
              <span className="text-sm text-[var(--clay-text)]/60">Qualidade: </span>
              <span className="font-semibold text-[var(--clay-self)]">{sleepLabel}</span>
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="rounded-2xl bg-white/70 p-6 shadow-sm backdrop-blur-md">
            <h2 className="font-display text-lg text-[var(--clay-title)]">Hidratação</h2>
            <p className="mt-1 text-sm text-[var(--clay-text)]/60">
              Quanto de água você já bebeu hoje?
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {waterPresets.map((ml) => (
                <button
                  key={ml}
                  onClick={() => setWaterMl(ml)}
                  className={`rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
                    waterMl === ml
                      ? "bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] text-[oklch(0.25_0.04_254)] shadow-sm"
                      : "bg-white/50 text-[var(--clay-title)]/60 hover:bg-white/70"
                  }`}
                >
                  {ml}ml
                </button>
              ))}
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-xl bg-white/50 p-4">
              <span className="text-2xl">💧</span>
              <div className="flex-1">
                <div className="h-3 overflow-hidden rounded-full bg-white/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#99BEE5] to-[#C5D9F1] transition-all"
                    style={{ width: `${Math.min(100, (waterMl / 2000) * 100)}%` }}
                  />
                </div>
              </div>
              <span className="text-base font-semibold text-[var(--clay-cta)]">{waterMl}ml</span>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="rounded-2xl bg-white/70 p-6 shadow-sm backdrop-blur-md">
            <h2 className="font-display text-lg text-[var(--clay-title)]">Humor</h2>
            <p className="mt-1 text-sm text-[var(--clay-text)]/60">
              Como você está se sentindo agora?
            </p>

            <div
              className={`mt-5 grid gap-2 ${
                moodExpanded ? "grid-cols-4 sm:grid-cols-5" : "grid-cols-3 sm:grid-cols-6"
              }`}
            >
              {visibleMoods.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMood(m.value)}
                  className={`flex flex-col items-center gap-1 rounded-xl p-3 transition-all ${
                    mood === m.value
                      ? "bg-gradient-to-br from-[#C8E6C9]/60 to-[#D7CBE8]/50 shadow-sm"
                      : "bg-white/50 hover:bg-white/70"
                  }`}
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="text-[10px] font-semibold text-[var(--clay-text)]">
                    {m.label}
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setMoodExpanded(!moodExpanded)}
              className="mt-3 w-full py-2 text-xs font-semibold text-[var(--clay-title)]/50 transition-colors hover:text-[var(--clay-title)]/80"
            >
              {moodExpanded ? "▲ Mostrar menos" : `▼ Ver +${extraCount} humores`}
            </button>
          </section>
        )}

        <div className="mt-6 flex items-center gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              disabled={saving}
              className="rounded-xl bg-white/50 px-5 py-2.5 text-sm font-semibold text-[var(--clay-title)]/60 shadow-sm hover:bg-white/70"
            >
              Voltar
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed() || saving}
            className="flex-1 rounded-xl bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] py-2.5 text-sm font-bold text-[oklch(0.25_0.04_254)] shadow-sm active:translate-y-px disabled:opacity-50"
          >
            {saving ? "Salvando..." : step < 2 ? "Próximo" : "Finalizar check-in"}
          </button>
        </div>
      </div>
    </DesktopShell>
  );
}
