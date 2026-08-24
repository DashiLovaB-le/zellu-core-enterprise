import { describe, expect, it } from "vitest";
import { buildRhDashboardPdfDefinition } from "@/lib/rh-dashboard-pdf";
import type { RhDashboardData } from "@/lib/api/manager.server";

const sample: RhDashboardData = {
  totalUsers: 6,
  checkinsToday: 3,
  checkinsThisWeek: 20,
  weeklyAdhesion: 48,
  teams: [
    {
      name: "Equipe 01",
      memberCount: 6,
      avgMood: 4.2,
      avgSleep: 7.1,
      avgWater: 1500,
      negativeMoodPct: 12,
      status: "stable",
      metricsHidden: false,
    },
  ],
  trends: [
    { date: "2026-08-20", avgMood: 4, avgSleep: 7, avgWater: 1400, checkinCount: 4 },
    { date: "2026-08-21", avgMood: 3.8, avgSleep: 6.5, avgWater: 1200, checkinCount: 3 },
  ],
  alerts: [
    {
      id: "1",
      team: "Equipe 01",
      type: "stress",
      severity: "medium",
      message: "Tendência de humor negativo acima do esperado.",
    },
  ],
  moodDistribution: { feliz: 4, calmo: 3, ansioso: 1 },
  moodDistribution7d: { feliz: 2, calmo: 2, triste: 1 },
};

describe("buildRhDashboardPdfDefinition", () => {
  it("monta documento com seções do painel e privacidade", () => {
    const doc = buildRhDashboardPdfDefinition(
      {
        data: sample,
        moodPeriodDays: 30,
        moodPeriodDistribution: sample.moodDistribution,
        exportedBy: "rh@empresa.com",
      },
      null,
    );

    expect(doc.info?.title).toMatch(/Relatório RH/);
    expect(doc.watermark).toBeTruthy();
    expect(doc.header).toBeTypeOf("function");
    expect(doc.footer).toBeTypeOf("function");

    const flat = JSON.stringify(doc.content);
    expect(flat).toMatch(/Indicadores gerais/);
    expect(flat).toMatch(/Equipes/);
    expect(flat).toMatch(/Tendências/);
    expect(flat).toMatch(/Distribuição de humor/);
    expect(flat).toMatch(/k-anonimato|opt-in|CONFIDENCIAL|confidencial/i);
    expect(flat).not.toMatch(/diary|chat_messages/);
  });
});
