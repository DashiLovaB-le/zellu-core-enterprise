import { ALL_MOODS } from "@/data/moods";
import {
  companionFallbackPhrase,
  type FallbackVoiceKey,
} from "@/lib/companions/fallback-voice";
import { resolveCompanionId } from "@/lib/companions/registry";
import type { CompanionId } from "@/lib/companions/types";

export type LocalFallbackContext = {
  sleepHours?: number;
  sleepLabel?: string;
  waterMl?: number;
  mood?: string;
  greeting?: string;
  preferredName?: string;
  planGoal?: string;
  companionId?: CompanionId;
};

export type LocalFallbackTurn = { role: "user" | "assistant"; content: string };

const POSITIVE_MOOD = /\b(grat\w*|feliz|animad\w*|bem|ótimo|otimo|leve|tranquil\w*|calm\w*|contente|motivad\w*)\b/i;
const GREETING = /\b(ol[aá]|oi|bom dia|boa tarde|boa noite|e a[ií]|hey|hello)\b/i;
const MOVEMENT = /\b(along\w*|moviment\w*|camih\w*|exerc[ií]c\w*|stretch|corrid\w*|academia)\b/i;
const WORK_STRESS = /\b(trabalh\w*|reuni[aã]o|prazo|chefe|equipe|sobrecar\w*|deadline|tarefa\w*)\b/i;
const GRATITUDE = /\b(grat\w*|agradec\w*|obrigad\w*)\b/i;
const PAUSE = /\b(pausa|descans\w*|parar\s+um\s+pouco)\b/i;
const BREATHE = /\b(respir\w*|respiração)\b/i;
const HYDRATION = /\b(água|agua|beber|hidrat\w*)\b/i;
const REPEAT_FRUSTRATION =
  /\b(j[aá]\s+respondi|respondi\s+isso|de\s+novo|repet\w*|u[eé]|ser[ií]o|outra\s+vez)\b/i;
const MOOD_STILL = /\b(ainda|continuo|continua|mesmo|mesma)\b/i;

const MOOD_LABELS = new Set(ALL_MOODS.map((m) => m.label.toLowerCase()));
const MOOD_VALUES = new Set(ALL_MOODS.map((m) => m.value.toLowerCase()));

function resolveCompanion(context: LocalFallbackContext): CompanionId {
  return context.companionId ?? "Chico";
}

function say(
  context: LocalFallbackContext,
  key: FallbackVoiceKey,
  params: Parameters<typeof companionFallbackPhrase>[2],
): string {
  return companionFallbackPhrase(resolveCompanion(context), key, params);
}

function address(name: string, context: LocalFallbackContext): string {
  const who = context.preferredName?.trim() || name;
  return who.trim().toLowerCase() === "você" ? "" : `${who.split(/\s+/)[0]}, `;
}

function normalizeMoodLabel(text: string): string | null {
  const key = text.trim().toLowerCase();
  if (MOOD_LABELS.has(key)) {
    const found = ALL_MOODS.find((m) => m.label.toLowerCase() === key);
    return found?.label ?? key;
  }
  if (MOOD_VALUES.has(key)) {
    const found = ALL_MOODS.find((m) => m.value.toLowerCase() === key);
    return found?.label ?? key;
  }
  return null;
}

function assistantAlreadyAskedMoodCheck(history: LocalFallbackTurn[]): boolean {
  return history.some(
    (turn) =>
      turn.role === "assistant" &&
      /como você se sente\s+\*?agora|humor estava|check-in recente/i.test(turn.content),
  );
}

function userAlreadySharedCurrentMood(history: LocalFallbackTurn[]): boolean {
  return history.some(
    (turn) =>
      turn.role === "user" &&
      (POSITIVE_MOOD.test(turn.content) ||
        GRATITUDE.test(turn.content) ||
        normalizeMoodLabel(turn.content) !== null ||
        /\b(me\s+sinto|estou\s+me\s+sentindo|sinto-me)\b/i.test(turn.content)),
  );
}

function lastAssistantReply(history: LocalFallbackTurn[]): string | null {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i]?.role === "assistant") return history[i].content;
  }
  return null;
}

export function buildLocalFallbackReply(
  text: string,
  name: string,
  context: LocalFallbackContext,
  history: LocalFallbackTurn[] = [],
): string {
  const lower = text.toLowerCase().trim();
  const who = address(name, context);
  const moodLabel = normalizeMoodLabel(text);
  const askedMoodBefore = assistantAlreadyAskedMoodCheck(history);
  const sharedMoodBefore = userAlreadySharedCurrentMood(history);
  const voiceParams = { who, salutation: context.greeting };

  if (REPEAT_FRUSTRATION.test(lower)) {
    const lastReply = lastAssistantReply(history);
    if (lastReply && /pausa|alongamento|grato|gratidão/i.test(lastReply)) {
      return say(context, "repeatWithLast", voiceParams);
    }
    return say(context, "repeatGeneric", voiceParams);
  }

  if (GREETING.test(lower) && lower.length < 40) {
    return say(context, "greeting", voiceParams);
  }

  if (moodLabel) {
    const planHint = context.planGoal ? ` Seu plano agora é ${context.planGoal.toLowerCase()}.` : "";
    return say(context, "moodLabel", { ...voiceParams, moodLabel: moodLabel.toLowerCase(), planHint });
  }

  if (BREATHE.test(lower)) {
    return say(context, "breathe", voiceParams);
  }

  if (PAUSE.test(lower)) {
    return say(context, "pause", voiceParams);
  }

  if (HYDRATION.test(lower)) {
    return say(context, "hydration", voiceParams);
  }

  if (lower.includes("ansios") || lower.includes("preocup") || lower.includes("nervos")) {
    return say(context, "anxiety", voiceParams);
  }

  if (lower.includes("triste") || lower.includes("mal") || lower.includes("desanim") || lower.includes("baixo")) {
    return say(context, "sad", voiceParams);
  }

  if (GRATITUDE.test(lower) || POSITIVE_MOOD.test(lower)) {
    if (MOOD_STILL.test(lower) && (context.mood || sharedMoodBefore)) {
      const moodWord = context.mood ?? "bem";
      return say(context, "positiveStill", { ...voiceParams, moodWord });
    }
    if (context.mood && POSITIVE_MOOD.test(context.mood)) {
      return say(context, "positiveContextMood", { ...voiceParams, moodWord: context.mood });
    }
    return say(context, "positiveGeneric", voiceParams);
  }

  if (MOVEMENT.test(lower)) {
    return say(context, "movement", voiceParams);
  }

  if (lower.includes("sono") || lower.includes("dorm") || lower.includes("cansad")) {
    if (context.sleepLabel) {
      return say(context, "sleepWithLabel", { ...voiceParams, sleepLabel: context.sleepLabel.toLowerCase() });
    }
    return say(context, "sleepTired", voiceParams);
  }

  if (WORK_STRESS.test(lower)) {
    return say(context, "workStress", voiceParams);
  }

  if (context.mood && lower.length < 24 && !askedMoodBefore && !sharedMoodBefore) {
    return say(context, "moodCheckShort", { ...voiceParams, moodWord: context.mood });
  }

  if (context.mood) {
    const snippet = text.length > 80 ? `${text.slice(0, 77)}…` : text;
    return say(context, "moodGenericSnippet", { ...voiceParams, snippet });
  }

  return say(context, "default", voiceParams);
}

/** Resolve companion a partir do avatar_url do perfil */
export function buildLocalFallbackReplyForAvatar(
  text: string,
  name: string,
  avatarUrl: string | null | undefined,
  context: Omit<LocalFallbackContext, "companionId">,
  history: LocalFallbackTurn[] = [],
): string {
  return buildLocalFallbackReply(text, name, {
    ...context,
    companionId: resolveCompanionId(avatarUrl),
  }, history);
}
