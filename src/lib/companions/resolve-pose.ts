import type { CompanionMessageKind, CompanionPose, CompanionChatPoseInput } from "./types";

const HEAVY_MOODS = new Set([
  "sobrecarregado",
  "ansioso",
  "preocupado",
  "irritado",
  "triste",
  "inseguro",
  "cansado",
]);

export function isHeavyMood(mood?: string): boolean {
  if (!mood) return false;
  return HEAVY_MOODS.has(mood.toLowerCase());
}

export function inferMessageKind(input: {
  suggestion?: string | null;
  text?: string;
  mood?: string;
}): CompanionMessageKind {
  const suggestion = input.suggestion?.toLowerCase() ?? null;
  const text = (input.text ?? "").toLowerCase();

  if (suggestion === "respirar" || suggestion === "pausa") return "breathe";
  if (suggestion === "movimento" || suggestion === "agua") return "support";
  if (suggestion === "checkin" || suggestion === "humor" || suggestion === "sono") {
    return "support";
  }
  if (suggestion === "plano") return "celebrate";

  if (text.includes("parab") || text.includes("conseguiu") || text.includes("mandou bem")) {
    return "celebrate";
  }
  if (text.includes("respir") || text.includes("pausa")) return "breathe";
  if (isHeavyMood(input.mood) || text.includes("sobrecarreg") || text.includes("ansios")) {
    return "concern";
  }
  if (
    text.includes("bom dia") ||
    text.includes("boa tarde") ||
    text.includes("boa noite") ||
    text.includes("olá") ||
    text.includes("ola")
  ) {
    return "greeting";
  }

  return "neutral";
}

export function messageKindToPose(kind: CompanionMessageKind): CompanionPose {
  switch (kind) {
    case "greeting":
      return "wave";
    case "breathe":
      return "breathe";
    case "celebrate":
      return "cheer";
    case "concern":
      return "concern";
    case "support":
      return "encourage";
    case "neutral":
    default:
      return "idle-calm";
  }
}

export function resolveCompanionChatPose(input: CompanionChatPoseInput): CompanionPose {
  if (input.isAiThinking) return "think";
  if (input.draft.trim().length > 0) return "listen";

  if (!input.initialized) return "idle-calm";

  if (input.messagesLength === 0) {
    return isHeavyMood(input.mood) ? "concern" : "wave";
  }

  if (input.lastMessageKind) {
    return messageKindToPose(input.lastMessageKind);
  }

  if (input.aiSuggestion === "respirar" || input.aiSuggestion === "pausa") {
    return "breathe";
  }

  return "idle-calm";
}
