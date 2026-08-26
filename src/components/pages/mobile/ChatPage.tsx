import { useRef, useEffect, useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { PreventiveAlertBanner } from "@/components/PreventiveAlertBanner";
import { ChatMarkdown } from "@/components/ChatMarkdown";
import { ChatCompanionHeader, ChatCompanionThinking } from "@/components/chat/ChatCompanionHeader";
import type { Msg } from "@/data";
import type { PreventiveAlert } from "@/lib/services/preventiva-service";
import { MAIN_MOODS, EXTRA_MOODS } from "@/data/moods";
import type { CompanionId, CompanionMessageKind } from "@/lib/companions";

interface ChatPageProps {
  messages: Msg[];
  draft: string;
  onDraftChange: (val: string) => void;
  onSend: (text: string) => void;
  greeting: string;
  isAiThinking: boolean;
  aiSuggestion: string | null;
  onQuickReply: (label: string) => void;
  preventiveAlert?: PreventiveAlert;
  onSuggestionClick?: (suggestion: string) => void;
  companionId: CompanionId;
  companionName: string;
  companionTagline: string;
  mood?: string;
  initialized: boolean;
  lastMessageKind?: CompanionMessageKind;
}

export function MobileChatPage({
  messages,
  draft,
  onDraftChange,
  onSend,
  greeting,
  isAiThinking,
  aiSuggestion,
  onQuickReply,
  preventiveAlert,
  onSuggestionClick,
  companionId,
  companionName,
  companionTagline,
  mood,
  initialized,
  lastMessageKind,
}: ChatPageProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showAllMoods, setShowAllMoods] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isAiThinking, aiSuggestion]);

  const visibleMoods = showAllMoods ? [...MAIN_MOODS, ...EXTRA_MOODS] : MAIN_MOODS;

  return (
    <MobileShell>
      <ChatCompanionHeader
        companionId={companionId}
        companionName={companionName}
        companionTagline={companionTagline}
        greeting={greeting}
        draft={draft}
        isAiThinking={isAiThinking}
        messagesLength={messages.length}
        initialized={initialized}
        mood={mood}
        aiSuggestion={aiSuggestion}
        lastMessageKind={lastMessageKind}
      />

      {preventiveAlert && (
        <div className="mb-4">
          <PreventiveAlertBanner alert={preventiveAlert} onSuggestionClick={onSuggestionClick} />
        </div>
      )}

      <main className="flex flex-col gap-3">
        {messages.map((m, i) => (
          <Bubble key={i} msg={m} companionName={companionName} />
        ))}

        {isAiThinking && <ChatCompanionThinking companionId={companionId} />}

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

        {!isAiThinking &&
          messages.length > 0 &&
          messages[messages.length - 1]?.from === "ai" &&
          aiSuggestion && (
            <button
              onClick={() => {
                if (aiSuggestion === "checkin") {
                  onSuggestionClick?.("fazer check-in");
                  return;
                }
                if (aiSuggestion === "plano") {
                  onSuggestionClick?.("abrir plano de cuidado");
                  return;
                }
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
                );
              }}
              className="w-full rounded-lg bg-gradient-to-br from-[#99BEE5]/30 to-[#C5D9F1]/30 px-4 py-2 text-xs font-semibold text-[var(--clay-title)] shadow-sm active:translate-y-px"
            >
              {aiSuggestion === "respirar"
                ? "Respirar"
                : aiSuggestion === "agua"
                  ? "Beber água"
                  : aiSuggestion === "pausa"
                    ? "Fazer pausa"
                    : aiSuggestion === "movimento"
                      ? "Alongar"
                      : aiSuggestion === "humor"
                        ? "Ver humor"
                        : aiSuggestion === "sono"
                          ? "Ver sono"
                          : aiSuggestion === "checkin"
                            ? "Fazer check-in"
                            : aiSuggestion === "plano"
                              ? "Abrir plano"
                              : "Sugestão"}
            </button>
          )}

        <div ref={bottomRef} className="h-px w-full shrink-0 scroll-mb-28" />
      </main>

      <div className="sticky bottom-[4.75rem] z-30 -mx-5 mt-3 border-t border-border/20 bg-background/95 px-5 py-2.5 backdrop-blur-md">
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
              isAiThinking
                ? `${companionName} está pensando…`
                : `Converse com ${companionName}…`
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

function Bubble({ msg, companionName }: { msg: Msg; companionName: string }) {
  const isAi = msg.from === "ai";
  return (
    <div className={`max-w-[82%] ${isAi ? "self-start" : "self-end"}`}>
      {isAi ? (
        <p className="mb-1 text-[10px] font-semibold text-[var(--clay-title)]/50">{companionName}</p>
      ) : null}
      <div
        className={`p-3 text-sm leading-relaxed ${
          isAi
            ? "rounded-2xl rounded-bl-md bg-white/70 shadow-sm text-[var(--clay-text)]"
            : "rounded-2xl rounded-br-md bg-gradient-to-br from-[#C8E6C9]/60 to-[#D7CBE8]/50 shadow-sm text-[var(--clay-text)]"
        }`}
      >
        {isAi ? <ChatMarkdown content={msg.text} /> : msg.text}
      </div>
    </div>
  );
}
