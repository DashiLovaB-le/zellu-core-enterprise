import { MobileShell } from "@/components/MobileShell";
import { Icon } from "@/components/Icon";
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
      <header className="mb-5 flex items-center gap-3 rounded-3xl p-4 clay-card">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full clay-cta"
          aria-hidden
        >
          <Icon name="cloud" filled className="text-[26px]" />
        </div>
        <h1 className="font-display text-lg leading-tight text-[var(--clay-title)]">
          Bom dia, Ana. Que bom ter você aqui hoje.
        </h1>
      </header>

      <main className="flex flex-1 flex-col gap-3">
        {messages.map((m, i) => (
          <Bubble key={i} msg={m} />
        ))}

        <div className="mt-2 flex flex-wrap justify-center gap-3">
          {QUICK_REPLIES.map((label) => (
            <button
              key={label}
              onClick={() => onSend(label)}
              className="rounded-full bg-white/85 px-6 py-2.5 text-sm font-semibold text-[var(--clay-text)] clay-soft active:translate-y-px"
            >
              {label}
            </button>
          ))}
        </div>
      </main>

      <div className="fixed bottom-[100px] left-1/2 z-40 w-[calc(100%-2.5rem)] max-w-[400px] -translate-x-1/2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSend(draft);
          }}
          className="flex items-center gap-2 rounded-full p-2 clay-card"
        >
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--clay-title)]"
            aria-label="Adicionar"
          >
            <Icon name="add" />
          </button>
          <input
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            placeholder="Como você está se sentindo agora?"
            className="h-10 flex-1 bg-transparent text-sm text-[var(--clay-text)] outline-none placeholder:text-[var(--clay-title)]/70"
          />
          <button
            type="submit"
            aria-label="Enviar"
            className="flex h-11 w-11 items-center justify-center rounded-full text-white"
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
    </MobileShell>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  const isAi = msg.from === "ai";
  return (
    <div className={`max-w-[85%] ${isAi ? "self-start" : "self-end"}`}>
      <div
        className={`p-4 text-[15px] leading-relaxed clay-soft ${
          isAi
            ? "rounded-t-3xl rounded-br-3xl rounded-bl-md text-[var(--clay-text)]"
            : "rounded-t-3xl rounded-bl-3xl rounded-br-md text-[var(--clay-text)]"
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
        {msg.text}
      </div>
    </div>
  );
}
