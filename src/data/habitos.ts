export const MAIN_MEALS = [
  { name: "Café da Manhã", emoji: "🥞" },
  { name: "Almoço", emoji: "🥗" },
  { name: "Lanche", emoji: "🍎" },
  { name: "Jantar", emoji: "🍲" },
];

export const EXTRA_MEALS = [
  { name: "Café Reforçado", emoji: "🥣" },
  { name: "Brunch", emoji: "🥪" },
  { name: "Smoothie", emoji: "🥤" },
  { name: "Café da Tarde", emoji: "☕" },
  { name: "Chá", emoji: "🍵" },
  { name: "Salada", emoji: "🥬" },
  { name: "Sanduíche", emoji: "🥖" },
  { name: "Petisco", emoji: "🥜" },
  { name: "Ceia", emoji: "🍿" },
  { name: "Sobremesa", emoji: "🍫" },
  { name: "Refeição Livre", emoji: "🍕" },
];

export const MEALS = [...MAIN_MEALS, ...EXTRA_MEALS];

export const WATER_GOAL = 2000;

export function getSleepLabel(val: number): string {
  if (val < 25) return "Cansado";
  if (val < 50) return "Moderado";
  if (val < 75) return "Revigorante";
  return "Descansado";
}
