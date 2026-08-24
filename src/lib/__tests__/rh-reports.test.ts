import { describe, expect, it } from "vitest";
import type { RhDashboardData } from "@/lib/api/manager.server";
import {
  buildReportCsv,
  buildReportPreview,
  filterDashboardByTeam,
  snapshotFromTrendWindows,
} from "@/lib/rh-reports";
import { buildRhReportPdfDefinition } from "@/lib/rh-report-pdf";

const sample: RhDashboardData = {
  totalUsers: 12,
  checkinsToday: 4,
  checkinsThisWeek: 28,
  weeklyAdhesion: 33,
  teams: [
    {
      name: "Equipe A",
      memberCount: 8,
      avgMood: 4.1,
      avgSleep: 7,
      avgWater: 1400,
      negativeMoodPct: 15,
      status: "stable",
      metricsHidden: false,
    },
    {
      name: "Equipe B",
      memberCount: 4,
      avgMood: 0,
      avgSleep: 0,
      avgWater: 0,
      negativeMoodPct: 0,
      status: "stable",
      metricsHidden: true,
    },
  ],
  trends: [
    { date: "2026-08-10", avgMood: 3.5, avgSleep: 6.5, avgWater: 1200, checkinCount: 5 },
    { date: "2026-08-18", avgMood: 4, avgSleep: 7, avgWater: 1300, checkinCount: 6 },
    { date: "2026-08-20", avgMood: 4.2, avgSleep: 7.2, avgWater: 1400, checkinCount: 7 },
  ],
  alerts: [
    {
      id: "1",
      team: "Equipe A",
      type: "stress",
      severity: "medium",
      message: "Atenção agregada",
    },
    {
      id: "2",
      team: "Equipe B",
      type: "sleep",
      severity: "low",
      message: "Sono",
    },
  ],
  moodDistribution: { feliz: 3, calmo: 2 },
  moodDistribution7d: {},
};

describe("rh-reports", () => {
  it("filtra equipe e ajusta totalUsers", () => {
    const filtered = filterDashboardByTeam(sample, "Equipe A");
    expect(filtered.teams).toHaveLength(1);
    expect(filtered.alerts).toHaveLength(1);
    expect(filtered.totalUsers).toBe(8);
  });

  it("monta CSV de equipes sem campos privados", () => {
    const csv = buildReportCsv({
      reportType: "teams",
      periodDays: 30,
      teamName: null,
      current: sample,
      previous: null,
    });
    expect(csv).toMatch(/Equipe A/);
    expect(csv).toMatch(/Oculto \(k-anonimato\)/);
    expect(csv).not.toMatch(/diary|chat_messages|privacy_/i);
  });

  it("prévia de adesão e alertas", () => {
    const adhesion = buildReportPreview({
      reportType: "adhesion",
      periodDays: 30,
      teamName: null,
      current: sample,
      previous: null,
    });
    expect(adhesion.kpis.some((k) => k.label.includes("Adesão"))).toBe(true);

    const alerts = buildReportPreview({
      reportType: "alerts",
      periodDays: 30,
      teamName: "Equipe A",
      current: filterDashboardByTeam(sample, "Equipe A"),
      previous: null,
    });
    expect(alerts.table.rows).toHaveLength(1);
  });

  it("comparativo usa snapshot anterior", () => {
    const previous = snapshotFromTrendWindows(sample, 7);
    const preview = buildReportPreview({
      reportType: "comparison",
      periodDays: 7,
      teamName: null,
      current: sample,
      previous,
    });
    expect(preview.table.headers).toEqual(["Indicador", "Atual", "Anterior", "Variação"]);
    expect(preview.notes.some((n) => /anteriores/i.test(n))).toBe(true);
  });
});

describe("buildRhReportPdfDefinition", () => {
  it("gera PDF focado no tipo sem dados privados", () => {
    const doc = buildRhReportPdfDefinition(
      {
        reportType: "teams",
        periodDays: 30,
        teamName: null,
        current: sample,
        previous: null,
        exportedBy: "rh@empresa.com",
      },
      null,
    );
    const flat = JSON.stringify(doc.content);
    expect(doc.info?.title).toMatch(/Status por equipe/);
    expect(flat).toMatch(/Equipe A/);
    expect(flat).toMatch(/CONFIDENCIAL|opt-in|k-anonimato/i);
    expect(flat).not.toMatch(/diary|chat_messages/);
  });
});
