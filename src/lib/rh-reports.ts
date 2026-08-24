import type { RhAlert, RhDashboardData, RhTeamMetrics } from "@/lib/api/manager.server";

export const REPORT_PERIODS = [7, 14, 30, 90] as const;
export type ReportPeriodDays = (typeof REPORT_PERIODS)[number];

export const REPORT_TYPES = [
  "adhesion",
  "teams",
  "trends",
  "alerts",
  "comparison",
] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export const REPORT_CATALOG: Array<{
  id: ReportType;
  title: string;
  description: string;
  icon: string;
}> = [
  {
    id: "adhesion",
    title: "Adesão e participação",
    description: "Colaboradores com opt-in, check-ins e adesão no período",
    icon: "trending_up",
  },
  {
    id: "teams",
    title: "Status por equipe",
    description: "Membros, status e métricas agregadas por equipe",
    icon: "groups",
  },
  {
    id: "trends",
    title: "Tendências",
    description: "Evolução diária de humor, sono e hidratação agregados",
    icon: "show_chart",
  },
  {
    id: "alerts",
    title: "Alertas do período",
    description: "Sinais de atenção gerados a partir dos indicadores",
    icon: "warning",
  },
  {
    id: "comparison",
    title: "Comparativo de períodos",
    description: "Período atual versus o intervalo anterior equivalente",
    icon: "compare_arrows",
  },
];

export type ReportPreviousSnapshot = {
  totalUsers: number;
  checkinsThisWeek: number;
  weeklyAdhesion: number;
  alertsCount: number;
  teamCount: number;
};

export type ReportPreviewKpi = { label: string; value: string; hint?: string };

export type ReportPreviewTable = {
  headers: string[];
  rows: string[][];
};

export type ReportPreview = {
  title: string;
  kpis: ReportPreviewKpi[];
  table: ReportPreviewTable;
  notes: string[];
};

export function filterDashboardByTeam(
  data: RhDashboardData,
  teamName: string | null | undefined,
): RhDashboardData {
  const name = teamName?.trim();
  if (!name) return data;

  const teams = data.teams.filter((t) => t.name === name);
  const alerts = data.alerts.filter((a) => a.team === name);
  const team = teams[0];
  return {
    ...data,
    teams,
    alerts,
    totalUsers: team ? team.memberCount : 0,
    // Tendências e adesão agregada da RPC são da empresa; mantemos com recorte de equipes/alertas.
  };
}

export function statusLabelPt(status: RhTeamMetrics["status"]): string {
  if (status === "attention") return "Atenção";
  if (status === "monitor") return "Monitorar";
  return "Estável";
}

export function severityLabelPt(severity: RhAlert["severity"]): string {
  if (severity === "high") return "Alta";
  if (severity === "medium") return "Média";
  return "Baixa";
}

function deltaLabel(current: number, previous: number, suffix = ""): string {
  const d = current - previous;
  const sign = d > 0 ? "+" : "";
  return `${sign}${d}${suffix}`;
}

export function buildReportPreview(input: {
  reportType: ReportType;
  periodDays: number;
  teamName: string | null;
  current: RhDashboardData;
  previous: ReportPreviousSnapshot | null;
}): ReportPreview {
  const { reportType, periodDays, teamName, current, previous } = input;
  const scopeNote = teamName ? `Equipe: ${teamName}` : "Todas as equipes";
  const notes = [
    scopeNote,
    `Período: últimos ${periodDays} dias`,
    "Dados agregados com opt-in RH. Sem humor individual, diário ou chat.",
  ];
  if (teamName && (reportType === "adhesion" || reportType === "trends" || reportType === "comparison")) {
    notes.push(
      "Com filtro de equipe: membros e alertas são do recorte; adesão/tendências diárias vêm do agregado da empresa (limitação da API).",
    );
  }

  if (reportType === "adhesion") {
    return {
      title: "Adesão e participação",
      kpis: [
        { label: "Colaboradores (opt-in)", value: String(current.totalUsers) },
        { label: "Check-ins no período", value: String(current.checkinsThisWeek) },
        { label: "Adesão", value: `${current.weeklyAdhesion}%` },
        { label: "Check-ins hoje", value: String(current.checkinsToday) },
      ],
      table: {
        headers: ["Indicador", "Valor"],
        rows: [
          ["Colaboradores com opt-in RH", String(current.totalUsers)],
          ["Check-ins no período", String(current.checkinsThisWeek)],
          ["Adesão estimada", `${current.weeklyAdhesion}%`],
          ["Check-ins hoje", String(current.checkinsToday)],
          ["Equipes no recorte", String(current.teams.length)],
        ],
      },
      notes,
    };
  }

  if (reportType === "teams") {
    return {
      title: "Status por equipe",
      kpis: [
        { label: "Equipes", value: String(current.teams.length) },
        {
          label: "Em atenção",
          value: String(current.teams.filter((t) => t.status === "attention").length),
        },
        {
          label: "Monitorar",
          value: String(current.teams.filter((t) => t.status === "monitor").length),
        },
        {
          label: "Estáveis",
          value: String(current.teams.filter((t) => t.status === "stable").length),
        },
      ],
      table: {
        headers: ["Equipe", "Membros", "Status", "Humor", "Sono", "Água", "Negativos"],
        rows: current.teams.map((t) =>
          t.metricsHidden
            ? [t.name, String(t.memberCount), "Oculto (k-anonimato)", "—", "—", "—", "—"]
            : [
                t.name,
                String(t.memberCount),
                statusLabelPt(t.status),
                `${t.avgMood}/5`,
                `${t.avgSleep}h`,
                `${t.avgWater}ml`,
                `${t.negativeMoodPct}%`,
              ],
        ),
      },
      notes,
    };
  }

  if (reportType === "trends") {
    const trends = current.trends.slice(-14);
    return {
      title: "Tendências",
      kpis: [
        { label: "Dias com dado", value: String(current.trends.length) },
        {
          label: "Humor médio (último dia)",
          value: trends.length ? String(trends[trends.length - 1].avgMood) : "—",
        },
        {
          label: "Sono médio (último dia)",
          value: trends.length ? `${trends[trends.length - 1].avgSleep}h` : "—",
        },
        {
          label: "Check-ins (último dia)",
          value: trends.length ? String(trends[trends.length - 1].checkinCount) : "—",
        },
      ],
      table: {
        headers: ["Data", "Humor", "Sono (h)", "Água (ml)", "Check-ins"],
        rows:
          trends.length === 0
            ? [["—", "—", "—", "—", "—"]]
            : trends.map((t) => [
                t.date,
                String(t.avgMood),
                String(t.avgSleep),
                String(t.avgWater),
                String(t.checkinCount),
              ]),
      },
      notes: [...notes, "Prévia mostra até os últimos 14 dias do período."],
    };
  }

  if (reportType === "alerts") {
    return {
      title: "Alertas do período",
      kpis: [
        { label: "Alertas", value: String(current.alerts.length) },
        {
          label: "Alta",
          value: String(current.alerts.filter((a) => a.severity === "high").length),
        },
        {
          label: "Média",
          value: String(current.alerts.filter((a) => a.severity === "medium").length),
        },
        {
          label: "Baixa",
          value: String(current.alerts.filter((a) => a.severity === "low").length),
        },
      ],
      table: {
        headers: ["Equipe", "Tipo", "Severidade", "Mensagem"],
        rows:
          current.alerts.length === 0
            ? [["—", "—", "—", "Nenhum alerta no recorte"]]
            : current.alerts.map((a) => [a.team, a.type, severityLabelPt(a.severity), a.message]),
      },
      notes,
    };
  }

  // comparison
  const prev = previous ?? {
    totalUsers: 0,
    checkinsThisWeek: 0,
    weeklyAdhesion: 0,
    alertsCount: 0,
    teamCount: 0,
  };
  return {
    title: "Comparativo de períodos",
    kpis: [
      {
        label: "Adesão",
        value: `${current.weeklyAdhesion}%`,
        hint: `Δ ${deltaLabel(current.weeklyAdhesion, prev.weeklyAdhesion, " pp")}`,
      },
      {
        label: "Check-ins",
        value: String(current.checkinsThisWeek),
        hint: `Δ ${deltaLabel(current.checkinsThisWeek, prev.checkinsThisWeek)}`,
      },
      {
        label: "Alertas",
        value: String(current.alerts.length),
        hint: `Δ ${deltaLabel(current.alerts.length, prev.alertsCount)}`,
      },
      {
        label: "Equipes",
        value: String(current.teams.length),
        hint: `Δ ${deltaLabel(current.teams.length, prev.teamCount)}`,
      },
    ],
    table: {
      headers: ["Indicador", "Atual", "Anterior", "Variação"],
      rows: [
        [
          "Colaboradores (opt-in)",
          String(current.totalUsers),
          String(prev.totalUsers),
          deltaLabel(current.totalUsers, prev.totalUsers),
        ],
        [
          "Check-ins no período",
          String(current.checkinsThisWeek),
          String(prev.checkinsThisWeek),
          deltaLabel(current.checkinsThisWeek, prev.checkinsThisWeek),
        ],
        [
          "Adesão %",
          String(current.weeklyAdhesion),
          String(prev.weeklyAdhesion),
          deltaLabel(current.weeklyAdhesion, prev.weeklyAdhesion),
        ],
        [
          "Alertas",
          String(current.alerts.length),
          String(prev.alertsCount),
          deltaLabel(current.alerts.length, prev.alertsCount),
        ],
        [
          "Equipes no recorte",
          String(current.teams.length),
          String(prev.teamCount),
          deltaLabel(current.teams.length, prev.teamCount),
        ],
      ],
    },
    notes: [
      ...notes,
      `Comparado com os ${periodDays} dias imediatamente anteriores (via tendências diárias).`,
      "Contagem de alertas do período anterior não está disponível na API atual.",
    ],
  };
}

function csvEscape(value: string | number): string {
  const raw = String(value);
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

export function buildReportCsv(input: {
  reportType: ReportType;
  periodDays: number;
  teamName: string | null;
  current: RhDashboardData;
  previous: ReportPreviousSnapshot | null;
}): string {
  const preview = buildReportPreview(input);
  const meta = [
    `# ${preview.title}`,
    `# periodo_dias=${input.periodDays}`,
    `# equipe=${input.teamName ?? "todas"}`,
    `# gerado_em=${new Date().toISOString()}`,
  ];
  const header = preview.table.headers.map(csvEscape).join(",");
  const rows = preview.table.rows.map((row) => row.map(csvEscape).join(","));
  return [...meta, header, ...rows].join("\n");
}

export function snapshotFromDashboard(data: RhDashboardData): ReportPreviousSnapshot {
  return {
    totalUsers: data.totalUsers,
    checkinsThisWeek: data.checkinsThisWeek,
    weeklyAdhesion: data.weeklyAdhesion,
    alertsCount: data.alerts.length,
    teamCount: data.teams.length,
  };
}

/** Deriva o intervalo anterior a partir de um dashboard com ~2× o período (via trends). */
export function snapshotFromTrendWindows(
  doublePeriod: RhDashboardData,
  periodDays: number,
): ReportPreviousSnapshot {
  const sorted = [...doublePeriod.trends].sort((a, b) => a.date.localeCompare(b.date));
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const toIso = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const currentStart = new Date(today);
  currentStart.setDate(currentStart.getDate() - periodDays);
  const previousStart = new Date(today);
  previousStart.setDate(previousStart.getDate() - periodDays * 2);

  const currentStartIso = toIso(currentStart);
  const previousStartIso = toIso(previousStart);

  const previousTrends = sorted.filter(
    (t) => t.date >= previousStartIso && t.date < currentStartIso,
  );
  const checkins = previousTrends.reduce((sum, t) => sum + t.checkinCount, 0);
  const users = Math.max(doublePeriod.totalUsers, 1);
  const adhesion = Math.min(100, Math.round((checkins / (users * periodDays)) * 100));

  return {
    totalUsers: doublePeriod.totalUsers,
    checkinsThisWeek: checkins,
    weeklyAdhesion: Number.isFinite(adhesion) ? adhesion : 0,
    alertsCount: 0,
    teamCount: doublePeriod.teams.length,
  };
}

export function reportTypeLabel(type: ReportType): string {
  return REPORT_CATALOG.find((r) => r.id === type)?.title ?? type;
}
