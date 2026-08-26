export const COMPANION_IDS = ["Chico", "Amora", "Pipoca", "Zeca"] as const;

export type CompanionId = (typeof COMPANION_IDS)[number];

export type CompanionPose =
  | "wave"
  | "idle-calm"
  | "listen"
  | "think"
  | "encourage"
  | "breathe"
  | "cheer"
  | "empty"
  | "concern";

export type CompanionMessageKind =
  | "greeting"
  | "support"
  | "breathe"
  | "celebrate"
  | "neutral"
  | "concern";

export type CompanionSize = "xs" | "sm" | "md" | "lg";

export interface CompanionDefinition {
  id: CompanionId;
  displayName: string;
  tagline: string;
  /** true quando todas as poses transparentes existem no disco */
  hasPoseAssets: boolean;
  /** fallback visual enquanto poses do personagem não existem */
  visualFallbackId: CompanionId;
  poses: Partial<Record<CompanionPose, string>>;
  cabeca: string;
  promptBlock: string;
}

export interface CompanionChatPoseInput {
  draft: string;
  isAiThinking: boolean;
  messagesLength: number;
  initialized: boolean;
  mood?: string;
  aiSuggestion?: string | null;
  lastMessageKind?: CompanionMessageKind;
}
