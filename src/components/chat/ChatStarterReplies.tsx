import type { CompanionId } from "@/lib/companions";
import { getCompanionStarterReplies } from "@/lib/companions/quick-replies";

type ChatStarterRepliesProps = {
  companionId: CompanionId;
  isAiThinking?: boolean;
  onQuickReply: (text: string) => void;
  className?: string;
};

export function ChatStarterReplies({
  companionId,
  isAiThinking = false,
  onQuickReply,
  className = "",
}: ChatStarterRepliesProps) {
  const starters = getCompanionStarterReplies(companionId);
  if (starters.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {starters.map((item) => (
        <button
          key={item.label}
          type="button"
          disabled={isAiThinking}
          onClick={() => onQuickReply(item.text)}
          className="rounded-full bg-white/60 px-3 py-1.5 text-[10px] font-semibold text-[var(--clay-title)] shadow-sm active:translate-y-px disabled:opacity-50 lg:text-xs"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
