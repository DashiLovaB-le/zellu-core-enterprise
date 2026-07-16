import { useState } from "react";
import { DesktopShell } from "@/components/DesktopShell";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import type { TimelineData } from "@/lib/services/timeline-service";
import { PreventiveAlertBanner } from "@/components/PreventiveAlertBanner";
import type { PreventiveAlert } from "@/lib/services/preventiva-service";

interface TimelinePageProps {
  data: TimelineData;
  onSaveEntry: (content: string, mood?: string) => void;
  preventiveAlert?: PreventiveAlert;
  onSuggestionClick?: (suggestion: string) => void;
}

const MOOD_OPTIONS = [
  { emoji: "😊", label: "Feliz", value: "feliz" },
  { emoji: "😌", label: "Calmo", value: "calmo" },
  { emoji: "😐", label: "Neutro", value: "neutro" },
  { emoji: "😟", label: "Ansioso", value: "ansioso" },
  { emoji: "😢", label: "Triste", value: "triste" },
  { emoji: "😤", label: "Irritado", value: "irritado" },
];

const DAY_HEADERS = ["D", "S", "T", "Q", "Q", "S", "S"];

function getWeekday(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function DesktopTimelinePage({ data, onSaveEntry, preventiveAlert, onSuggestionClick }: TimelinePageProps) {
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newMood, setNewMood] = useState("");

  const handleSave = () => {
    if (!newContent.trim()) return;
    onSaveEntry(newContent.trim(), newMood || undefined);
    setNewContent("");
    setNewMood("");
    setShowNewEntry(false);
  };

  const firstGridDate = new Date();
  firstGridDate.setDate(firstGridDate.getDate() - 13);
  const startWeekday = getWeekday(firstGridDate);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const isCurrentMonth =
    today.getMonth() === firstGridDate.getMonth() || today.getMonth() === new Date().getMonth();

  return (
    <DesktopShell>
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex items-center gap-3">
          <Avatar size={40} />
          <div className="flex-1">
            <h1 className="font-display text-2xl text-[var(--clay-title)]">Meu Diário</h1>
            <p className="text-sm text-[var(--clay-text)]/70">
              Registre e acompanhe sua evolução emocional
            </p>
          </div>
          <button
            onClick={() => setShowNewEntry(!showNewEntry)}
            className="flex items-center gap-1 rounded-lg bg-white/70 px-3 py-1.5 text-xs font-semibold text-[var(--clay-cta)] shadow-sm hover:bg-white/90"
          >
            <Icon name="add" className="text-sm" />
            {showNewEntry ? "Fechar" : "Nova Entrada"}
          </button>
        </header>

        {preventiveAlert && (
          <div className="mb-6">
            <PreventiveAlertBanner alert={preventiveAlert} onSuggestionClick={onSuggestionClick} />
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2">
            <div className="rounded-2xl bg-white/70 p-5 shadow-sm backdrop-blur-md">
              <div className="mb-2 flex items-center gap-2">
                <Icon name="auto_awesome" filled className="text-sm text-[var(--clay-cta)]" />
                <h2 className="text-sm font-semibold text-[var(--clay-title)]">
                  Insight da jornada
                </h2>
              </div>
              <p className="text-sm leading-relaxed text-[var(--clay-text)]">{data.aiInsight}</p>
            </div>

            <div className="mt-5">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
                Timeline
              </h3>

              {showNewEntry && (
                <div className="mb-4 rounded-xl bg-white/70 p-4 shadow-sm">
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Como você está se sentindo hoje?"
                    rows={3}
                    className="w-full resize-none bg-transparent text-sm text-[var(--clay-text)] outline-none placeholder:text-[var(--clay-title)]/50"
                  />
                  <div className="mt-2 flex flex-wrap gap-1">
                    {MOOD_OPTIONS.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => setNewMood(m.value === newMood ? "" : m.value)}
                        className={`rounded-lg px-3 py-1 text-xs transition-all ${
                          newMood === m.value
                            ? "bg-white/80 shadow-sm font-semibold"
                            : "bg-white/40 text-[var(--clay-text)]/70 hover:bg-white/60"
                        }`}
                      >
                        {m.emoji} {m.label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setShowNewEntry(false);
                        setNewContent("");
                        setNewMood("");
                      }}
                      className="rounded-lg px-4 py-1.5 text-sm text-[var(--clay-title)]/60 hover:text-[var(--clay-title)]"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={!newContent.trim()}
                      className="rounded-lg bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] px-5 py-1.5 text-sm font-bold text-[oklch(0.25_0.04_254)] shadow-sm disabled:opacity-50"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3">
                {data.days.length === 0 && !showNewEntry && (
                  <p className="py-8 text-center text-sm text-[var(--clay-title)]/50">
                    Nenhum registro ainda. Clique em "Nova Entrada" para começar sua timeline.
                  </p>
                )}
                {data.days.map((day) => (
                  <div key={day.date} className="rounded-xl bg-white/60 p-4 shadow-sm">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-lg">{day.moodEmoji || "📅"}</span>
                      <span className="text-sm font-bold text-[var(--clay-title)]">
                        {day.dayLabel}
                      </span>
                      <span className="text-xs text-[var(--clay-title)]/50">
                        {day.date === todayStr
                          ? ""
                          : new Date(day.date + "T12:00:00").toLocaleDateString("pt-BR", {
                              day: "numeric",
                              month: "short",
                            })}
                      </span>
                      {day.mood && (
                        <span className="ml-auto text-xs bg-white/50 rounded-full px-2 py-0.5 capitalize text-[var(--clay-title)]/70">
                          {day.mood}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {day.events
                        .filter((e) => e.type !== "diary")
                        .map((evt, ei) => (
                          <div
                            key={ei}
                            className="flex items-center gap-2 text-sm text-[var(--clay-text)]/80"
                          >
                            <span className="shrink-0">{evt.emoji}</span>
                            <span>{evt.description}</span>
                          </div>
                        ))}
                      {day.diaryEntry && (
                        <div className="mt-1.5 rounded-lg bg-white/40 p-3 text-sm leading-relaxed text-[var(--clay-text)] italic">
                          "{day.diaryEntry.content}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <div className="rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur-md sticky top-24">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
                Humor Recente
              </h3>
              <div className="rounded-lg bg-white/40 p-3">
                <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-[var(--clay-title)]/60">
                  {DAY_HEADERS.map((d, i) => (
                    <span key={i}>{d}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: startWeekday }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {data.moodGrid.map((cell, i) => (
                    <div
                      key={i}
                      className={`flex aspect-square items-center justify-center rounded-full text-xs font-bold ${
                        cell.mood && cell.day === today.getDate() && isCurrentMonth
                          ? "ring-2 ring-[var(--clay-cta)] ring-offset-2 ring-offset-white/50"
                          : ""
                      }`}
                      style={{
                        background: cell.color
                          ? `linear-gradient(135deg, ${cell.color}, color-mix(in oklab, ${cell.color} 70%, white))`
                          : "rgba(142,163,193,0.06)",
                        color: cell.color ? "var(--clay-text)" : "var(--clay-title)",
                      }}
                    >
                      {cell.day}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
                  Resumo
                </h4>
                <p className="text-xs leading-relaxed text-[var(--clay-text)]/70">
                  {data.days.length > 0
                    ? `Você tem ${data.days.length} ${data.days.length === 1 ? "dia registrado" : "dias registrados"} nos últimos 30 dias.`
                    : "Comece a registrar para acompanhar sua jornada."}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </DesktopShell>
  );
}
