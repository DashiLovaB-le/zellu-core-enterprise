import { describe, expect, it } from "vitest";
import { buildCompanionPortrait, computeCheckinStreak } from "@/lib/companion-portrait";
import type { CompanionSnapshot } from "@/lib/companion-agent";

const baseSnapshot: CompanionSnapshot = {
  checkins: [
    { day: "2026-08-19", mood: "grato", sleepHours: 7, sleepLabel: "Bom", waterMl: 1500 },
    { day: "2026-08-18", mood: "calmo", sleepHours: 6.5, sleepLabel: "Regular", waterMl: 1200 },
  ],
  habitsToday: {
    waterMl: 800,
    sleepQuality: 70,
    mood: "grato",
    movementMinutes: 15,
    energyLevel: 65,
  },
  plan: {
    goal: "melhorar-sono",
    customGoal: null,
    today: { water: true, walk: false, breathe: true, talk: false },
  },
  preventiveLine: "- Sem alertas preventivos",
  memories: [{ importance: 4, content: "Prefere pausas curtas" }],
};

describe("buildCompanionPortrait", () => {
  it("inclui nome, check-in, plano e memórias", () => {
    const portrait = buildCompanionPortrait(baseSnapshot, {
      preferredName: "Gabriell",
      streakDays: 4,
    });
    expect(portrait).toContain("Gabriell");
    expect(portrait).toContain("grato");
    expect(portrait).toContain("Melhorar o sono");
    expect(portrait).toContain("Prefere pausas curtas");
    expect(portrait).toContain("4 dia(s)");
  });
});

describe("computeCheckinStreak", () => {
  it("conta dias consecutivos a partir de hoje", () => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    expect(computeCheckinStreak([today, yesterday])).toBe(2);
  });
});
