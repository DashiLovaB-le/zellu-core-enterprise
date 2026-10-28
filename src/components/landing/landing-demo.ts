import { buildMonthlyReportEmail, monthlySummarySchema } from "@/lib/monthly-report";
import {
  aggregateWorkFactors,
  shapeRhWorkFactors,
  type RhWorkFactorReport,
} from "@/lib/work-factors";

/** Dados de demonstração da landing. Nada aqui vem de cliente real. */

export const DEMO_COMPANY = "Empresa Demo";

export const DEMO_PANEL: RhWorkFactorReport = shapeRhWorkFactors({
  periodDays: 28,
  teams: [
    {
      teamName: "Atendimento",
      metricsHidden: false,
      factors: [
        { factorId: "carga", respondents: 8, average: 2.4 },
        { factorId: "autonomia", respondents: 8, average: 3.4 },
        { factorId: "apoio", respondents: 7, average: 2.8 },
        { factorId: "relacoes", respondents: 8, average: 4.1 },
      ],
    },
  ],
});

export const DEMO_TEAM_FOR_GUIDE = "Atendimento";

export const REVEAL_TEAM = "Comercial";
const REVEAL_SCORES = [3, 2, 3, 3, 2, 3, 4];
export const REVEAL_MAX = REVEAL_SCORES.length;

/** Usa a mesma regra do painel: um fator só aparece com respostas de 5 pessoas diferentes. */
export function revealReport(respondents: number): RhWorkFactorReport {
  const count = Math.max(0, Math.min(REVEAL_MAX, respondents));
  return aggregateWorkFactors({
    teams: [{ teamName: REVEAL_TEAM, optedInMembers: REVEAL_MAX }],
    answers: REVEAL_SCORES.slice(0, count).map((score, i) => ({
      userId: `pessoa-${i + 1}`,
      teamName: REVEAL_TEAM,
      factorId: "carga",
      score,
    })),
  });
}

const factors = (values: Record<string, number>) =>
  ["carga", "autonomia", "apoio", "relacoes"].map((factorId) => ({
    factorId,
    respondents: values[factorId] === undefined ? null : 8,
    average: values[factorId] ?? null,
  }));

const october = monthlySummarySchema.parse({
  month: "2026-10-01",
  days: 31,
  totalUsers: 64,
  activeUsers: 55,
  checkins: 980,
  adhesion: 49,
  companyMetricsAllowed: true,
  teams: [
    {
      name: "Atendimento",
      memberCount: 14,
      hidden: false,
      checkins: 220,
      avgMood: 3.2,
      avgSleep: 6.4,
      negativeMoodPct: 41,
      status: "attention",
      factors: factors({ carga: 2.4, autonomia: 3.4, apoio: 2.8, relacoes: 4.1 }),
    },
    {
      name: "Comercial",
      memberCount: 11,
      hidden: false,
      checkins: 170,
      avgMood: 4.1,
      avgSleep: 6.8,
      negativeMoodPct: 24,
      status: "monitor",
      factors: factors({ carga: 3.3, autonomia: 4.0, apoio: 3.9, relacoes: 4.2 }),
    },
    {
      name: "Financeiro",
      memberCount: 8,
      hidden: false,
      checkins: 140,
      avgMood: 4.8,
      avgSleep: 7.1,
      negativeMoodPct: 11,
      status: "stable",
      factors: factors({ carga: 4.1, autonomia: 4.3, apoio: 4.4, relacoes: 4.5 }),
    },
    { name: "Diretoria", memberCount: 3, hidden: true },
  ],
});

const september = monthlySummarySchema.parse({
  ...october,
  month: "2026-09-01",
  totalUsers: 58,
  adhesion: 44,
  teams: [
    {
      ...october.teams[0],
      factors: factors({ carga: 2.2, autonomia: 2.9, apoio: 2.7, relacoes: 3.6 }),
    },
    { ...october.teams[1], status: "monitor" },
    { ...october.teams[2], status: "monitor", negativeMoodPct: 22 },
  ],
});

export function demoMonthlyEmail(origin: string) {
  return buildMonthlyReportEmail({
    companyName: DEMO_COMPANY,
    current: october,
    previous: september,
    panelUrl: `${origin}/#agendar`,
    profileUrl: `${origin}/#agendar`,
  });
}
