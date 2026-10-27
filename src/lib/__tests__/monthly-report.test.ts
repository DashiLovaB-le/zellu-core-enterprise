import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  buildMonthlyReportEmail,
  monthLabel,
  monthlySummarySchema,
  previousMonthOf,
  reportMonthFor,
  type MonthlySummary,
} from "@/lib/monthly-report";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function factors(values: Partial<Record<string, number>>) {
  return ["carga", "autonomia", "apoio", "relacoes"].map((factorId) => ({
    factorId,
    respondents: values[factorId] === undefined ? null : 8,
    average: values[factorId] ?? null,
  }));
}

const october: MonthlySummary = monthlySummarySchema.parse({
  month: "2026-10-01",
  days: 31,
  totalUsers: 48,
  activeUsers: 41,
  checkins: 612,
  adhesion: 57,
  companyMetricsAllowed: true,
  teams: [
    {
      name: "Atendimento",
      memberCount: 8,
      hidden: false,
      checkins: 150,
      avgMood: 3.1,
      avgSleep: 6.4,
      negativeMoodPct: 42,
      status: "attention",
      factors: factors({ carga: 2.4, autonomia: 3.6, apoio: 2.8, relacoes: 4.1 }),
    },
    {
      name: "Financeiro",
      memberCount: 6,
      hidden: false,
      checkins: 90,
      avgMood: 4.8,
      avgSleep: 7,
      negativeMoodPct: 12,
      status: "stable",
      factors: factors({ carga: 4.1 }),
    },
    { name: "Diretoria <b>", memberCount: 2, hidden: true },
  ],
});

const september: MonthlySummary = monthlySummarySchema.parse({
  ...october,
  month: "2026-09-01",
  totalUsers: 45,
  adhesion: 52,
  teams: [
    { ...october.teams[0], factors: factors({ carga: 2.2, autonomia: 2.9 }) },
    { ...october.teams[1], status: "monitor", negativeMoodPct: 25 },
  ],
});

const urls = {
  panelUrl: "https://app.zellu.app/manager/rh-dashboard",
  profileUrl: "https://app.zellu.app/perfil",
};

describe("mês de referência", () => {
  it("usa o mês anterior no fuso de São Paulo", () => {
    expect(reportMonthFor(new Date("2026-11-01T12:00:00Z"))).toEqual({
      month: "2026-10-01",
      previous: "2026-09-01",
    });
    expect(reportMonthFor(new Date("2026-11-01T02:00:00Z")).month).toBe("2026-09-01");
    expect(reportMonthFor(new Date("2027-01-01T12:00:00Z")).month).toBe("2026-12-01");
    expect(previousMonthOf("2026-01-01")).toBe("2025-12-01");
    expect(monthLabel("2026-10-01")).toBe("outubro de 2026");
  });
});

describe("e-mail do resumo mensal", () => {
  it("traz adesão, equipes em atenção, fatores e o que melhorou", () => {
    const email = buildMonthlyReportEmail({
      companyName: "Empresa Demo",
      current: october,
      previous: september,
      ...urls,
    });
    expect(email.subject).toBe("Zēllu · Resumo de outubro de 2026 — Empresa Demo");
    expect(email.html).toContain("Outubro de 2026 — Empresa Demo");
    expect(email.text).toContain("48 colaboradores participando (+3 em relação ao mês anterior)");
    expect(email.text).toContain("adesão média de 57% (era 52%)");
    expect(email.text).toContain("Atendimento: Atenção · 42% dos check-ins com humor negativo");
    expect(email.text).toContain(
      "Atendimento: carga de trabalho em risco (2,4) · apoio da liderança em risco (2,8) · autonomia em atenção (3,6)",
    );
    expect(email.text).toContain("Primeira ação sugerida para Atendimento: Reveja as prioridades");
    expect(email.text).toContain('Todas as ações sugeridas estão no Painel RH, em "Como agir".');
    expect(email.text).toContain('Financeiro saiu de "Monitorar" para "Estável".');
    expect(email.text).toContain("Atendimento: autonomia passou de risco para atenção.");
    expect(email.text).toContain(
      "1 equipe não aparece porque tem menos de 5 pessoas participando.",
    );
    expect(email.text).toContain(urls.panelUrl);
    expect(email.text).toContain(urls.profileUrl);
  });

  it("equipe só em atenção não ganha ação própria no e-mail", () => {
    const calm = monthlySummarySchema.parse({
      ...october,
      teams: [{ ...october.teams[1], factors: factors({ carga: 3.0 }) }],
    });
    const email = buildMonthlyReportEmail({
      companyName: "Empresa Demo",
      current: calm,
      previous: null,
      ...urls,
    });
    expect(email.text).toContain("Financeiro: carga de trabalho em atenção (3,0)");
    expect(email.text).not.toContain("Primeira ação sugerida");
  });

  it("não cita equipe oculta pelo nome e escapa HTML", () => {
    const email = buildMonthlyReportEmail({
      companyName: "Acme & <Filhos>",
      current: october,
      previous: null,
      ...urls,
    });
    expect(email.text).not.toContain("Diretoria");
    expect(email.html).not.toContain("Diretoria");
    expect(email.html).toContain("Acme &amp; &lt;Filhos&gt;");
    expect(email.html).not.toContain("<Filhos>");
  });

  it("sem 5 pessoas autorizadas mostra só a adesão", () => {
    const small = monthlySummarySchema.parse({
      ...october,
      totalUsers: 4,
      companyMetricsAllowed: false,
      teams: [{ name: "Atendimento", memberCount: 4, hidden: true }],
    });
    const email = buildMonthlyReportEmail({
      companyName: "Pequena",
      current: small,
      previous: null,
      ...urls,
    });
    expect(email.text).toContain("Ainda não há 5 colaboradores");
    expect(email.text).not.toContain("Fatores de trabalho");
    expect(email.text).not.toContain("humor negativo");
  });
});

describe("rota agendada do resumo mensal", () => {
  it("recusa sem CRON_SECRET, método errado e mês inválido", async () => {
    process.env.CRON_SECRET = "segredo-de-teste";
    const { handleMonthlyReportCronRequest } = await import("@/lib/monthly-report.server");
    const base = "https://app.zellu.app/api/jobs/monthly-report";
    const auth = { Authorization: "Bearer segredo-de-teste" };

    expect(
      (await handleMonthlyReportCronRequest(new Request(base, { method: "POST" }))).status,
    ).toBe(401);
    expect(
      (
        await handleMonthlyReportCronRequest(
          new Request(base, { method: "POST", headers: { Authorization: "Bearer errado" } }),
        )
      ).status,
    ).toBe(401);
    expect(
      (await handleMonthlyReportCronRequest(new Request(base, { method: "PUT", headers: auth })))
        .status,
    ).toBe(405);
    expect(
      (
        await handleMonthlyReportCronRequest(
          new Request(`${base}?month=2026-13`, { headers: auth }),
        )
      ).status,
    ).toBe(400);
  });
});

describe("migration 022", () => {
  const sql = readFileSync(join(root, "supabase/migrations/022_rh_monthly_report.sql"), "utf8");

  it("resumo e reserva de envio só rodam com service_role", () => {
    for (const fn of [
      "get_company_monthly_rh_summary(uuid, date)",
      "claim_rh_monthly_report_send(uuid, uuid, date)",
    ]) {
      expect(sql).toContain(`REVOKE ALL ON FUNCTION public.${fn} FROM authenticated;`);
      expect(sql).toContain(`GRANT EXECUTE ON FUNCTION public.${fn} TO service_role;`);
    }
  });

  it("segue as regras de privacidade do painel", () => {
    expect(sql).toMatch(/privacy_rh_opt_in IS TRUE/);
    expect(sql).toMatch(/v_k int := 5/);
    expect(sql).not.toMatch(/'userId'|'user_id'|'email'/);
    expect(sql).toMatch(/UNIQUE \(company_id, recipient_id, report_month\)/);
  });

  it("vercel agenda o resumo no dia 1 sem tirar a retenção do primeiro lugar", () => {
    const vercel = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
    expect(vercel.crons[0].path).toBe("/api/jobs/retention");
    expect(vercel.crons).toContainEqual({
      path: "/api/jobs/monthly-report",
      schedule: "0 12 1 * *",
    });
  });
});
