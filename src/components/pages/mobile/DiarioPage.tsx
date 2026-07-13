import { useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { MOOD_COLORS, DAYS, AI_SUMMARY } from "@/data";
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

export function MobileDiarioPage({ entries, onSaveEntry }: DiarioPageProps) {
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

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return (
      d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" }) +
      " · " +
      d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    );
  };

  return (
    <MobileShell>
      <header className="mb-5 flex items-center gap-3">
        <Avatar size={36} />
        <div>
          <h1 className="font-display text-xl text-[var(--clay-title)]">Meu Diário</h1>
          <p className="text-xs text-[var(--clay-text)]/70">
            Olhando para trás com carinho e autocompreensão
          </p>
        </div>
      </header>

      <section className="mb-5 rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur-md">
        <div className="mb-2 flex items-center gap-2">
          <Icon name="auto_awesome" filled className="text-sm text-[var(--clay-cta)]" />
          <h2 className="text-xs font-semibold text-[var(--clay-title)]">Resumo da IA</h2>
        </div>
        <p className="text-sm leading-relaxed text-[var(--clay-text)]">{AI_SUMMARY}</p>
      </section>

      <section className="mb-5">
        <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
          Humor Recente
        </h3>
        <div className="rounded-xl bg-white/60 p-3 shadow-sm">
          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-[var(--clay-title)]/60">
            {DAYS.map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {MOOD_COLORS.map((c, i) => (
              <div
                key={i}
                className={`flex aspect-square items-center justify-center rounded-full text-[10px] font-bold ${
                  i === 9 ? "ring-2 ring-[var(--clay-cta)] ring-offset-1 ring-offset-white/50" : ""
                }`}
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
        </div>
      </section>

      <section className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
            Entradas do Diário
          </h3>
          <button
            onClick={() => setShowNewEntry(true)}
            className="flex items-center gap-1 rounded-lg bg-white/70 px-3 py-1 text-[10px] font-semibold text-[var(--clay-cta)] shadow-sm"
          >
            <Icon name="add" className="text-xs" />
            Nova
          </button>
        </div>

        {showNewEntry && (
          <div className="mb-3 rounded-xl bg-white/70 p-3 shadow-sm">
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Como você está se sentindo hoje?"
              rows={3}
              className="w-full resize-none bg-transparent text-sm text-[var(--clay-text)] outline-none placeholder:text-[var(--clay-title)]/50"
            />
            <div className="mt-2 flex gap-1">
              {MOOD_OPTIONS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setNewMood(m.value === newMood ? "" : m.value)}
                  className={`rounded-lg px-2 py-1 text-xs transition-all ${
                    newMood === m.value
                      ? "bg-white/80 shadow-sm font-semibold"
                      : "bg-white/40 text-[var(--clay-text)]/70"
                  }`}
                >
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>
            <div className="mt-2 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowNewEntry(false);
                  setNewContent("");
                  setNewMood("");
                }}
                className="rounded-lg px-3 py-1 text-xs text-[var(--clay-title)]/60"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!newContent.trim()}
                className="rounded-lg bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] px-4 py-1 text-xs font-bold text-[oklch(0.25_0.04_254)] shadow-sm disabled:opacity-50"
              >
                Salvar
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {entries.length === 0 && !showNewEntry && (
            <p className="py-6 text-center text-xs text-[var(--clay-title)]/50">
              Nenhuma entrada ainda. Clique em "Nova" para começar.
            </p>
          )}
          {entries.map((entry) => (
            <div key={entry.id} className="rounded-xl bg-white/60 p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] text-[var(--clay-title)]/60">
                  {formatDate(entry.created_at)}
                </span>
                {entry.mood && (
                  <span className="text-[10px] bg-white/50 rounded-full px-2 py-0.5">
                    {MOOD_OPTIONS.find((m) => m.value === entry.mood)?.emoji ?? entry.mood}
                  </span>
                )}
              </div>
              <p className="text-sm leading-snug text-[var(--clay-text)]">{entry.content}</p>
            </div>
          ))}
        </div>
      </section>
    </MobileShell>
  );
}
