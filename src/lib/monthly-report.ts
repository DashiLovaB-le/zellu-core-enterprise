import { z } from "zod";
import { BRANDING } from "@/lib/branding";
import { workFactorGuide } from "@/lib/work-factor-guides";
import {
  calendarDayKey,
  isWorkFactorId,
  workFactorLevel,
  type WorkFactorId,
  type WorkFactorLevel,
} from "@/lib/work-factors";

const numeric = z.union([z.number(), z.string()]).transform((value) => Number(value));
const nullableNumeric = z
  .union([z.number(), z.string(), z.null()])
  .transform((value) => (value === null ? null : Number(value)));

const teamSchema = z.object({
  name: z.string(),
  memberCount: numeric,
  hidden: z.boolean(),
  checkins: numeric.optional(),
  avgMood: numeric.optional(),
  avgSleep: numeric.optional(),
  negativeMoodPct: numeric.optional(),
  status: z.enum(["stable", "monitor", "attention"]).optional(),
  factors: z
    .array(
      z.object({
        factorId: z.string(),
        respondents: nullableNumeric,
        average: nullableNumeric,
      }),
    )
    .nullable()
    .optional(),
});

export const monthlySummarySchema = z.object({
  month: z.string(),
  days: numeric,
  totalUsers: numeric,
  activeUsers: numeric,
  checkins: numeric,
  adhesion: numeric,
  companyMetricsAllowed: z.boolean(),
  teams: z.array(teamSchema),
});

export type MonthlySummary = z.infer<typeof monthlySummarySchema>;
type TeamSummary = MonthlySummary["teams"][number];

export type MonthlyReportEmail = { subject: string; text: string; html: string };

const MONTH_FORMAT = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const FACTOR_SHORT: Record<WorkFactorId, string> = {
  carga: "carga de trabalho",
  autonomia: "autonomia",
  apoio: "apoio da liderança",
  relacoes: "relações no trabalho",
};

const STATUS_RANK = { stable: 0, monitor: 1, attention: 2 } as const;
const LEVEL_RANK: Record<WorkFactorLevel, number> = { favoravel: 0, atencao: 1, risco: 2 };

/** Mês fechado anterior à data, contado no fuso de São Paulo. */
export function reportMonthFor(now: Date): { month: string; previous: string } {
  const [year, month] = calendarDayKey(now).split("-").map(Number);
  const current = new Date(Date.UTC(year, month - 2, 1));
  const previous = new Date(Date.UTC(year, month - 3, 1));
  return {
    month: current.toISOString().slice(0, 10),
    previous: previous.toISOString().slice(0, 10),
  };
}

export function previousMonthOf(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 2, 1)).toISOString().slice(0, 10);
}

export function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return MONTH_FORMAT.format(new Date(Date.UTC(year, month - 1, 1)));
}

function decimal(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function signed(diff: number): string {
  if (diff === 0) return "igual ao mês anterior";
  return `${diff > 0 ? "+" : ""}${diff.toLocaleString("pt-BR")} em relação ao mês anterior`;
}

function statusText(status: TeamSummary["status"]): string {
  if (status === "attention") return "Atenção";
  if (status === "monitor") return "Monitorar";
  return "Estável";
}

function levelNoun(level: WorkFactorLevel): string {
  if (level === "risco") return "risco";
  if (level === "atencao") return "atenção";
  return "favorável";
}

function levelText(level: WorkFactorLevel): string {
  return level === "favoravel" ? "favorável" : `em ${levelNoun(level)}`;
}

type FactorReading = { factorId: WorkFactorId; average: number; level: WorkFactorLevel };

function factorReadings(team: TeamSummary): FactorReading[] {
  return (team.factors ?? [])
    .filter((f) => isWorkFactorId(f.factorId) && f.average !== null && (f.respondents ?? 0) >= 5)
    .map((f) => ({
      factorId: f.factorId as WorkFactorId,
      average: f.average as number,
      level: workFactorLevel(f.average as number),
    }));
}

type Section = { title: string; lines: string[] };

export function buildMonthlyReportSections(input: {
  current: MonthlySummary;
  previous: MonthlySummary | null;
}): { sections: Section[]; hiddenTeams: number } {
  const { current, previous } = input;
  const sections: Section[] = [];

  const adhesionLines = [
    `${current.totalUsers} colaboradores participando${
      previous ? ` (${signed(current.totalUsers - previous.totalUsers)})` : ""
    }`,
    `${current.checkins.toLocaleString("pt-BR")} check-ins no mês · adesão média de ${current.adhesion}%${
      previous ? ` (era ${previous.adhesion}%)` : ""
    }`,
  ];
  sections.push({ title: "Adesão", lines: adhesionLines });

  const visible = current.teams.filter((t) => !t.hidden);
  const hiddenTeams = current.teams.length - visible.length;

  if (!current.companyMetricsAllowed) {
    sections.push({
      title: "Indicadores",
      lines: [
        "Ainda não há 5 colaboradores autorizando o compartilhamento com o RH. Os indicadores aparecem a partir daí.",
      ],
    });
    return { sections, hiddenTeams };
  }

  const flagged = visible
    .filter((t) => t.status === "attention" || t.status === "monitor")
    .sort(
      (a, b) =>
        STATUS_RANK[b.status ?? "stable"] - STATUS_RANK[a.status ?? "stable"] ||
        (b.negativeMoodPct ?? 0) - (a.negativeMoodPct ?? 0),
    );
  sections.push({
    title: "Equipes que pedem atenção",
    lines: flagged.length
      ? flagged.map(
          (t) =>
            `${t.name}: ${statusText(t.status)} · ${t.negativeMoodPct ?? 0}% dos check-ins com humor negativo`,
        )
      : ["Nenhuma equipe em atenção neste mês."],
  });

  const factorLines: string[] = [];
  const teamsWithFactors = visible
    .map((team) => ({
      team,
      readings: factorReadings(team)
        .filter((r) => r.level !== "favoravel")
        .sort((a, b) => LEVEL_RANK[b.level] - LEVEL_RANK[a.level] || a.average - b.average),
    }))
    .filter((entry) => entry.readings.length > 0)
    .sort(
      (a, b) =>
        LEVEL_RANK[b.readings[0].level] - LEVEL_RANK[a.readings[0].level] ||
        a.readings[0].average - b.readings[0].average,
    );
  for (const { team, readings } of teamsWithFactors) {
    const detail = readings
      .map((r) => `${FACTOR_SHORT[r.factorId]} ${levelText(r.level)} (${decimal(r.average)})`)
      .join(" · ");
    factorLines.push(`${team.name}: ${detail}`);
    if (readings[0].level === "risco") {
      factorLines.push(
        `Primeira ação sugerida para ${team.name}: ${workFactorGuide(readings[0].factorId).actions[0]}`,
      );
    }
  }
  if (factorLines.length) {
    factorLines.push('Todas as ações sugeridas estão no Painel RH, em "Como agir".');
  }
  sections.push({
    title: "Fatores de trabalho",
    lines: factorLines.length
      ? factorLines
      : ["Nenhum fator de trabalho em atenção ou risco neste mês."],
  });

  if (previous?.companyMetricsAllowed) {
    const before = new Map(previous.teams.filter((t) => !t.hidden).map((t) => [t.name, t]));
    const improved: string[] = [];
    for (const team of visible) {
      const old = before.get(team.name);
      if (!old) continue;
      const was = STATUS_RANK[old.status ?? "stable"];
      const now = STATUS_RANK[team.status ?? "stable"];
      if (now < was) {
        improved.push(
          `${team.name} saiu de "${statusText(old.status)}" para "${statusText(team.status)}".`,
        );
      }
      const oldFactors = new Map(factorReadings(old).map((r) => [r.factorId, r]));
      for (const reading of factorReadings(team)) {
        const prior = oldFactors.get(reading.factorId);
        if (prior && LEVEL_RANK[reading.level] < LEVEL_RANK[prior.level]) {
          improved.push(
            `${team.name}: ${FACTOR_SHORT[reading.factorId]} passou de ${levelNoun(prior.level)} para ${levelNoun(reading.level)}.`,
          );
        }
      }
    }
    if (improved.length) sections.push({ title: "O que melhorou", lines: improved });
  }

  return { sections, hiddenTeams };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const PRIVACY_FOOTER =
  "Dados agregados, sem identificação individual. Equipes com menos de 5 pessoas participando não aparecem.";

export function buildMonthlyReportEmail(input: {
  companyName: string;
  current: MonthlySummary;
  previous: MonthlySummary | null;
  panelUrl: string;
  profileUrl: string;
}): MonthlyReportEmail {
  const label = monthLabel(input.current.month);
  const title = label.charAt(0).toUpperCase() + label.slice(1);
  const subject = `${BRANDING.shortName} · Resumo de ${label} — ${input.companyName}`;
  const { sections, hiddenTeams } = buildMonthlyReportSections(input);
  const hiddenLine =
    hiddenTeams > 0
      ? `${hiddenTeams} ${hiddenTeams === 1 ? "equipe não aparece" : "equipes não aparecem"} porque ${
          hiddenTeams === 1 ? "tem" : "têm"
        } menos de 5 pessoas participando.`
      : null;

  const text = [
    `Resumo de ${label} — ${input.companyName}`,
    "",
    ...sections.flatMap((s) => [s.title, ...s.lines.map((l) => `- ${l}`), ""]),
    ...(hiddenLine ? [hiddenLine, ""] : []),
    `Abrir o Painel RH: ${input.panelUrl}`,
    "",
    PRIVACY_FOOTER,
    `Para deixar de receber este resumo, desative a opção no seu perfil: ${input.profileUrl}`,
    BRANDING.poweredBy,
  ].join("\n");

  const sectionHtml = sections
    .map(
      (s) => `
          <tr>
            <td style="padding:18px 0 6px;font-family:Quicksand,Segoe UI,sans-serif;font-size:15px;font-weight:700;color:#4A6A8A;">${escapeHtml(s.title)}</td>
          </tr>
          <tr>
            <td style="font-size:14px;line-height:1.6;color:#3D4A5C;">
              <ul style="margin:0;padding-left:18px;">
                ${s.lines.map((l) => `<li style="margin:0 0 4px;">${escapeHtml(l)}</li>`).join("")}
              </ul>
            </td>
          </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0;padding:0;background:#F3EEE1;font-family:Nunito Sans,Segoe UI,sans-serif;color:#3D4A5C;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F3EEE1;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:20px;padding:32px 28px;box-shadow:0 8px 24px rgba(74,106,138,0.1);">
          <tr>
            <td style="border-left:3px solid #E5987D;padding:2px 0 2px 14px;">
              <div style="font-family:Quicksand,Segoe UI,sans-serif;font-size:22px;font-weight:700;color:#4D332D;">${escapeHtml(BRANDING.appName)}</div>
              <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#7E8E72;font-weight:700;padding-top:6px;">Resumo mensal do RH · confidencial</div>
              <div style="font-size:18px;font-weight:700;color:#4D332D;padding-top:4px;">${escapeHtml(title)} — ${escapeHtml(input.companyName)}</div>
            </td>
          </tr>${sectionHtml}
          ${
            hiddenLine
              ? `<tr><td style="padding-top:14px;font-size:13px;color:#6B7C8F;">${escapeHtml(hiddenLine)}</td></tr>`
              : ""
          }
          <tr>
            <td align="center" style="padding:26px 0 20px;">
              <a href="${escapeHtml(input.panelUrl)}" style="display:inline-block;background:linear-gradient(135deg,#99BEE5,#C5D9F1);color:#253654;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:999px;font-size:15px;">
                Abrir o Painel RH
              </a>
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid #E8DED3;padding-top:14px;font-size:12px;line-height:1.5;color:#8A96A3;">
              ${escapeHtml(PRIVACY_FOOTER)}<br/>
              Para deixar de receber este resumo, desative a opção no seu <a href="${escapeHtml(input.profileUrl)}" style="color:#4A6A8A;">perfil</a>.<br/>
              ${escapeHtml(BRANDING.poweredBy)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}
