import type {
  Content,
  ContextPageSize,
  CustomTableLayout,
  DynamicBackground,
  DynamicContent,
  StyleDictionary,
} from "pdfmake/interfaces";
import { ZELLU_BRAND } from "@/assets/logo-zellu/brand";
import { BRANDING } from "@/lib/branding";

const brand = ZELLU_BRAND.colors;

export const PDF_COLORS = {
  ink: brand.ink,
  inkSoft: brand.inkSoft,
  terracotta: brand.terracotta,
  terracottaDark: brand.terracottaDark,
  sage: brand.sage,
  sageDark: brand.sageDark,
  cream: brand.cream,
  creamDeep: brand.creamDeep,
  title: "#2F4A66",
  muted: "#6B7C8F",
  line: "#C5D9F1",
  accent: "#99BEE5",
  hairline: "#E8DED3",
  danger: "#B45309",
} as const;

/** Margens da página A4: o topo e a base reservam espaço para cabeçalho e rodapé. */
export const PDF_PAGE_MARGINS: [number, number, number, number] = [40, 88, 40, 66];

const SIDE = PDF_PAGE_MARGINS[0];
const SYMBOL_RATIO = 64.14 / 72.97;

/** Mistura a cor com branco; amount = 1 mantém a cor, 0 vira branco. */
export function tint(hex: string, amount: number): string {
  const value = hex.replace("#", "");
  const channels = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
  const mixed = channels.map((c) => Math.round(255 - (255 - c) * amount));
  return `#${mixed.map((c) => c.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

/** Símbolo da marca (mesma geometria de simbolo.svg) com cores sólidas, que o pdfmake desenha sem CSS. */
export function zelluSymbolSvg(colors: { stroke: string; base: string; dot: string }): string {
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72.97 64.14" width="72.97" height="64.14">',
    `<path d="M7.5,7.5h54l-30.4,26.75" fill="none" stroke="${colors.stroke}" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>`,
    `<path d="M10.79,50.14h53.29c4.91,0,8.88,3.13,8.88,7h0c0,3.87-3.98,7-8.88,7H10.79c-4.91,0-8.88-3.13-8.88-7h0c0-3.87,3.98-7,8.88-7Z" fill="${colors.base}"/>`,
    `<circle cx="61.5" cy="37" r="7.5" fill="${colors.dot}"/>`,
    "</svg>",
  ].join("");
}

export const ZELLU_SYMBOL_SVG = zelluSymbolSvg({
  stroke: brand.terracotta,
  base: brand.sage,
  dot: brand.ink,
});

export const ZELLU_WATERMARK_SVG = zelluSymbolSvg({
  stroke: tint(brand.terracotta, 0.08),
  base: tint(brand.sage, 0.09),
  dot: tint(brand.ink, 0.05),
});

function contentWidth(pageSize: ContextPageSize): number {
  return pageSize.width - SIDE * 2;
}

export function zelluPdfHeader(reportTitle: string): DynamicContent {
  return (_currentPage, _pageCount, pageSize) => {
    const width = contentWidth(pageSize);
    return {
      margin: [SIDE, 26, SIDE, 0],
      stack: [
        {
          columns: [
            { svg: ZELLU_SYMBOL_SVG, width: 24 },
            {
              width: "auto",
              margin: [8, 0, 0, 0],
              stack: [
                { text: BRANDING.appName, style: "pdfBrandName" },
                { text: BRANDING.tagline, style: "pdfBrandTagline" },
              ],
            },
            {
              width: "*",
              stack: [
                { text: reportTitle, style: "pdfHeaderTitle", alignment: "right" },
                {
                  text: "CONFIDENCIAL · USO INTERNO DO RH",
                  style: "pdfHeaderTag",
                  alignment: "right",
                },
              ],
            },
          ],
        },
        {
          margin: [0, 10, 0, 0],
          canvas: [
            { type: "rect", x: 0, y: 1, w: width, h: 0.8, color: PDF_COLORS.hairline },
            { type: "rect", x: 0, y: 0, w: 54, h: 2.6, r: 1.3, color: PDF_COLORS.terracotta },
            { type: "rect", x: 58, y: 0, w: 22, h: 2.6, r: 1.3, color: PDF_COLORS.sage },
          ],
        },
      ],
    };
  };
}

export const zelluPdfFooter: DynamicContent = (currentPage, pageCount, pageSize) => {
  const width = contentWidth(pageSize);
  return {
    margin: [SIDE, 16, SIDE, 0],
    stack: [
      {
        canvas: [
          {
            type: "line",
            x1: 0,
            y1: 0,
            x2: width,
            y2: 0,
            lineWidth: 0.6,
            lineColor: PDF_COLORS.hairline,
          },
        ],
      },
      {
        margin: [0, 8, 0, 0],
        columns: [
          {
            width: "*",
            stack: [
              { text: `${BRANDING.appName} · ${BRANDING.tagline}`, style: "pdfFooterStrong" },
              {
                text: `${BRANDING.poweredBy} · Dados agregados, sem identificação individual. Não compartilhe fora do RH autorizado.`,
                style: "pdfFooter",
                margin: [0, 2, 0, 0],
              },
            ],
          },
          {
            width: "auto",
            table: {
              body: [[{ text: `Página ${currentPage} de ${pageCount}`, style: "pdfPageBadge" }]],
            },
            layout: {
              fillColor: () => PDF_COLORS.cream,
              hLineWidth: () => 0.6,
              vLineWidth: () => 0.6,
              hLineColor: () => PDF_COLORS.hairline,
              vLineColor: () => PDF_COLORS.hairline,
              paddingLeft: () => 8,
              paddingRight: () => 8,
              paddingTop: () => 3,
              paddingBottom: () => 3,
            },
          },
        ],
      },
    ],
  };
};

export const zelluPdfBackground: DynamicBackground = (_currentPage, pageSize) => {
  const width = Math.min(320, pageSize.width * 0.55);
  const height = width * SYMBOL_RATIO;
  return {
    svg: ZELLU_WATERMARK_SVG,
    width,
    absolutePosition: {
      x: (pageSize.width - width) / 2,
      y: (pageSize.height - height) / 2 + 24,
    },
  };
};

/** Bloco de abertura da primeira página: rótulo, título e linhas de contexto. */
export function zelluTitleBlock(input: {
  eyebrow: string;
  title: string;
  meta: Array<string | null | undefined>;
}): Content {
  const meta = input.meta.filter((line): line is string => Boolean(line));
  return {
    margin: [0, 0, 0, 18],
    table: {
      widths: ["*"],
      body: [
        [
          {
            stack: [
              { text: input.eyebrow.toUpperCase(), style: "pdfEyebrow" },
              { text: input.title, style: "pdfTitle" },
              ...meta.map((line) => ({ text: line, style: "pdfMeta" })),
            ],
          },
        ],
      ],
    },
    layout: {
      fillColor: () => PDF_COLORS.cream,
      hLineWidth: () => 0,
      vLineWidth: (i) => (i === 0 ? 3 : 0),
      vLineColor: () => PDF_COLORS.terracotta,
      paddingLeft: () => 14,
      paddingRight: () => 14,
      paddingTop: () => 12,
      paddingBottom: () => 12,
    },
  };
}

/** Tabela no tom do painel RH; linhas sem preenchimento deixam a marca d'água aparecer. */
export function zelluTableLayout(
  options: { header?: boolean; zebra?: boolean; padding?: number } = {},
): CustomTableLayout {
  const { header = true, zebra = true, padding = 6 } = options;
  return {
    fillColor: (row) => {
      if (header && row === 0) return PDF_COLORS.accent;
      if (zebra && row % 2 === 0) return PDF_COLORS.creamDeep;
      return null;
    },
    hLineColor: () => PDF_COLORS.line,
    vLineColor: () => PDF_COLORS.line,
    paddingLeft: () => padding,
    paddingRight: () => padding,
    paddingTop: () => padding - 1,
    paddingBottom: () => padding - 1,
  };
}

export const ZELLU_PDF_STYLES: StyleDictionary = {
  pdfBrandName: { fontSize: 13, bold: true, color: PDF_COLORS.ink },
  pdfBrandTagline: { fontSize: 6.5, color: PDF_COLORS.inkSoft, margin: [0, 1, 0, 0] },
  pdfHeaderTitle: { fontSize: 8.5, bold: true, color: PDF_COLORS.title },
  pdfHeaderTag: {
    fontSize: 6.5,
    bold: true,
    color: PDF_COLORS.terracottaDark,
    characterSpacing: 0.8,
    margin: [0, 3, 0, 0],
  },
  pdfFooterStrong: { fontSize: 7, bold: true, color: PDF_COLORS.inkSoft },
  pdfFooter: { fontSize: 6.5, color: PDF_COLORS.muted },
  pdfPageBadge: { fontSize: 7, bold: true, color: PDF_COLORS.ink },
  pdfEyebrow: {
    fontSize: 7.5,
    bold: true,
    color: PDF_COLORS.sageDark,
    characterSpacing: 1,
  },
  pdfTitle: { fontSize: 17, bold: true, color: PDF_COLORS.ink, margin: [0, 3, 0, 4] },
  pdfMeta: { fontSize: 8, color: PDF_COLORS.inkSoft, margin: [0, 1, 0, 0] },
};
