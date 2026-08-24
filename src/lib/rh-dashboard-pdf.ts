import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import type { RhDashboardData } from "@/lib/api/manager.server";
import { BRANDING } from "@/lib/branding";
import logoUrl from "@/assets/logo.png";

export type RhDashboardPdfInput = {
  data: RhDashboardData;
  moodPeriodDays: number;
  moodPeriodDistribution: Record<string, number>;
  exportedBy?: string | null;
};

const BRAND = {
  title: "#2F4A66",
  muted: "#6B7C8F",
  line: "#C5D9F1",
  accent: "#99BEE5",
  soft: "#F3EEE1",
  white: "#FFFFFF",
  danger: "#B45309",
};

function statusLabel(status: string): string {
  if (status === "attention") return "Atenção";
  if (status === "monitor") return "Monitorar";
  return "Estável";
}

function severityLabel(severity: string): string {
  if (severity === "high") return "Alta";
  if (severity === "medium") return "Média";
  return "Baixa";
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function sumDist(dist: Record<string, number>): number {
  return Object.values(dist).reduce((s, n) => s + (Number(n) || 0), 0);
}

function moodRows(dist: Record<string, number>): Array<[string, string, string]> {
  const total = sumDist(dist) || 1;
  const entries = Object.entries(dist)
    .filter(([, n]) => Number(n) > 0)
    .sort((a, b) => Number(b[1]) - Number(a[1]));
  if (entries.length === 0) return [["—", "0", "0%"]];
  return entries.map(([mood, count]) => [
    mood.charAt(0).toUpperCase() + mood.slice(1),
    String(count),
    `${Math.round((Number(count) / total) * 100)}%`,
  ]);
}

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch(logoUrl);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export function buildRhDashboardPdfDefinition(
  input: RhDashboardPdfInput,
  logoDataUrl: string | null,
): TDocumentDefinitions {
  const { data, moodPeriodDays, moodPeriodDistribution, exportedBy } = input;
  const generatedAt = new Date().toLocaleString("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  });

  const kpis = [
    ["Colaboradores (opt-in RH)", String(data.totalUsers)],
    ["Check-ins hoje", String(data.checkinsToday)],
    ["Check-ins (7 dias)", String(data.checkinsThisWeek)],
    ["Adesão semanal", `${data.weeklyAdhesion}%`],
    ["Alertas ativos", String(data.alerts.length)],
  ];

  const teamBody: Content[][] = [
    [
      { text: "Equipe", style: "th" },
      { text: "Membros", style: "th" },
      { text: "Status", style: "th" },
      { text: "Humor", style: "th" },
      { text: "Sono", style: "th" },
      { text: "Água", style: "th" },
      { text: "Negativos", style: "th" },
    ],
  ];

  for (const team of data.teams) {
    if (team.metricsHidden) {
      teamBody.push([
        team.name,
        String(team.memberCount),
        "Oculto (k-anonimato)",
        "—",
        "—",
        "—",
        "—",
      ]);
    } else {
      teamBody.push([
        team.name,
        String(team.memberCount),
        statusLabel(team.status),
        `${team.avgMood}/5`,
        `${team.avgSleep} h`,
        `${team.avgWater} ml`,
        `${team.negativeMoodPct}%`,
      ]);
    }
  }

  const trendSlice = [...data.trends].slice(-14);
  const trendBody: Content[][] = [
    [
      { text: "Data", style: "th" },
      { text: "Humor médio", style: "th" },
      { text: "Sono (h)", style: "th" },
      { text: "Água (ml)", style: "th" },
      { text: "Check-ins", style: "th" },
    ],
  ];
  if (trendSlice.length === 0) {
    trendBody.push(["—", "—", "—", "—", "—"]);
  } else {
    for (const row of trendSlice) {
      trendBody.push([
        formatDate(row.date),
        String(row.avgMood),
        String(row.avgSleep),
        String(row.avgWater),
        String(row.checkinCount),
      ]);
    }
  }

  const mood7 = moodRows(data.moodDistribution7d ?? data.moodDistribution ?? {});
  const moodPeriod = moodRows(moodPeriodDistribution);

  const content: Content[] = [
    {
      columns: [
        logoDataUrl
          ? { image: "logo", width: 42, margin: [0, 0, 12, 0] }
          : { width: 42, text: "" },
        {
          width: "*",
          stack: [
            { text: BRANDING.appName, style: "brandTitle" },
            { text: "Relatório executivo — Painel RH", style: "brandSubtitle" },
            { text: BRANDING.tagline, style: "muted", margin: [0, 2, 0, 0] },
          ],
        },
        {
          width: "auto",
          alignment: "right",
          stack: [
            { text: "CONFIDENCIAL", style: "confidential" },
            { text: generatedAt, style: "muted", margin: [0, 4, 0, 0] },
          ],
        },
      ],
      columnGap: 8,
      margin: [0, 0, 0, 12],
    },
    {
      canvas: [
        {
          type: "rect",
          x: 0,
          y: 0,
          w: 515,
          h: 3,
          color: BRAND.accent,
        },
      ],
      margin: [0, 0, 0, 16],
    },
    {
      text: "1. Indicadores gerais",
      style: "h2",
    },
    {
      text: "Valores refletidos na tela do Painel RH no momento da exportação. Indicadores de bem-estar só incluem colaboradores com opt-in ao RH.",
      style: "muted",
      margin: [0, 0, 0, 8],
    },
    {
      table: {
        widths: ["*", "auto"],
        body: kpis.map(([label, value]) => [
          { text: label, style: "cell" },
          { text: value, style: "cellValue", alignment: "right" },
        ]),
      },
      layout: {
        fillColor: (row) => (row % 2 === 0 ? BRAND.soft : BRAND.white),
        hLineColor: () => BRAND.line,
        vLineColor: () => BRAND.line,
        paddingLeft: () => 8,
        paddingRight: () => 8,
        paddingTop: () => 6,
        paddingBottom: () => 6,
      },
      margin: [0, 0, 0, 16],
    },
  ];

  if (data.totalUsers > 0 && data.totalUsers < 5) {
    content.push({
      text: "Aviso: com menos de 5 colaboradores com opt-in RH, parte dos indicadores permanece oculta por k-anonimato.",
      style: "warning",
      margin: [0, 0, 0, 14],
    });
  }

  content.push({ text: "2. Alertas", style: "h2" });
  if (data.alerts.length === 0) {
    content.push({
      text: "Nenhum alerta ativo no momento da exportação.",
      style: "muted",
      margin: [0, 0, 0, 14],
    });
  } else {
    content.push({
      ul: data.alerts.map(
        (a) => `${a.team} · ${severityLabel(a.severity)} · ${a.message}`,
      ),
      style: "body",
      margin: [0, 0, 0, 14],
    });
  }

  content.push({ text: "3. Equipes", style: "h2" });
  content.push({
    table: {
      headerRows: 1,
      widths: ["*", 42, 70, 40, 40, 45, 50],
      body: teamBody,
    },
    layout: {
      fillColor: (row) => (row === 0 ? BRAND.accent : row % 2 === 0 ? BRAND.soft : BRAND.white),
      hLineColor: () => BRAND.line,
      vLineColor: () => BRAND.line,
      paddingLeft: () => 6,
      paddingRight: () => 6,
      paddingTop: () => 5,
      paddingBottom: () => 5,
    },
    margin: [0, 0, 0, 16],
  });

  content.push({
    text: "4. Tendências (últimos 14 dias exibidos do recorte de 30 dias)",
    style: "h2",
  });
  content.push({
    table: {
      headerRows: 1,
      widths: ["*", 70, 60, 60, 55],
      body: trendBody,
    },
    layout: {
      fillColor: (row) => (row === 0 ? BRAND.accent : row % 2 === 0 ? BRAND.soft : BRAND.white),
      hLineColor: () => BRAND.line,
      vLineColor: () => BRAND.line,
      paddingLeft: () => 6,
      paddingRight: () => 6,
      paddingTop: () => 5,
      paddingBottom: () => 5,
    },
    margin: [0, 0, 0, 16],
  });

  content.push({ text: "5. Distribuição de humor", style: "h2" });
  content.push({
    columns: [
      {
        width: "*",
        stack: [
          { text: "Últimos 7 dias", style: "h3", margin: [0, 0, 0, 6] },
          {
            table: {
              headerRows: 1,
              widths: ["*", 40, 40],
              body: [
                [
                  { text: "Humor", style: "th" },
                  { text: "Qtd", style: "th" },
                  { text: "%", style: "th" },
                ],
                ...mood7.map((row) => row.map((cell) => ({ text: cell, style: "cell" }))),
              ],
            },
            layout: {
              fillColor: (row) => (row === 0 ? BRAND.accent : null),
              hLineColor: () => BRAND.line,
              vLineColor: () => BRAND.line,
              paddingLeft: () => 5,
              paddingRight: () => 5,
              paddingTop: () => 4,
              paddingBottom: () => 4,
            },
          },
        ],
      },
      { width: 12, text: "" },
      {
        width: "*",
        stack: [
          {
            text: `Período selecionado (${moodPeriodDays} dias)`,
            style: "h3",
            margin: [0, 0, 0, 6],
          },
          {
            table: {
              headerRows: 1,
              widths: ["*", 40, 40],
              body: [
                [
                  { text: "Humor", style: "th" },
                  { text: "Qtd", style: "th" },
                  { text: "%", style: "th" },
                ],
                ...moodPeriod.map((row) => row.map((cell) => ({ text: cell, style: "cell" }))),
              ],
            },
            layout: {
              fillColor: (row) => (row === 0 ? BRAND.accent : null),
              hLineColor: () => BRAND.line,
              vLineColor: () => BRAND.line,
              paddingLeft: () => 5,
              paddingRight: () => 5,
              paddingTop: () => 4,
              paddingBottom: () => 4,
            },
          },
        ],
      },
    ],
    margin: [0, 0, 0, 18],
  });

  content.push({
    text: "Notas de privacidade",
    style: "h2",
  });
  content.push({
    ul: [
      "Este relatório não inclui humor individual, diário, conversas do companion ou dados identificáveis de check-in.",
      "Métricas por equipe respeitam k-anonimato (mínimo de 5 pessoas com opt-in RH).",
      "Documento destinado exclusivamente ao uso interno do RH autorizado.",
    ],
    style: "body",
    margin: [0, 0, 0, 8],
  });

  if (exportedBy) {
    content.push({
      text: `Exportado por: ${exportedBy}`,
      style: "muted",
      margin: [0, 8, 0, 0],
    });
  }

  const doc: TDocumentDefinitions = {
    info: {
      title: `Relatório RH — ${BRANDING.shortName}`,
      author: BRANDING.appName,
      subject: "Painel RH — indicadores agregados de bem-estar",
      keywords: "RH, bem-estar, Mundo Mental Care",
      creator: BRANDING.appName,
    },
    pageSize: "A4",
    pageMargins: [40, 56, 40, 56],
    watermark: {
      text: BRANDING.shortName.toUpperCase(),
      color: BRAND.accent,
      opacity: 0.07,
      bold: true,
      italics: false,
      angle: -28,
      fontSize: 42,
    },
    header: (currentPage) => ({
      margin: [40, 16, 40, 0],
      columns: [
        {
          text: currentPage === 1 ? "" : BRANDING.shortName,
          style: "headerLeft",
        },
        {
          text: currentPage === 1 ? "" : "Relatório Painel RH",
          alignment: "right",
          style: "headerRight",
        },
      ],
    }),
    footer: (currentPage, pageCount) => ({
      margin: [40, 0, 40, 20],
      stack: [
        {
          canvas: [
            {
              type: "line",
              x1: 0,
              y1: 0,
              x2: 515,
              y2: 0,
              lineWidth: 0.8,
              lineColor: BRAND.line,
            },
          ],
          margin: [0, 0, 0, 8],
        },
        {
          columns: [
            {
              text: `${BRANDING.poweredBy} · Uso interno e confidencial`,
              style: "footer",
            },
            {
              text: `Página ${currentPage} de ${pageCount}`,
              alignment: "right",
              style: "footer",
            },
          ],
        },
      ],
    }),
    content,
    styles: {
      brandTitle: { fontSize: 16, bold: true, color: BRAND.title },
      brandSubtitle: { fontSize: 12, bold: true, color: BRAND.title, margin: [0, 2, 0, 0] },
      confidential: { fontSize: 9, bold: true, color: BRAND.danger, characterSpacing: 1 },
      h2: { fontSize: 13, bold: true, color: BRAND.title, margin: [0, 4, 0, 8] },
      h3: { fontSize: 10, bold: true, color: BRAND.title },
      body: { fontSize: 9, color: BRAND.title, lineHeight: 1.3 },
      muted: { fontSize: 8, color: BRAND.muted },
      warning: {
        fontSize: 9,
        color: BRAND.danger,
        italics: true,
      },
      th: { fontSize: 8, bold: true, color: BRAND.title },
      cell: { fontSize: 8, color: BRAND.title },
      cellValue: { fontSize: 9, bold: true, color: BRAND.title },
      headerLeft: { fontSize: 8, color: BRAND.muted },
      headerRight: { fontSize: 8, color: BRAND.muted },
      footer: { fontSize: 7.5, color: BRAND.muted },
    },
    defaultStyle: {
      font: "Roboto",
      fontSize: 9,
      color: BRAND.title,
    },
    images: logoDataUrl ? { logo: logoDataUrl } : {},
  };

  return doc;
}

export async function downloadRhDashboardPdf(input: RhDashboardPdfInput): Promise<void> {
  const pdfMakeMod = await import("pdfmake/build/pdfmake");
  const pdfFontsMod = await import("pdfmake/build/vfs_fonts");
  const pdfMake = (pdfMakeMod.default ?? pdfMakeMod) as {
    addVirtualFileSystem: (vfs: unknown) => void;
    createPdf: (doc: TDocumentDefinitions) => { download: (name?: string) => void };
  };
  const fonts = pdfFontsMod.default ?? pdfFontsMod;
  pdfMake.addVirtualFileSystem(fonts);

  const logoDataUrl = await loadLogoDataUrl();
  const definition = buildRhDashboardPdfDefinition(input, logoDataUrl);
  const fileName = `relatorio-rh-${new Date().toISOString().slice(0, 10)}.pdf`;
  pdfMake.createPdf(definition).download(fileName);
}
