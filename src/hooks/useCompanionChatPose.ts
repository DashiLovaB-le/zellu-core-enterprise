import { useMemo } from "react";
import {
  resolveCompanionChatPose,
  type CompanionChatPoseInput,
  type CompanionId,
  type CompanionPose,
} from "@/lib/companions";

export function useCompanionChatPose(
  companionId: CompanionId | string | null | undefined,
  input: CompanionChatPoseInput,
): CompanionPose {
  return useMemo(
    () => resolveCompanionChatPose(input),
    [
      companionId,
      input.draft,
      input.isAiThinking,
      input.messagesLength,
      input.initialized,
      input.mood,
      input.aiSuggestion,
      input.lastMessageKind,
    ],
  );
}
