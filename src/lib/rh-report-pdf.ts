import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import type { RhDashboardData } from "@/lib/api/manager.server";
import { BRANDING } from "@/lib/branding";
import logoUrl from "@/assets/logo.png";
import {
  buildReportPreview,
  reportTypeLabel,
  type ReportPreviousSnapshot,
  type ReportType,
} from "@/lib/rh-reports";

export type RhReportPdfInput = {
  reportType: ReportType;
  periodDays: number;
  teamName: string | null;
  current: RhDashboardData;
  previous: ReportPreviousSnapshot | null;
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

export function buildRhReportPdfDefinition(
  input: RhReportPdfInput,
  logoDataUrl: string | null,
): TDocumentDefinitions {
  const preview = buildReportPreview(input);
  const generatedAt = new Date().toLocaleString("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  });
  const title = reportTypeLabel(input.reportType);

  const content: Content[] = [
    {
      columns: [
        logoDataUrl
          ? { image: "logo", width: 42, margin: [0, 0, 12, 0] }
          : { text: "", width: 0 },
        {
          stack: [
            { text: BRANDING.shortName, style: "brandTitle" },
            { text: title, style: "brandSubtitle" },
            { text: "CONFIDENCIAL — uso interno", style: "confidential" },
          ],
        },
      ],
      margin: [0, 0, 0, 16],
    },
    {
      text: `Gerado em ${generatedAt}${input.exportedBy ? ` · ${input.exportedBy}` : ""}`,
      style: "muted",
      margin: [0, 0, 0, 4],
    },
    {
      text: `Período: últimos ${input.periodDays} dias · ${input.teamName ? `Equipe: ${input.teamName}` : "Todas as equipes"}`,
      style: "muted",
      margin: [0, 0, 0, 12],
    },
    { text: "Indicadores", style: "h2" },
  ];

  const kpiBody: Content[][] = [
    [
      { text: "Indicador", style: "th" },
      { text: "Valor", style: "th" },
      { text: "Detalhe", style: "th" },
    ],
  ];
  for (const kpi of preview.kpis) {
    kpiBody.push([
      { text: kpi.label, style: "cell" },
      { text: kpi.value, style: "cellValue" },
      { text: kpi.hint ?? "—", style: "cell" },
    ]);
  }
  content.push({
    table: {
      headerRows: 1,
      widths: ["*", 80, "*"],
      body: kpiBody,
    },
    layout: {
      hLineColor: () => BRAND.line,
      vLineColor: () => BRAND.line,
      paddingLeft: () => 6,
      paddingRight: () => 6,
      paddingTop: () => 5,
      paddingBottom: () => 5,
    },
    margin: [0, 0, 0, 14],
  });

  content.push({ text: "Detalhamento", style: "h2" });
  const tableBody: Content[][] = [
    preview.table.headers.map((h) => ({ text: h, style: "th" })),
  ];
  for (const row of preview.table.rows) {
    tableBody.push(row.map((cell) => ({ text: cell, style: "cell" })));
  }
  const colCount = Math.max(preview.table.headers.length, 1);
  content.push({
    table: {
      headerRows: 1,
      widths: Array.from({ length: colCount }, () => "*"),
      body: tableBody,
    },
    layout: {
      hLineColor: () => BRAND.line,
      vLineColor: () => BRAND.line,
      paddingLeft: () => 5,
      paddingRight: () => 5,
      paddingTop: () => 4,
      paddingBottom: () => 4,
    },
    margin: [0, 0, 0, 14],
  });

  content.push({ text: "Notas e privacidade", style: "h2" });
  for (const note of preview.notes) {
    content.push({ text: `• ${note}`, style: "body", margin: [0, 0, 0, 3] });
  }
  content.push({
    text: "Este relatório não inclui humor individual, diário, chat ou identificadores sensíveis.",
    style: "warning",
    margin: [0, 10, 0, 0],
  });

  return {
    info: {
      title: `${title} — ${BRANDING.shortName}`,
      author: BRANDING.shortName,
      subject: "Relatório RH agregado",
    },
    pageMargins: [40, 48, 40, 48],
    watermark: {
      text: "CONFIDENCIAL",
      color: BRAND.line,
      opacity: 0.12,
      bold: true,
      angle: -30,
    },
    header: (currentPage) => ({
      margin: [40, 16, 40, 0],
      columns: [
        { text: currentPage === 1 ? "" : BRANDING.shortName, style: "headerLeft" },
        {
          text: currentPage === 1 ? "" : title,
          alignment: "right",
          style: "headerRight",
        },
      ],
    }),
    footer: (currentPage, pageCount) => ({
      margin: [40, 0, 40, 20],
      columns: [
        { text: `${BRANDING.poweredBy} · Uso interno`, style: "footer" },
        {
          text: `Página ${currentPage} de ${pageCount}`,
          alignment: "right",
          style: "footer",
        },
      ],
    }),
    content,
    styles: {
      brandTitle: { fontSize: 16, bold: true, color: BRAND.title },
      brandSubtitle: { fontSize: 12, bold: true, color: BRAND.title, margin: [0, 2, 0, 0] },
      confidential: { fontSize: 9, bold: true, color: BRAND.danger, characterSpacing: 1 },
      h2: { fontSize: 13, bold: true, color: BRAND.title, margin: [0, 4, 0, 8] },
      body: { fontSize: 9, color: BRAND.title, lineHeight: 1.3 },
      muted: { fontSize: 8, color: BRAND.muted },
      warning: { fontSize: 9, color: BRAND.danger, italics: true },
      th: { fontSize: 8, bold: true, color: BRAND.title },
      cell: { fontSize: 8, color: BRAND.title },
      cellValue: { fontSize: 9, bold: true, color: BRAND.title },
      headerLeft: { fontSize: 8, color: BRAND.muted },
      headerRight: { fontSize: 8, color: BRAND.muted },
      footer: { fontSize: 7.5, color: BRAND.muted },
    },
    defaultStyle: { font: "Roboto", fontSize: 9, color: BRAND.title },
    images: logoDataUrl ? { logo: logoDataUrl } : {},
  };
}

export async function downloadRhReportPdf(input: RhReportPdfInput): Promise<void> {
  const pdfMakeMod = await import("pdfmake/build/pdfmake");
  const pdfFontsMod = await import("pdfmake/build/vfs_fonts");
  const pdfMake = (pdfMakeMod.default ?? pdfMakeMod) as {
    addVirtualFileSystem: (vfs: unknown) => void;
    createPdf: (doc: TDocumentDefinitions) => { download: (name?: string) => void };
  };
  const fonts = pdfFontsMod.default ?? pdfFontsMod;
  pdfMake.addVirtualFileSystem(fonts);

  const logoDataUrl = await loadLogoDataUrl();
  const definition = buildRhReportPdfDefinition(input, logoDataUrl);
  const slug = input.reportType;
  const fileName = `relatorio-rh-${slug}-${new Date().toISOString().slice(0, 10)}.pdf`;
  pdfMake.createPdf(definition).download(fileName);
}
