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
