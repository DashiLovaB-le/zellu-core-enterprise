import { useRef, useEffect, useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { Avatar } from "@/components/Avatar";
import type { Msg } from "@/data";

interface ChatPageProps {
  messages: Msg[];
  draft: string;
  onDraftChange: (val: string) => void;
  onSend: (text: string) => void;
  greeting: string;
  isAiThinking: boolean;
  aiSuggestion: string | null;
  onQuickReply: (label: string) => void;
}

const MAIN_MOODS = [
  { emoji: "😊", label: "Feliz", value: "feliz" },
  { emoji: "😌", label: "Calmo", value: "calmo" },
  { emoji: "😐", label: "Neutro", value: "neutro" },
  { emoji: "😟", label: "Ansioso", value: "ansioso" },
  { emoji: "😢", label: "Triste", value: "triste" },
  { emoji: "😤", label: "Irritado", value: "irritado" },
];

const EXTRA_MOODS = [
  { emoji: "🥳", label: "Animado", value: "animado" },
  { emoji: "😃", label: "Contente", value: "contente" },
  { emoji: "🤗", label: "Grato", value: "grato" },
  { emoji: "🧘", label: "Sereno", value: "sereno" },
  { emoji: "💪", label: "Motivado", value: "motivado" },
  { emoji: "🎯", label: "Focado", value: "focado" },
  { emoji: "🙏", label: "Esperançoso", value: "esperancoso" },
  { emoji: "🤩", label: "Entusiasmado", value: "entusiasmado" },
  { emoji: "☺️", label: "Orgulhoso", value: "orgulhoso" },
  { emoji: "🤔", label: "Pensativo", value: "pensativo" },
  { emoji: "🫤", label: "Confuso", value: "confuso" },
  { emoji: "😴", label: "Cansado", value: "cansado" },
  { emoji: "🫂", label: "Acolhido", value: "acolhido" },
  { emoji: "😰", label: "Preocupado", value: "preocupado" },
  { emoji: "😥", label: "Inseguro", value: "inseguro" },
  { emoji: "😞", label: "Desanimado", value: "desanimado" },
  { emoji: "😡", label: "Bravo", value: "bravo" },
  { emoji: "🤯", label: "Sobrecarregado", value: "sobrecarregado" },
  { emoji: "🥺", label: "Carente", value: "carente" },
];

export function MobileChatPage({
  messages,
  draft,
  onDraftChange,
  onSend,
  greeting,
  isAiThinking,
  aiSuggestion,
  onQuickReply,
}: ChatPageProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showAllMoods, setShowAllMoods] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiThinking]);

  const visibleMoods = showAllMoods ? [...MAIN_MOODS, ...EXTRA_MOODS] : MAIN_MOODS;

  return (
    <MobileShell>
      <header className="mb-4 flex items-center gap-3 rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur-md">
        <Avatar size={44} />
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-base leading-tight text-[var(--clay-title)] truncate">
            {greeting || "Bom dia!"}
          </h1>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-3 overflow-y-auto">
        {messages.map((m, i) => (
          <Bubble key={i} msg={m} />
        ))}

        {isAiThinking && (
          <div className="self-start max-w-[82%]">
            <div className="rounded-2xl rounded-bl-md bg-white/70 p-4 shadow-sm">
              <div className="flex gap-1.5">
                <span className="bounce-d1 block h-2 w-2 rounded-full bg-[var(--clay-title)]/40" />
                <span className="bounce-d2 block h-2 w-2 rounded-full bg-[var(--clay-title)]/40" />
                <span className="bounce-d3 block h-2 w-2 rounded-full bg-[var(--clay-title)]/40" />
              </div>
            </div>
          </div>
        )}

        {messages.length === 0 && !isAiThinking && (
          <div className="space-y-1.5">
            <div className="grid grid-cols-3 gap-1.5">
              {visibleMoods.map((m) => (
                <button
                  key={m.value}
                  onClick={() => onQuickReply(m.label)}
                  className="flex flex-col items-center gap-0.5 rounded-xl bg-white/70 p-2 text-center shadow-sm active:translate-y-px"
                >
                  <span className="text-lg">{m.emoji}</span>
                  <span className="text-[8px] font-semibold text-[var(--clay-text)]">{m.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAllMoods(!showAllMoods)}
              className="w-full rounded-xl bg-white/60 px-3 py-2 text-[11px] font-bold text-[var(--clay-title)]/70 shadow-sm active:translate-y-px"
            >
              {showAllMoods ? "▲ Mostrar menos" : `▼ Ver +${EXTRA_MOODS.length} humores`}
            </button>
          </div>
        )}

        {!isAiThinking && messages.length > 0 && messages[messages.length - 1]?.from === "ai" && aiSuggestion && (
          <button
            onClick={() =>
              onQuickReply(
                aiSuggestion === "respirar"
                  ? "Vamos respirar"
                  : aiSuggestion === "agua"
                    ? "Beber água"
                    : aiSuggestion === "pausa"
                      ? "Fazer uma pausa"
                      : aiSuggestion === "movimento"
                        ? "Fazer um alongamento"
                        : "Como está meu humor",
              )
            }
            className="w-full rounded-lg bg-gradient-to-br from-[#99BEE5]/30 to-[#C5D9F1]/30 px-4 py-2 text-xs font-semibold text-[var(--clay-title)] shadow-sm active:translate-y-px"
          >
            {aiSuggestion === "respirar"
              ? "🌬️ Respirar"
              : aiSuggestion === "agua"
                ? "💧 Beber água"
                : aiSuggestion === "pausa"
                  ? "☕ Fazer pausa"
                  : aiSuggestion === "movimento"
                    ? "🤸 Alongar"
                    : aiSuggestion === "humor"
                      ? "📊 Ver humor"
                      : aiSuggestion === "sono"
                        ? "🌙 Ver sono"
                        : "Sugestão"}
          </button>
        )}

        <div ref={bottomRef} />
      </main>

      <div className="fixed bottom-[88px] left-1/2 z-40 w-[calc(100%-2.5rem)] max-w-[400px] -translate-x-1/2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!isAiThinking) onSend(draft);
          }}
          className="flex items-center gap-2 rounded-2xl bg-white/80 p-2 shadow-sm backdrop-blur-md"
        >
          <input
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            placeholder={
              isAiThinking ? "Aguardando resposta..." : "Como você está se sentindo agora?"
            }
            disabled={isAiThinking}
            className="h-9 flex-1 bg-transparent px-2 text-sm text-[var(--clay-text)] outline-none placeholder:text-[var(--clay-title)]/60 disabled:opacity-50"
          />
          <button
            type="submit"
            aria-label="Enviar"
            disabled={isAiThinking || !draft.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] text-white shadow-sm disabled:opacity-40"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </button>
        </form>
      </div>
    </MobileShell>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  const isAi = msg.from === "ai";
  return (
    <div className={`max-w-[82%] ${isAi ? "self-start" : "self-end"}`}>
      <div
        className={`p-3 text-sm leading-relaxed ${
          isAi
            ? "rounded-2xl rounded-bl-md bg-white/70 shadow-sm text-[var(--clay-text)]"
            : "rounded-2xl rounded-br-md bg-gradient-to-br from-[#C8E6C9]/60 to-[#D7CBE8]/50 shadow-sm text-[var(--clay-text)]"
        }`}
      >
        {msg.text}
      </div>
    </div>
  );
}
