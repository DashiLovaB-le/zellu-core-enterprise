import { useState } from "react";
import { DesktopShell } from "@/components/DesktopShell";
import { Avatar } from "@/components/Avatar";
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
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-24 rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur-md">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
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
                    className="rounded-xl bg-white/50 p-3 text-left text-sm text-[var(--clay-text)] shadow-sm active:translate-y-px"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <h3 className="mb-3 mt-5 text-xs font-bold uppercase tracking-widest text-[var(--clay-title)]/60">
                Intensidade
              </h3>
              <div className="flex flex-col gap-2">
                {QUICK_REPLIES.map((label) => (
                  <button
                    key={label}
                    onClick={() => onSend(label)}
                    className="rounded-xl bg-white/50 p-3 text-center text-sm font-semibold text-[var(--clay-text)] shadow-sm active:translate-y-px"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="mb-5 flex items-center gap-4 rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur-md">
            <Avatar size={48} />
            <div className="flex-1">
              <h1 className="font-display text-lg text-[var(--clay-title)]">Bom dia, Ana</h1>
              <p className="text-sm text-[var(--clay-title)]/60">Que bom ter você aqui hoje</p>
            </div>
            <button
              onClick={() => setShowPanel(!showPanel)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/60 shadow-sm lg:flex"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--clay-title)]">
                {showPanel ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
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
            className="mt-4 flex items-center gap-3 rounded-2xl bg-white/80 p-2 shadow-sm backdrop-blur-md"
          >
            <input
              value={draft}
              onChange={(e) => onDraftChange(e.target.value)}
              placeholder="Como você está se sentindo agora?"
              className="h-10 flex-1 bg-transparent px-3 text-sm text-[var(--clay-text)] outline-none placeholder:text-[var(--clay-title)]/60"
            />
            <button
              type="submit"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] text-white shadow-sm"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

function Bubble({ msg }: { msg: Msg }) {
  const isAi = msg.from === "ai";
  return (
    <div className={`flex ${isAi ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[65%] p-3 text-sm leading-relaxed ${
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
