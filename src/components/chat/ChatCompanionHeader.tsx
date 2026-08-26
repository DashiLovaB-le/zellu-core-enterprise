import { CompanionMascot } from "@/components/CompanionMascot";
import { useCompanionChatPose } from "@/hooks/useCompanionChatPose";
import type { CompanionId, CompanionMessageKind } from "@/lib/companions";

interface ChatCompanionHeaderProps {
  companionId: CompanionId;
  companionName: string;
  companionTagline: string;
  greeting: string;
  draft: string;
  isAiThinking: boolean;
  messagesLength: number;
  initialized: boolean;
  mood?: string;
  aiSuggestion?: string | null;
  lastMessageKind?: CompanionMessageKind;
  size?: "sm" | "md";
}

export function ChatCompanionHeader({
  companionId,
  companionName,
  companionTagline,
  greeting,
  draft,
  isAiThinking,
  messagesLength,
  initialized,
  mood,
  aiSuggestion,
  lastMessageKind,
  size = "sm",
}: ChatCompanionHeaderProps) {
  const pose = useCompanionChatPose(companionId, {
    draft,
    isAiThinking,
    messagesLength,
    initialized,
    mood,
    aiSuggestion,
    lastMessageKind,
  });

  return (
    <header className="mb-4 flex items-center gap-3 rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur-md lg:mb-5 lg:gap-4">
      <CompanionMascot companionId={companionId} pose={pose} size={size} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-base leading-tight text-[var(--clay-title)] lg:text-lg">
          {companionName}
        </p>
        <p className="mt-0.5 truncate text-xs text-[var(--clay-text)]/70">
          {greeting || companionTagline}
        </p>
      </div>
    </header>
  );
}

export function ChatCompanionThinking({
  companionId,
}: {
  companionId: CompanionId;
}) {
  return (
    <div className="flex max-w-[82%] items-end gap-2 self-start lg:max-w-[65%]">
      <CompanionMascot companionId={companionId} pose="think" size="xs" className="opacity-90" />
      <div className="rounded-2xl rounded-bl-md bg-white/70 p-4 shadow-sm">
        <div className="flex gap-1.5">
          <span className="bounce-d1 block h-2 w-2 rounded-full bg-[var(--clay-title)]/40" />
          <span className="bounce-d2 block h-2 w-2 rounded-full bg-[var(--clay-title)]/40" />
          <span className="bounce-d3 block h-2 w-2 rounded-full bg-[var(--clay-title)]/40" />
        </div>
      </div>
    </div>
  );
}
