export const MEALS = [
  {
    name: "Café da Manhã",
    emoji: "🥞",
    tint: "var(--clay-anxiety)",
    textColor: "#c44a2a",
  },
  {
    name: "Almoço",
    emoji: "🥗",
    tint: "var(--clay-joy)",
    textColor: "#2a6b3a",
  },
  {
    name: "Lanche",
    emoji: "🍎",
    tint: "var(--clay-stress)",
    textColor: "#8a6a1a",
  },
  {
    name: "Jantar",
    emoji: "🍲",
    tint: "var(--clay-self)",
    textColor: "#5a3a8a",
  },
];

export const WATER_GOAL = 2000;

export function getSleepLabel(val: number): string {
  if (val < 25) return "Cansado";
  if (val < 50) return "Moderado";
  if (val < 75) return "Revigorante";
  return "Radiante";
}
