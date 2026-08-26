import type { CompanionId } from "@/lib/companions";
import {
  resolveCompanionQuickReply,
  type QuickReplyAction,
} from "@/lib/companions/quick-replies";

type ChatAiSuggestionButtonProps = {
  companionId: CompanionId;
  aiSuggestion: string;
  isAiThinking?: boolean;
  onQuickReply: (text: string) => void;
  onSuggestionClick?: (suggestion: string) => void;
  className?: string;
};

export function ChatAiSuggestionButton({
  companionId,
  aiSuggestion,
  isAiThinking = false,
  onQuickReply,
  onSuggestionClick,
  className = "w-full rounded-lg bg-gradient-to-br from-[#99BEE5]/30 to-[#C5D9F1]/30 px-4 py-2 text-xs font-semibold text-[var(--clay-title)] shadow-sm active:translate-y-px disabled:opacity-50",
}: ChatAiSuggestionButtonProps) {
  const resolved = resolveCompanionQuickReply(companionId, aiSuggestion as QuickReplyAction);
  if (!resolved) return null;

  return (
    <button
      type="button"
      disabled={isAiThinking}
      onClick={() => {
        if (resolved.navigates) {
          onSuggestionClick?.(resolved.messageText);
          return;
        }
        onQuickReply(resolved.messageText);
      }}
      className={className}
    >
      {resolved.buttonLabel}
    </button>
  );
}
