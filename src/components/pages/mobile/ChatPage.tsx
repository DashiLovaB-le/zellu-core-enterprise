import { MobileShell } from "@/components/MobileShell";
import { Avatar } from "@/components/Avatar";
import type { Msg } from "@/data";

interface ChatPageProps {
  messages: Msg[];
  draft: string;
  onDraftChange: (val: string) => void;
  onSend: (text: string) => void;
}

const QUICK_REPLIES = ["Suave", "Médio", "Forte"];

export function MobileChatPage({ messages, draft, onDraftChange, onSend }: ChatPageProps) {
  return (
    <MobileShell>
      <header className="mb-5 flex items-center gap-3 rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur-md">
        <Avatar size={44} />
        <div>
          <h1 className="font-display text-base leading-tight text-[var(--clay-title)]">
            Bom dia, Ana.
          </h1>
          <p className="text-xs text-[var(--clay-title)]/60">Que bom ter você aqui hoje</p>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-3">
        {messages.map((m, i) => (
          <Bubble key={i} msg={m} />
        ))}

        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {QUICK_REPLIES.map((label) => (
            <button
              key={label}
              onClick={() => onSend(label)}
              className="rounded-lg bg-white/70 px-4 py-2 text-xs font-semibold text-[var(--clay-text)] shadow-sm active:translate-y-px"
            >
              {label}
            </button>
          ))}
        </div>
      </main>

      <div className="fixed bottom-[88px] left-1/2 z-40 w-[calc(100%-2.5rem)] max-w-[400px] -translate-x-1/2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSend(draft);
          }}
          className="flex items-center gap-2 rounded-2xl bg-white/80 p-2 shadow-sm backdrop-blur-md"
        >
          <input
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            placeholder="Como você está se sentindo agora?"
            className="h-9 flex-1 bg-transparent px-2 text-sm text-[var(--clay-text)] outline-none placeholder:text-[var(--clay-title)]/60"
          />
          <button
            type="submit"
            aria-label="Enviar"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#99BEE5] to-[#C5D9F1] text-white shadow-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
