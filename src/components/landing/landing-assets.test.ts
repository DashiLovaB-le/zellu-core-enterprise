import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { expect, it } from "vitest";
import { buildRhDashboardPdfDefinition } from "@/lib/rh-dashboard-pdf";
import type { RhDashboardData } from "@/lib/api/manager.server";

/**
 * Gera a prévia do relatório PDF usada na landing, com o mesmo código do botão "Exportar Relatório".
 * Só roda com GERAR_PREVIA_PDF=1:
 *   1. GERAR_PREVIA_PDF=1 npx vitest run src/components/landing/landing-assets.test.ts
 *   2. npx pdf-to-img@latest --scale 1.6 <tmp>/zellu-landing/relatorio-rh.pdf
 *   3. ffmpeg -i relatorio-rh-1.png -q:v 82 src/assets/landing/relatorio-pdf.webp
 */
const require = createRequire(import.meta.url);

const DEMO: RhDashboardData = {
  totalUsers: 64,
  checkinsToday: 31,
  checkinsThisWeek: 214,
  weeklyAdhesion: 48,
  teams: [
    {
      name: "Atendimento",
      memberCount: 14,
      avgMood: 3.2,
      avgSleep: 6.4,
      avgWater: 1300,
      negativeMoodPct: 41,
      status: "attention",
      metricsHidden: false,
    },
    {
      name: "Comercial",
      memberCount: 11,
      avgMood: 4.1,
      avgSleep: 6.8,
      avgWater: 1450,
      negativeMoodPct: 24,
      status: "monitor",
      metricsHidden: false,
    },
    {
      name: "Financeiro",
      memberCount: 8,
      avgMood: 4.8,
      avgSleep: 7.1,
      avgWater: 1600,
      negativeMoodPct: 11,
      status: "stable",
      metricsHidden: false,
    },
    {
      name: "Produto",
      memberCount: 12,
      avgMood: 4.6,
      avgSleep: 7,
      avgWater: 1700,
      negativeMoodPct: 14,
      status: "stable",
      metricsHidden: false,
    },
    {
      name: "Diretoria",
      memberCount: 3,
      avgMood: 0,
      avgSleep: 0,
      avgWater: 0,
      negativeMoodPct: 0,
      status: "stable",
      metricsHidden: true,
    },
  ],
  trends: Array.from({ length: 14 }, (_, d) => ({
    date: `2026-10-${String(d + 15).padStart(2, "0")}`,
    avgMood: Math.round((4 + ((d % 5) - 2) / 10) * 10) / 10,
    avgSleep: 6.8,
    avgWater: 1500,
    checkinCount: 28 + (d % 6),
  })),
  alerts: [
    {
      id: "a",
      team: "Atendimento",
      type: "stress",
      severity: "high",
      message:
        "Atendimento: 41% dos check-ins indicam humor negativo. Recomenda-se atenção da liderança.",
    },
    {
      id: "b",
      team: "Comercial",
      type: "stress",
      severity: "medium",
      message: "Comercial: 24% de relatos negativos. Monitore a equipe.",
    },
  ],
  moodDistribution: { feliz: 140, calmo: 180, neutro: 120, ansioso: 70, triste: 25, irritado: 10 },
  moodDistribution7d: { feliz: 40, calmo: 52, neutro: 30, ansioso: 18, triste: 6 },
};

it.skipIf(!process.env.GERAR_PREVIA_PDF)(
  "gera o PDF de exemplo da landing",
  async () => {
    const pdfmake = require("pdfmake");
    pdfmake.addFonts(require("pdfmake/fonts/Roboto.js"));
    const out = join(tmpdir(), "zellu-landing");
    mkdirSync(out, { recursive: true });
    const definition = buildRhDashboardPdfDefinition({
      data: DEMO,
      moodPeriodDays: 30,
      moodPeriodDistribution: DEMO.moodDistribution,
      exportedBy: "rh@empresademo.com.br",
    });
    await pdfmake.createPdf(definition).write(join(out, "relatorio-rh.pdf"));
    console.log("PDF_OUT", join(out, "relatorio-rh.pdf"));
    expect(definition.content).toBeTruthy();
  },
  60000,
);
