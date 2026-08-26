import { useRef, useEffect, useState } from "react";
import { DesktopShell } from "@/components/DesktopShell";
import { PreventiveAlertBanner } from "@/components/PreventiveAlertBanner";
import { ChatMarkdown } from "@/components/ChatMarkdown";
import { ChatCompanionHeader, ChatCompanionThinking } from "@/components/chat/ChatCompanionHeader";
import { CompanionMascot } from "@/components/CompanionMascot";
import type { Msg } from "@/data";
import type { PreventiveAlert } from "@/lib/services/preventiva-service";
import { MAIN_MOODS, EXTRA_MOODS } from "@/data/moods";
import type { CompanionId, CompanionMessageKind } from "@/lib/companions";
import { useCompanionChatPose } from "@/hooks/useCompanionChatPose";

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

export function DesktopChatPage({
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

  const sidebarPose = useCompanionChatPose(companionId, {
    draft,
    isAiThinking,
    messagesLength: messages.length,
    initialized,
    mood,
    aiSuggestion,
    lastMessageKind,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiThinking]);

  const visibleMoods = showAllMoods ? [...MAIN_MOODS, ...EXTRA_MOODS] : MAIN_MOODS;

  return (
    <DesktopShell>
      <div className="flex gap-6">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 space-y-4">
            <div className="flex flex-col items-center rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur-md">
              <CompanionMascot companionId={companionId} pose={sidebarPose} size="md" />
              <p className="mt-2 font-display text-sm text-[var(--clay-title)]">{companionName}</p>
              <p className="mt-1 text-center text-xs text-[var(--clay-text)]/70">{companionTagline}</p>
            </div>

            <div className="rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur-md">
              {messages.length === 0 && (
                <>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
                    Como você se sente?
                  </h3>
                  <div className="grid grid-cols-3 gap-1.5">
                    {visibleMoods.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => onQuickReply(m.label)}
                        disabled={isAiThinking}
                        className="flex flex-col items-center gap-0.5 rounded-xl bg-white/50 p-2 text-center shadow-sm transition-all active:translate-y-px hover:bg-white/70 disabled:opacity-50"
                      >
                        <span className="text-xl">{m.emoji}</span>
                        <span className="text-[9px] font-semibold text-[var(--clay-text)]">{m.label}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowAllMoods(!showAllMoods)}
                    className="mt-2 w-full rounded-lg bg-white/30 px-3 py-1.5 text-[10px] font-semibold text-[var(--clay-title)]/60 transition-all hover:bg-white/50"
                  >
                    {showAllMoods ? "▲ Mostrar menos" : `▼ Ver +${EXTRA_MOODS.length} humores`}
                  </button>
                </>
              )}
              {aiSuggestion && (
                <>
                  <h3 className="mb-3 mt-4 text-xs font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
                    Sugestão
                  </h3>
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
                              : "Fazer um alongamento",
                      );
                    }}
                    disabled={isAiThinking}
                    className="w-full rounded-xl bg-gradient-to-br from-[#99BEE5]/30 to-[#C5D9F1]/30 p-3 text-center text-sm font-semibold text-[var(--clay-title)] shadow-sm active:translate-y-px disabled:opacity-50"
                  >
                    {aiSuggestion === "respirar"
                      ? "Respirar"
                      : aiSuggestion === "agua"
                        ? "Beber água"
                        : aiSuggestion === "pausa"
                          ? "Fazer pausa"
                          : aiSuggestion === "checkin"
                            ? "Fazer check-in"
                            : aiSuggestion === "plano"
                              ? "Abrir plano"
                              : "Alongar"}
                  </button>
                </>
              )}
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
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
            size="md"
          />

          {preventiveAlert && (
            <div className="mb-4">
              <PreventiveAlertBanner alert={preventiveAlert} onSuggestionClick={onSuggestionClick} />
            </div>
          )}

          <div className="flex-1 space-y-4 overflow-y-auto pb-4">
            {messages.map((m, i) => (
              <Bubble key={i} msg={m} companionName={companionName} />
            ))}

            {isAiThinking && (
              <div className="flex justify-start">
                <ChatCompanionThinking companionId={companionId} />
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!isAiThinking) onSend(draft);
            }}
            className="mt-4 flex items-center gap-3 rounded-2xl bg-white/80 p-2 shadow-sm backdrop-blur-md"
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
              className="h-10 flex-1 bg-transparent px-3 text-sm text-[var(--clay-text)] outline-none placeholder:text-[var(--clay-title)]/60 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isAiThinking || !draft.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] text-white shadow-sm disabled:opacity-40"
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
      </div>
    </DesktopShell>
  );
}

function Bubble({ msg, companionName }: { msg: Msg; companionName: string }) {
  const isAi = msg.from === "ai";
  return (
    <div className={`flex ${isAi ? "justify-start" : "justify-end"}`}>
      <div className={`max-w-[65%] ${isAi ? "" : ""}`}>
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
    </div>
  );
}
