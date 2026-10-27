import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import type { RhDashboardData } from "@/lib/api/manager.server";
import { BRANDING } from "@/lib/branding";
import {
  PDF_COLORS as BRAND,
  PDF_PAGE_MARGINS,
  ZELLU_PDF_STYLES,
  zelluPdfBackground,
  zelluPdfFooter,
  zelluPdfHeader,
  zelluTableLayout,
  zelluTitleBlock,
} from "@/lib/pdf/zellu-pdf-theme";
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

export function buildRhReportPdfDefinition(input: RhReportPdfInput): TDocumentDefinitions {
  const preview = buildReportPreview(input);
  const generatedAt = new Date().toLocaleString("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  });
  const title = reportTypeLabel(input.reportType);

  const content: Content[] = [
    zelluTitleBlock({
      eyebrow: "Relatórios RH · Confidencial",
      title,
      meta: [
        `Período: últimos ${input.periodDays} dias · ${input.teamName ? `Equipe: ${input.teamName}` : "Todas as equipes"}`,
        `Gerado em ${generatedAt}${input.exportedBy ? ` · Exportado por ${input.exportedBy}` : ""}`,
      ],
    }),
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
    layout: zelluTableLayout(),
    margin: [0, 0, 0, 14],
  });

  content.push({ text: "Detalhamento", style: "h2" });
  const tableBody: Content[][] = [preview.table.headers.map((h) => ({ text: h, style: "th" }))];
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
    layout: zelluTableLayout({ padding: 5 }),
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
    pageSize: "A4",
    pageMargins: PDF_PAGE_MARGINS,
    background: zelluPdfBackground,
    header: zelluPdfHeader(`${title} · Relatórios RH`),
    footer: zelluPdfFooter,
    content,
    styles: {
      ...ZELLU_PDF_STYLES,
      h2: { fontSize: 13, bold: true, color: BRAND.title, margin: [0, 4, 0, 8] },
      body: { fontSize: 9, color: BRAND.title, lineHeight: 1.3 },
      muted: { fontSize: 8, color: BRAND.muted },
      warning: { fontSize: 9, color: BRAND.danger, italics: true },
      th: { fontSize: 8, bold: true, color: BRAND.title },
      cell: { fontSize: 8, color: BRAND.title },
      cellValue: { fontSize: 9, bold: true, color: BRAND.title },
    },
    defaultStyle: { font: "Roboto", fontSize: 9, color: BRAND.title },
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

  const definition = buildRhReportPdfDefinition(input);
  const slug = input.reportType;
  const fileName = `relatorio-rh-${slug}-${new Date().toISOString().slice(0, 10)}.pdf`;
  pdfMake.createPdf(definition).download(fileName);
}
