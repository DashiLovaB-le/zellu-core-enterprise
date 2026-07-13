import { useState } from "react";
import { DesktopShell } from "@/components/DesktopShell";
import { Icon } from "@/components/Icon";
import type { Msg } from "@/data";

interface ChatPageProps {
  messages: Msg[];
  draft: string;
  onDraftChange: (val: string) => void;
  onSend: (text: string) => void;
}

const QUICK_REPLIES = ["Suave", "Médio", "Forte"];

export function DesktopChatPage({ messages, draft, onDraftChange, onSend }: ChatPageProps) {
  const [showPanel, setShowPanel] = useState(true);

  return (
    <DesktopShell>
      <div className="flex gap-6">
        {showPanel && (
          <aside className="hidden w-72 shrink-0 lg:block">
            <div className="sticky top-24 p-5 clay-card">
              <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-[var(--clay-title)]">
                Sugestões
              </h3>
              <div className="flex flex-col gap-2">
                {[
                  "Como foi seu dia?",
                  "O que te deixou grata hoje?",
                  "Vamos fazer um exercício de respiração?",
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => onSend(s)}
                    className="rounded-xl p-3 text-left text-sm text-[var(--clay-text)] clay-soft hover:bg-white/60 active:translate-y-px"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <h3 className="mb-3 mt-6 font-display text-sm font-bold uppercase tracking-wider text-[var(--clay-title)]">
                Escala de Intensidade
              </h3>
              <div className="flex flex-col gap-2">
                {QUICK_REPLIES.map((label) => (
                  <button
                    key={label}
                    onClick={() => onSend(label)}
                    className="rounded-xl p-3 text-center text-sm font-semibold text-[var(--clay-text)] clay-soft hover:bg-white/60 active:translate-y-px"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="mb-6 flex items-center gap-4 rounded-2xl p-5 clay-card">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full clay-cta">
              <Icon name="cloud" filled className="text-[28px]" />
            </div>
            <div className="flex-1">
              <h1 className="font-display text-xl text-[var(--clay-title)]">Bom dia, Ana</h1>
              <p className="text-sm text-[var(--clay-text)]/70">Que bom ter você aqui hoje</p>
            </div>
            <button
              onClick={() => setShowPanel(!showPanel)}
              className="hidden h-9 w-9 items-center justify-center rounded-full clay-soft lg:flex"
            >
              <Icon name={showPanel ? "close" : "menu"} />
            </button>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto pb-4">
            {messages.map((m, i) => (
              <Bubble key={i} msg={m} />
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSend(draft);
            }}
            className="mt-4 flex items-center gap-3 rounded-2xl p-2 clay-card"
          >
            <button
              type="button"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--clay-title)]"
            >
              <Icon name="add" />
            </button>
            <input
              value={draft}
              onChange={(e) => onDraftChange(e.target.value)}
              placeholder="Como você está se sentindo agora?"
              className="h-11 flex-1 bg-transparent text-sm text-[var(--clay-text)] outline-none placeholder:text-[var(--clay-title)]/70"
            />
            <button
              type="submit"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white"
              style={{
                background: "linear-gradient(135deg, #D7CBE8, #A9C7E9)",
                boxShadow:
                  "inset 2px 2px 4px rgba(255,255,255,0.5), inset -2px -2px 4px rgba(142,163,193,0.2), 0 6px 14px rgba(142,163,193,0.25)",
              }}
            >
              <Icon name="mic" filled />
            </button>
          </form>
        </div>
      </div>
    </DesktopShell>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  const isAi = msg.from === "ai";
  return (
    <div className={`flex ${isAi ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[70%] p-4 text-[15px] leading-relaxed clay-soft ${
          isAi
            ? "rounded-t-3xl rounded-br-3xl rounded-bl-md"
            : "rounded-t-3xl rounded-bl-3xl rounded-br-md"
        }`}
        style={
          isAi
            ? {
                background:
                  "linear-gradient(135deg, rgba(169,199,233,0.55), rgba(197,217,241,0.55))",
              }
            : {
                background:
                  "linear-gradient(135deg, rgba(200,230,201,0.6), rgba(215,203,232,0.55))",
              }
        }
      >
        <p className="text-[var(--clay-text)]">{msg.text}</p>
      </div>
    </div>
  );
}
