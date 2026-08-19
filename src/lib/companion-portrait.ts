import type { CompanionSnapshot } from "@/lib/companion-agent";
import { MOOD_MAP } from "@/data/moods";

const GOAL_LABELS: Record<string, string> = {
  "reduzir-ansiedade": "Reduzir ansiedade",
  "melhorar-sono": "Melhorar o sono",
  "aumentar-energia": "Aumentar energia",
  "equilibrio-emocional": "Equilíbrio emocional",
  "autocuidado-rotina": "Autocuidado na rotina",
  custom: "Objetivo próprio",
};

export type PortraitOptions = {
  preferredName: string;
  streakDays?: number;
};

function moodLabel(mood: string): string {
  const key = mood?.toLowerCase();
  return MOOD_MAP[key]?.label ?? mood;
}

function firstName(preferredName: string): string {
  const trimmed = preferredName.trim();
  if (!trimmed || trimmed.toLowerCase() === "você") return "você";
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

export function buildCompanionPortrait(
  snapshot: CompanionSnapshot,
  opts: PortraitOptions,
): string {
  const name = firstName(opts.preferredName);
  const lines: string[] = [];

  lines.push(
    name === "você"
      ? "Pessoa: tratar com proximidade, sem inventar nome."
      : `Pessoa: ${name} — use o primeiro nome de forma natural (no máximo uma vez por resposta).`,
  );

  const latest = snapshot.checkins[0];
  if (latest) {
    const parts = [`humor ${moodLabel(latest.mood).toLowerCase()}`];
    if (latest.sleepHours != null) {
      parts.push(`${latest.sleepHours}h de sono (${latest.sleepLabel || "sem rótulo"})`);
    }
    if (latest.waterMl != null) parts.push(`${latest.waterMl}ml de água`);
    lines.push(`Check-in mais recente (${latest.day}): ${parts.join(", ")}.`);
  } else {
    lines.push("Ainda sem check-in registrado nos últimos dias.");
  }

  if (snapshot.checkins.length >= 2) {
    const recentMoods = snapshot.checkins
      .slice(0, 4)
      .map((c) => moodLabel(c.mood).toLowerCase())
      .join(" → ");
    lines.push(`Humor nos últimos registros: ${recentMoods}.`);
  }

  if (snapshot.habitsToday) {
    const h = snapshot.habitsToday;
    const habitParts: string[] = [];
    if (h.mood) habitParts.push(`humor ${moodLabel(h.mood).toLowerCase()}`);
    if (h.waterMl != null) habitParts.push(`${h.waterMl}ml de água`);
    if (h.movementMinutes != null) habitParts.push(`${h.movementMinutes}min de movimento`);
    if (h.energyLevel != null) habitParts.push(`energia ${h.energyLevel}/100`);
    if (habitParts.length > 0) {
      lines.push(`Bem-estar hoje: ${habitParts.join(", ")}.`);
    }
  }

  if (snapshot.plan) {
    const goalLabel =
      snapshot.plan.goal === "custom"
        ? snapshot.plan.customGoal?.trim() || GOAL_LABELS.custom
        : GOAL_LABELS[snapshot.plan.goal] ?? snapshot.plan.goal;
    lines.push(`Plano de cuidado ativo: ${goalLabel}.`);
    if (snapshot.plan.today) {
      const pending: string[] = [];
      if (!snapshot.plan.today.water) pending.push("água");
      if (!snapshot.plan.today.walk) pending.push("caminhada");
      if (!snapshot.plan.today.breathe) pending.push("respirar");
      if (!snapshot.plan.today.talk) pending.push("conversar no app");
      if (pending.length > 0) {
        lines.push(`Checklist de hoje — pendências: ${pending.join(", ")}.`);
      } else {
        lines.push("Checklist de hoje: itens principais concluídos.");
      }
    }
  }

  if (opts.streakDays && opts.streakDays > 0) {
    lines.push(`Sequência de cuidado: ${opts.streakDays} dia(s) seguidos com registro.`);
  }

  if (snapshot.preventiveLine && !/sem alertas/i.test(snapshot.preventiveLine)) {
    lines.push(snapshot.preventiveLine.replace(/^-\s*/, ""));
  }

  if (snapshot.memories.length > 0) {
    lines.push("Memórias úteis de conversas anteriores:");
    for (const memory of snapshot.memories.slice(0, 6)) {
      lines.push(`- ${memory.content}`);
    }
  }

  return lines.join("\n");
}

export function formatPortraitContextBlock(
  snapshot: CompanionSnapshot,
  opts: PortraitOptions,
): string {
  return `RETRATO DO MOMENTO (dados reais — use com naturalidade; cite no máximo 1 indicador por resposta)
${buildCompanionPortrait(snapshot, opts)}

Regras de uso:
- Conecte o que a pessoa escreveu ao retrato quando fizer sentido.
- Não repita na mesma sessão perguntas sobre humor/check-in já respondidas.
- Não invente dados que não estejam acima ou no histórico da conversa.`;
}

export function planGoalLabel(snapshot: CompanionSnapshot): string | undefined {
  if (!snapshot.plan) return undefined;
  if (snapshot.plan.goal === "custom") {
    return snapshot.plan.customGoal?.trim() || GOAL_LABELS.custom;
  }
  return GOAL_LABELS[snapshot.plan.goal] ?? snapshot.plan.goal;
}

export function computeCheckinStreak(days: string[]): number {
  const unique = [...new Set(days)].sort((a, b) => b.localeCompare(a));
  if (unique.length === 0) return 0;

  const today = new Date().toISOString().slice(0, 10);
  const startIdx = unique[0] === today ? 0 : unique[0] === offsetDay(today, -1) ? 0 : -1;
  if (startIdx < 0) return 0;

  let streak = 1;
  for (let i = 1; i < unique.length; i++) {
    if (unique[i] === offsetDay(unique[i - 1], -1)) streak++;
    else break;
  }
  return streak;
}

function offsetDay(isoDay: string, delta: number): string {
  const [y, m, d] = isoDay.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + delta)).toISOString().slice(0, 10);
}
