import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  WORK_FACTOR_IDS,
  aggregateWorkFactors,
  assertFactorMatchesDay,
  calendarDayKey,
  factorForDayKey,
  shapeRhWorkFactors,
  workFactorLevel,
} from "@/lib/work-factors";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function addDays(dayKey: string, days: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey);
  if (!match) throw new Error("invalid day");
  const utc = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + days));
  return utc.toISOString().slice(0, 10);
}

describe("fator do dia", () => {
  it("começa a rotação no primeiro fator e cobre os quatro antes de repetir", () => {
    expect(factorForDayKey("1970-01-01").id).toBe(WORK_FACTOR_IDS[0]);
    const ids = [0, 1, 2, 3].map((offset) => factorForDayKey(addDays("2026-03-01", offset)).id);
    expect(new Set(ids).size).toBe(4);
    expect(factorForDayKey(addDays("2026-03-01", 4)).id).toBe(ids[0]);
  });

  it("rejeita uma data malformada", () => {
    expect(() => factorForDayKey("27/10/2026")).toThrow("invalid day");
    expect(assertFactorMatchesDay("27/10/2026", "carga")).toBe(false);
  });

  it("usa o dia em São Paulo, não o dia UTC", () => {
    expect(calendarDayKey(new Date("2026-10-28T01:30:00.000Z"))).toBe("2026-10-27");
  });
});

describe("agregado para o RH", () => {
  const teams = [
    { teamName: "Produto", optedInMembers: 6 },
    { teamName: "Gente", optedInMembers: 3 },
  ];

  it("esconde fator com menos de 5 pessoas e não devolve a nota", () => {
    const answers = ["u1", "u2", "u3", "u4"].map((userId, index) => ({
      userId,
      teamName: "Produto",
      factorId: "carga",
      score: index + 1,
    }));
    const report = aggregateWorkFactors({ teams, answers });
    const carga = report.teams.find((team) => team.teamName === "Produto")?.factors[0];
    expect(carga).toMatchObject({
      available: false,
      average: null,
      respondents: null,
      level: null,
    });
    expect(JSON.stringify(report)).not.toContain("u1");
  });

  it("mostra a média quando há 5 pessoas diferentes e conta resposta repetida uma vez", () => {
    const answers = [
      ...["u1", "u2", "u3", "u4", "u5"].map((userId) => ({
        userId,
        teamName: "Produto",
        factorId: "carga",
        score: 4,
      })),
      { userId: "u1", teamName: "Produto", factorId: "carga", score: 2 },
    ];
    const report = aggregateWorkFactors({ teams, answers });
    const carga = report.teams.find((team) => team.teamName === "Produto")?.factors[0];
    expect(carga).toMatchObject({
      available: true,
      respondents: 5,
      average: 3.7,
      level: "atencao",
    });
  });

  it("oculta a equipe inteira com menos de 5 pessoas autorizadas", () => {
    const answers = ["u1", "u2", "u3"].map((userId) => ({
      userId,
      teamName: "Gente",
      factorId: "apoio",
      score: 1,
    }));
    const report = aggregateWorkFactors({ teams, answers });
    const gente = report.teams.find((team) => team.teamName === "Gente");
    expect(gente?.metricsHidden).toBe(true);
    expect(
      gente?.factors.every((factor) => factor.average === null && factor.respondents === null),
    ).toBe(true);
  });

  it("classifica a média pelos limites visíveis", () => {
    expect(workFactorLevel(4)).toBe("favoravel");
    expect(workFactorLevel(3.9)).toBe("atencao");
    expect(workFactorLevel(3)).toBe("atencao");
    expect(workFactorLevel(2.9)).toBe("risco");
  });
});

describe("rede de segurança do agregado", () => {
  it("apaga média que o banco tenha deixado passar abaixo de 5", () => {
    const report = shapeRhWorkFactors({
      periodDays: 28,
      teams: [
        {
          teamName: "Produto",
          metricsHidden: false,
          factors: [{ factorId: "carga", respondents: 4, average: 1 }],
        },
        {
          teamName: "Gente",
          metricsHidden: true,
          factors: [{ factorId: "carga", respondents: 9, average: 2 }],
        },
      ],
    });
    expect(report.teams[0].factors[0]).toMatchObject({
      available: false,
      average: null,
      respondents: null,
    });
    expect(report.teams[1].factors.every((factor) => factor.average === null)).toBe(true);
    expect(report.teams[0].factors).toHaveLength(4);
  });
});

describe("migration 019", () => {
  const sql = readFileSync(join(root, "supabase/migrations/019_work_factor_responses.sql"), "utf8");

  it("usa a mesma ordem de fatores do código", () => {
    const literal = WORK_FACTOR_IDS.map((id) => `'${id}'`).join(",");
    expect(sql.replace(/\s/g, "")).toContain(`ARRAY[${literal}]`);
  });

  it("não devolve resposta individual e exige opt-in com mínimo de 5", () => {
    expect(sql).toMatch(/privacy_rh_opt_in IS TRUE/);
    expect(sql).toMatch(/COALESCE\(fs\.respondents, 0\) < v_k THEN NULL/);
    expect(sql).toMatch(/tc\.member_count < v_k/);
    expect(sql).not.toMatch(/'user_id'|'userId'/);
    expect(sql).not.toMatch(/CREATE POLICY "work_factor_manager/);
  });

  it("histórico só sem usuário logado; logado continua preso ao dia de hoje", () => {
    const backfill = readFileSync(
      join(root, "supabase/migrations/020_work_factor_backfill.sql"),
      "utf8",
    );
    expect(backfill).toMatch(
      /IF auth\.uid\(\) IS NOT NULL THEN[\s\S]*NEW\.answered_on IS DISTINCT FROM v_today/,
    );
    expect(backfill).toMatch(/v_checkin_user IS DISTINCT FROM NEW\.user_id/);
    expect(backfill).toMatch(/work_factor_id_for_day\(NEW\.answered_on\)/);
  });

  it("grava check-in e resposta na mesma função e apaga resposta antiga na retenção", () => {
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.save_my_checkin/);
    expect(sql).toMatch(/DELETE FROM work_factor_responses/);
  });
});
