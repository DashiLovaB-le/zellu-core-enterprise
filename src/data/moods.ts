export type MoodOption = {
  emoji: string;
  label: string;
  value: string;
};

/** 6 humores principais — mesma lista de Meu Bem-estar / Chat */
export const MAIN_MOODS: MoodOption[] = [
  { emoji: "😊", label: "Feliz", value: "feliz" },
  { emoji: "😌", label: "Calmo", value: "calmo" },
  { emoji: "😐", label: "Neutro", value: "neutro" },
  { emoji: "😟", label: "Ansioso", value: "ansioso" },
  { emoji: "😢", label: "Triste", value: "triste" },
  { emoji: "😤", label: "Irritado", value: "irritado" },
];

/** Humores extras (expandidos via "Ver +N humores") */
export const EXTRA_MOODS: MoodOption[] = [
  { emoji: "🥳", label: "Animado", value: "animado" },
  { emoji: "😃", label: "Contente", value: "contente" },
  { emoji: "🤗", label: "Grato", value: "grato" },
  { emoji: "🧘", label: "Sereno", value: "sereno" },
  { emoji: "💪", label: "Motivado", value: "motivado" },
  { emoji: "🎯", label: "Focado", value: "focado" },
  { emoji: "🙏", label: "Esperançoso", value: "esperancoso" },
  { emoji: "🤩", label: "Entusiasmado", value: "entusiasmado" },
  { emoji: "☺️", label: "Orgulhoso", value: "orgulhoso" },
  { emoji: "🤔", label: "Pensativo", value: "pensativo" },
  { emoji: "🫤", label: "Confuso", value: "confuso" },
  { emoji: "😴", label: "Cansado", value: "cansado" },
  { emoji: "🫂", label: "Acolhido", value: "acolhido" },
  { emoji: "😰", label: "Preocupado", value: "preocupado" },
  { emoji: "😥", label: "Inseguro", value: "inseguro" },
  { emoji: "😞", label: "Desanimado", value: "desanimado" },
  { emoji: "😡", label: "Bravo", value: "bravo" },
  { emoji: "🤯", label: "Sobrecarregado", value: "sobrecarregado" },
  { emoji: "🥺", label: "Precisa de apoio", value: "carente" },
];

export const ALL_MOODS: MoodOption[] = [...MAIN_MOODS, ...EXTRA_MOODS];

export const MOOD_MAP: Record<string, MoodOption> = Object.fromEntries(
  ALL_MOODS.map((m) => [m.value, m]),
);

/** Score 1–6 usado em preventiva, dashboard e RH. Extra moods entram no score. */
export const MOOD_SCORE: Record<string, number> = {
  irritado: 1,
  bravo: 1,
  triste: 2,
  desanimado: 2,
  carente: 2,
  inseguro: 2,
  ansioso: 3,
  preocupado: 3,
  sobrecarregado: 3,
  confuso: 3,
  neutro: 4,
  pensativo: 4,
  cansado: 4,
  calmo: 5,
  sereno: 5,
  focado: 5,
  acolhido: 5,
  feliz: 6,
  animado: 6,
  contente: 6,
  grato: 6,
  motivado: 6,
  esperancoso: 6,
  entusiasmado: 6,
  orgulhoso: 6,
};

export const NEGATIVE_MOODS = new Set(
  Object.entries(MOOD_SCORE)
    .filter(([, score]) => score <= 3)
    .map(([mood]) => mood),
);

export const MAIN_MOOD_ORDER = MAIN_MOODS.map((m) => m.value);

export const MAIN_MOOD_COLORS: Record<string, string> = {
  feliz: "#C8E6C9",
  calmo: "#99BEE5",
  neutro: "#C5D9F1",
  ansioso: "#FFCC80",
  triste: "#90CAF9",
  irritado: "#EF9A9A",
};

export type WeeklyMoodBar = {
  mood: string;
  key: string;
  count: number;
  fill: string;
};

export function getMoodScore(mood: string | null | undefined): number {
  if (!mood) return 0;
  return MOOD_SCORE[mood.toLowerCase()] ?? 0;
}

export function isNegativeMood(mood: string | null | undefined): boolean {
  if (!mood) return false;
  return NEGATIVE_MOODS.has(mood.toLowerCase());
}

export function canonicalMood(mood: string | null | undefined): string | null {
  if (!mood) return null;
  const key = mood.toLowerCase();
  if (MOOD_MAP[key]) return key;
  return null;
}

/** Humores extras entram nas 6 categorias do gráfico de distribuição. */
export function toMainMood(mood: string | null | undefined): string | null {
  const key = canonicalMood(mood);
  if (!key) return null;
  if (MAIN_MOOD_ORDER.includes(key)) return key;
  const score = getMoodScore(key);
  if (score >= 6) return "feliz";
  if (score === 5) return "calmo";
  if (score === 4) return "neutro";
  if (score === 3) return "ansioso";
  if (score === 2) return "triste";
  if (score === 1) return "irritado";
  return null;
}

export function buildWeeklyMoodBars(distribution: Record<string, number>): WeeklyMoodBar[] {
  const counts: Record<string, number> = Object.fromEntries(MAIN_MOOD_ORDER.map((m) => [m, 0]));
  for (const [mood, count] of Object.entries(distribution)) {
    if (!count) continue;
    const main = toMainMood(mood);
    if (main) counts[main] = (counts[main] ?? 0) + count;
  }
  return MAIN_MOOD_ORDER.map((m) => ({
    mood: MOOD_MAP[m]?.label ?? m,
    key: m,
    count: counts[m] ?? 0,
    fill: MAIN_MOOD_COLORS[m] ?? "#C5D9F1",
  }));
}

export type MoodPieSlice = WeeklyMoodBar & { percent: number };

export function buildMoodPieSlices(distribution: Record<string, number>): MoodPieSlice[] {
  const bars = buildWeeklyMoodBars(distribution);
  const total = bars.reduce((sum, row) => sum + row.count, 0);
  return bars
    .filter((row) => row.count > 0)
    .map((row) => ({
      ...row,
      percent: total > 0 ? Math.round((row.count / total) * 100) : 0,
    }));
}
