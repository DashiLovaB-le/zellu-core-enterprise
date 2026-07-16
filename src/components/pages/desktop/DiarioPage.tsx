import { useMemo, useState } from "react";
import { DesktopShell } from "@/components/DesktopShell";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { DAYS } from "@/data";
import type { DiaryEntry } from "@/lib/services/diario-service";

interface DiarioPageProps {
  entries: DiaryEntry[];
  onSaveEntry: (content: string, mood?: string) => void;
}

const MOOD_OPTIONS = [
  { emoji: "😊", label: "Feliz", value: "feliz" },
  { emoji: "😌", label: "Calmo", value: "calmo" },
  { emoji: "😐", label: "Neutro", value: "neutro" },
  { emoji: "😟", label: "Ansioso", value: "ansioso" },
  { emoji: "😢", label: "Triste", value: "triste" },
  { emoji: "😤", label: "Irritado", value: "irritado" },
];

const MOOD_TINT: Record<string, string> = {
  feliz: "var(--clay-joy)",
  calmo: "var(--clay-cta)",
  neutro: "var(--clay-cta-2)",
  ansioso: "var(--clay-anxiety)",
  triste: "var(--clay-self)",
  irritado: "var(--clay-stress)",
};

function buildRecentMoodDays(entries: DiaryEntry[]): (string | null)[] {
  const byDate = new Map<string, string>();
  for (const entry of entries) {
    if (!entry.mood) continue;
    const day = entry.created_at.slice(0, 10);
    if (!byDate.has(day)) byDate.set(day, entry.mood);
  }

  const cells: (string | null)[] = [];
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const mood = byDate.get(key);
    cells.push(mood ? (MOOD_TINT[mood] ?? "var(--clay-cta)") : null);
  }
  return cells;
}

export function DesktopDiarioPage({ entries, onSaveEntry }: DiarioPageProps) {
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newMood, setNewMood] = useState("");
  const moodDays = useMemo(() => buildRecentMoodDays(entries), [entries]);
  const hasMoodData = moodDays.some(Boolean);

  const handleSave = () => {
    if (!newContent.trim()) return;
    onSaveEntry(newContent.trim(), newMood || undefined);
    setNewContent("");
    setNewMood("");
    setShowNewEntry(false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return (
      d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" }) +
      " · " +
      d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    );
  };

  return (
    <DesktopShell>
      <header className="mb-6 flex items-center gap-3">
        <Avatar size={40} />
        <div>
          <h1 className="font-display text-2xl text-[var(--clay-title)]">Meu Diário</h1>
          <p className="text-sm text-[var(--clay-text)]/70">
            Registre e acompanhe sua evolução emocional
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="rounded-2xl bg-white/70 p-5 shadow-sm backdrop-blur-md">
            <div className="mb-3 flex items-center gap-2">
              <Icon name="auto_awesome" filled className="text-sm text-[var(--clay-cta)]" />
              <h2 className="text-sm font-semibold text-[var(--clay-title)]">Resumo</h2>
            </div>
            <p className="text-sm leading-relaxed text-[var(--clay-text)]">
              {entries.length > 0
                ? `Você tem ${entries.length} ${entries.length === 1 ? "registro" : "registros"} no diário. Continue acompanhando o que faz diferença no seu dia.`
                : "Os insights aparecem conforme você registra entradas. Comece com uma nota curta sobre o dia."}
            </p>
          </div>

          <div className="mt-5">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
              Humor recente
            </h3>
            <div className="rounded-xl bg-white/60 p-4 shadow-sm">
              {!hasMoodData ? (
                <p className="py-6 text-center text-sm text-[var(--clay-title)]/50">
                  Ainda sem humor registrado nos últimos 14 dias.
                </p>
              ) : (
                <>
                  <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs font-semibold text-[var(--clay-title)]/60">
                    {DAYS.map((d, i) => (
                      <span key={`${d}-${i}`}>{d}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {moodDays.map((c, i) => (
                      <div
                        key={i}
                        className="flex aspect-square items-center justify-center rounded-full text-sm font-bold"
                        style={{
                          background: c
                            ? `linear-gradient(135deg, ${c}, color-mix(in oklab, ${c} 70%, white))`
                            : "rgba(142,163,193,0.06)",
                          color: c ? "var(--clay-text)" : "var(--clay-title)",
                        }}
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
                Entradas do diário
              </h3>
              <button
                type="button"
                onClick={() => setShowNewEntry(!showNewEntry)}
                className="flex items-center gap-1 rounded-lg bg-white/70 px-3 py-1.5 text-xs font-semibold text-[var(--clay-cta)] shadow-sm hover:bg-white/90"
              >
                <Icon name="add" className="text-sm" />
                {showNewEntry ? "Fechar" : "Nova entrada"}
              </button>
            </div>

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
                      type="button"
                      onClick={() => setNewMood(m.value === newMood ? "" : m.value)}
                      className={`rounded-lg px-3 py-1 text-xs transition-all ${
                        newMood === m.value
                          ? "bg-white/80 font-semibold shadow-sm"
                          : "bg-white/40 text-[var(--clay-text)]/70 hover:bg-white/60"
                      }`}
                    >
                      {m.emoji} {m.label}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
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
                    type="button"
                    onClick={handleSave}
                    disabled={!newContent.trim()}
                    className="rounded-lg bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] px-5 py-1.5 text-sm font-bold text-[oklch(0.25_0.04_254)] shadow-sm disabled:opacity-50"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {entries.length === 0 && !showNewEntry && (
                <p className="py-8 text-center text-sm text-[var(--clay-title)]/50">
                  Nenhuma entrada ainda. Clique em &quot;Nova entrada&quot; para começar.
                </p>
              )}
              {entries.map((entry) => (
                <div key={entry.id} className="rounded-xl bg-white/60 p-4 shadow-sm">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="text-xs text-[var(--clay-title)]/60">
                      {formatDate(entry.created_at)}
                    </span>
                    {entry.mood && (
                      <span className="rounded-full bg-white/50 px-2 py-0.5 text-xs">
                        {MOOD_OPTIONS.find((m) => m.value === entry.mood)?.emoji ?? entry.mood}
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed text-[var(--clay-text)]">{entry.content}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="sticky top-24 rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur-md">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
              Resumo rápido
            </h3>
            <p className="text-xs leading-relaxed text-[var(--clay-text)]/70">
              {entries.length > 0
                ? `Você tem ${entries.length} ${entries.length === 1 ? "entrada" : "entradas"} no diário.`
                : "Comece a escrever para acompanhar sua evolução."}
            </p>
          </div>
        </section>
      </div>
    </DesktopShell>
  );
}
