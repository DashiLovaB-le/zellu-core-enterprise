import { detectCrisisLanguage } from "@/lib/crisis";
import { sanitizeLogMessage } from "@/lib/lgpd";
import { formatPortraitContextBlock } from "@/lib/companion-portrait";

export const COMPANION_MEMORY_LIMIT = 20;
export const COMPANION_MEMORY_MAX_CHARS = 180;

export const COMPANION_SUGGESTIONS = [
  "respirar",
  "agua",
  "pausa",
  "movimento",
  "checkin",
  "plano",
  "humor",
  "sono",
] as const;

export type CompanionSuggestion = (typeof COMPANION_SUGGESTIONS)[number];

export type CompanionAiPayload = {
  message: string;
  memory: string | null;
  memoryImportance: number;
  suggestion: CompanionSuggestion | null;
};

export type CompanionAiParseResult = CompanionAiPayload & {
  /** true quando a LLM não devolveu JSON válido com campo message. */
  parseFailed: boolean;
};

const PARSE_FAILURE_MESSAGE = "Desculpe, não consegui processar agora. Pode tentar de novo?";

export type CompanionSnapshot = {
  checkins: Array<{
    day: string;
    mood: string;
    sleepHours: number | null;
    sleepLabel: string;
    waterMl: number | null;
  }>;
  habitsToday: {
    waterMl: number | null;
    sleepQuality: number | null;
    mood: string | null;
    movementMinutes: number | null;
    energyLevel: number | null;
  } | null;
  plan: {
    goal: string;
    customGoal?: string | null;
    today: {
      water: boolean;
      walk: boolean;
      breathe: boolean;
      talk: boolean;
    } | null;
  } | null;
  preventiveLine: string;
  memories: Array<{ importance: number; content: string }>;
};

export const COMPANION_JSON_PROTOCOL = `Formato de resposta (obrigatório):
Responda APENAS com um JSON válido, sem markdown fora da string message, com as chaves:
{
  "message": "texto para a pessoa ler",
  "memory": null,
  "memory_importance": 3,
  "suggestion": null
}
Regras:
- Mantenha o tom já definido acima. Não mude de personagem.
- message: 2 a 5 frases, markdown leve permitido só dentro dessa string.
- memory: só grave um fato estável e útil para conversas futuras (o que ajuda, preferência, gatilho recorrente). Máximo 180 caracteres. Senão, null.
- Nunca grave em memory: crise, ideação, nome, e-mail, empresa, texto de diário ou dado de identificação.
- memory_importance: inteiro 1 a 5 (5 = essencial).
- suggestion: null ou exatamente um de: respirar, agua, pausa, movimento, checkin, plano, humor, sono.
- Não invente check-ins, hábitos ou memórias que não estejam no contexto.`;

export function isCompanionSuggestion(value: string | null | undefined): value is CompanionSuggestion {
  return !!value && (COMPANION_SUGGESTIONS as readonly string[]).includes(value);
}

function stripJsonFence(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return (fenced?.[1] ?? trimmed).trim();
}

function extractJsonObject(raw: string): unknown {
  const text = stripJsonFence(raw);
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw new Error("not json");
  }
}

export function sanitizeCompanionMemory(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (raw.includes("@") || /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(raw)) return null;
  const cleaned = sanitizeLogMessage(raw).replace(/\s+/g, " ").trim();
  if (cleaned.length < 8 || cleaned.length > COMPANION_MEMORY_MAX_CHARS) return null;
  if (detectCrisisLanguage(cleaned)) return null;
  if (cleaned.includes("[email]")) return null;
  return cleaned;
}

export function isCompanionParseFailureMessage(message: string): boolean {
  return message === PARSE_FAILURE_MESSAGE;
}

export function parseCompanionAiPayload(raw: string): CompanionAiParseResult {
  try {
    const parsed = extractJsonObject(raw) as Record<string, unknown>;
    const message =
      typeof parsed.message === "string" ? parsed.message.trim() : "";
    if (!message) throw new Error("empty message");
    const suggestionRaw =
      typeof parsed.suggestion === "string" ? parsed.suggestion.trim().toLowerCase() : null;
    const importanceRaw = parsed.memory_importance ?? parsed.memoryImportance;
    const importance =
      typeof importanceRaw === "number" && Number.isFinite(importanceRaw)
        ? Math.min(5, Math.max(1, Math.round(importanceRaw)))
        : 3;
    return {
      message,
      memory: sanitizeCompanionMemory(typeof parsed.memory === "string" ? parsed.memory : null),
      memoryImportance: importance,
      suggestion: isCompanionSuggestion(suggestionRaw) ? suggestionRaw : null,
      parseFailed: false,
    };
  } catch {
    const stripped = stripJsonFence(raw).trim();
    const looksJson = stripped.startsWith("{");
    return {
      message: looksJson || !stripped ? PARSE_FAILURE_MESSAGE : stripped,
      memory: null,
      memoryImportance: 1,
      suggestion: null,
      parseFailed: true,
    };
  }
}

export function pickMemoryIdsToPrune(
  rows: Array<{ id: string; importance: number; created_at: string }>,
  keep = COMPANION_MEMORY_LIMIT,
): string[] {
  if (rows.length <= keep) return [];
  const ranked = [...rows].sort((a, b) => {
    if (b.importance !== a.importance) return b.importance - a.importance;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  return ranked.slice(keep).map((row) => row.id);
}

export function formatCompanionContextBlock(
  snapshot: CompanionSnapshot,
  opts?: { preferredName?: string; streakDays?: number },
): string {
  return formatPortraitContextBlock(snapshot, {
    preferredName: opts?.preferredName?.trim() || "você",
    streakDays: opts?.streakDays,
  });
}
