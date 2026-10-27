import { K_ANONYMITY_MIN } from "@/lib/tenant";

/** Ordem fixa. O índice do dia no banco usa exatamente esta sequência. */
export const WORK_FACTOR_IDS = ["carga", "autonomia", "apoio", "relacoes"] as const;
export type WorkFactorId = (typeof WORK_FACTOR_IDS)[number];

export const WORK_FACTOR_SCORES = [1, 2, 3, 4, 5] as const;
export type WorkFactorScore = (typeof WORK_FACTOR_SCORES)[number];

export const WORK_FACTOR_PERIOD_DAYS = 28;
export const WORK_FACTOR_TIMEZONE = "America/Sao_Paulo";

export type WorkFactorLevel = "favoravel" | "atencao" | "risco";

export type WorkFactor = {
  id: WorkFactorId;
  label: string;
  question: string;
  lowLabel: string;
  highLabel: string;
};

export const WORK_FACTORS: readonly WorkFactor[] = [
  {
    id: "carga",
    label: "Carga de trabalho",
    question: "Hoje o volume de trabalho foi possível de dar conta?",
    lowLabel: "Nada possível",
    highLabel: "Totalmente possível",
  },
  {
    id: "autonomia",
    label: "Autonomia",
    question: "Você conseguiu decidir como fazer o seu trabalho hoje?",
    lowLabel: "Nada",
    highLabel: "Totalmente",
  },
  {
    id: "apoio",
    label: "Apoio da liderança",
    question: "Se precisasse, teria apoio da sua liderança hoje?",
    lowLabel: "Nenhum apoio",
    highLabel: "Apoio total",
  },
  {
    id: "relacoes",
    label: "Relações no trabalho",
    question: "O convívio com as pessoas do trabalho foi respeitoso hoje?",
    lowLabel: "Nada respeitoso",
    highLabel: "Totalmente respeitoso",
  },
];

export type RhWorkFactorSignal = {
  factorId: WorkFactorId;
  label: string;
  available: boolean;
  average: number | null;
  respondents: number | null;
  level: WorkFactorLevel | null;
};

export type RhWorkFactorTeam = {
  teamName: string;
  metricsHidden: boolean;
  factors: RhWorkFactorSignal[];
};

export type RhWorkFactorReport = {
  periodDays: number;
  teams: RhWorkFactorTeam[];
};

export function isWorkFactorId(value: string): value is WorkFactorId {
  return (WORK_FACTOR_IDS as readonly string[]).includes(value);
}

export function isWorkFactorScore(value: number): value is WorkFactorScore {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

export function factorById(id: string): WorkFactor | null {
  return WORK_FACTORS.find((factor) => factor.id === id) ?? null;
}

export function workFactorLevel(average: number): WorkFactorLevel {
  if (average >= 4) return "favoravel";
  if (average >= 3) return "atencao";
  return "risco";
}

export function workFactorLevelLabel(level: WorkFactorLevel): string {
  if (level === "favoravel") return "Favorável";
  if (level === "atencao") return "Atenção";
  return "Risco";
}

/** Dia civil em America/Sao_Paulo, no formato YYYY-MM-DD. */
export function calendarDayKey(date: Date, timeZone = WORK_FACTOR_TIMEZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Mesma conta do banco: dias desde 1970-01-01, módulo 4, na ordem de WORK_FACTOR_IDS.
 * O check-in só grava a resposta se os dois lados concordarem.
 */
export function factorForDayKey(dayKey: string): WorkFactor {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey);
  if (!match) throw new Error("invalid day");
  const utc = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(utc)) throw new Error("invalid day");
  const index = Math.floor(utc / 86_400_000);
  const slot = ((index % WORK_FACTORS.length) + WORK_FACTORS.length) % WORK_FACTORS.length;
  return WORK_FACTORS[slot];
}

export function assertFactorMatchesDay(dayKey: string, factorId: string): boolean {
  try {
    return factorForDayKey(dayKey).id === factorId;
  } catch {
    return false;
  }
}

function roundAverage(value: number): number {
  return Math.round(value * 10) / 10;
}

function emptySignal(factor: WorkFactor): RhWorkFactorSignal {
  return {
    factorId: factor.id,
    label: factor.label,
    available: false,
    average: null,
    respondents: null,
    level: null,
  };
}

export function aggregateWorkFactors(
  input: {
    teams: Array<{ teamName: string; optedInMembers: number }>;
    answers: Array<{ userId: string; teamName: string; factorId: string; score: number }>;
  },
  minRespondents = K_ANONYMITY_MIN,
): RhWorkFactorReport {
  const teams = input.teams
    .filter((team) => team.optedInMembers > 0)
    .map((team) => {
      const hidden = team.optedInMembers < minRespondents;
      const teamAnswers = input.answers.filter((answer) => answer.teamName === team.teamName);
      const factors = WORK_FACTORS.map((factor) => {
        if (hidden) return emptySignal(factor);
        const rows = teamAnswers.filter(
          (answer) => answer.factorId === factor.id && isWorkFactorScore(answer.score),
        );
        const respondents = new Set(rows.map((answer) => answer.userId)).size;
        if (respondents < minRespondents || rows.length === 0) return emptySignal(factor);
        const average = roundAverage(
          rows.reduce((sum, answer) => sum + answer.score, 0) / rows.length,
        );
        return {
          factorId: factor.id,
          label: factor.label,
          available: true,
          average,
          respondents,
          level: workFactorLevel(average),
        };
      });
      return { teamName: team.teamName, metricsHidden: hidden, factors };
    });

  return { periodDays: WORK_FACTOR_PERIOD_DAYS, teams };
}

export function shapeRhWorkFactors(input: {
  periodDays: number;
  teams: Array<{
    teamName: string;
    metricsHidden: boolean;
    factors: Array<{ factorId: string; respondents: number | null; average: number | null }>;
  }>;
}): RhWorkFactorReport {
  const periodDays = Math.min(90, Math.max(7, Math.round(input.periodDays)));
  const teams = input.teams.map((team) => {
    const factors = WORK_FACTORS.map((factor) => {
      if (team.metricsHidden) return emptySignal(factor);
      const raw = team.factors.find((item) => item.factorId === factor.id);
      const respondents = raw?.respondents ?? null;
      const average = raw?.average ?? null;
      if (
        respondents === null ||
        respondents < K_ANONYMITY_MIN ||
        average === null ||
        !Number.isFinite(average)
      ) {
        return emptySignal(factor);
      }
      const rounded = roundAverage(average);
      return {
        factorId: factor.id,
        label: factor.label,
        available: true,
        average: rounded,
        respondents,
        level: workFactorLevel(rounded),
      };
    });
    return { teamName: team.teamName, metricsHidden: team.metricsHidden, factors };
  });
  return { periodDays, teams };
}
