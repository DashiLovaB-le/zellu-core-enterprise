import { describe, expect, it } from "vitest";
import type { ContextPageSize } from "pdfmake/interfaces";
import {
  PDF_COLORS,
  PDF_PAGE_MARGINS,
  ZELLU_SYMBOL_SVG,
  ZELLU_WATERMARK_SVG,
  tint,
  zelluPdfBackground,
  zelluPdfFooter,
  zelluPdfHeader,
  zelluTableLayout,
} from "@/lib/pdf/zellu-pdf-theme";

const a4 = { width: 595.28, height: 841.89, orientation: "portrait" } as ContextPageSize;

describe("tema dos PDFs", () => {
  it("clareia a cor sem sair do hexadecimal", () => {
    expect(tint("#E5987D", 1)).toBe("#E5987D");
    expect(tint("#E5987D", 0)).toBe("#FFFFFF");
    expect(tint("#4D332D", 0.5)).toMatch(/^#[0-9A-F]{6}$/);
  });

  it("usa as cores da marca no símbolo e tons quase brancos na marca d'água", () => {
    expect(ZELLU_SYMBOL_SVG).toContain(PDF_COLORS.terracotta);
    expect(ZELLU_SYMBOL_SVG).toContain(PDF_COLORS.sage);
    expect(ZELLU_SYMBOL_SVG).not.toMatch(/url\(|<style|<text/);
    for (const hex of ZELLU_WATERMARK_SVG.match(/#[0-9A-F]{6}/g) ?? []) {
      const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
      expect(Math.min(...channels)).toBeGreaterThan(220);
    }
  });

  it("cabeçalho traz símbolo, título e aviso de confidencialidade na largura útil", () => {
    const header = JSON.stringify(zelluPdfHeader("Relatório X")(1, 2, a4));
    expect(header).toContain("<svg");
    expect(header).toContain("Relatório X");
    expect(header).toContain("CONFIDENCIAL");
    expect(header).toContain(`"w":${a4.width - PDF_PAGE_MARGINS[0] * 2}`);
  });

  it("rodapé numera as páginas e assina a marca", () => {
    const footer = JSON.stringify(zelluPdfFooter(2, 3, a4));
    expect(footer).toContain("Página 2 de 3");
    expect(footer).toContain("Dashitecnology");
  });

  it("marca d'água fica centralizada dentro da página", () => {
    const bg = zelluPdfBackground(1, a4) as {
      width: number;
      absolutePosition: { x: number; y: number };
    };
    expect(bg.absolutePosition.x).toBeGreaterThan(0);
    expect(bg.absolutePosition.x + bg.width).toBeLessThan(a4.width);
    expect(bg.absolutePosition.y).toBeGreaterThan(PDF_PAGE_MARGINS[1]);
  });

  it("tabela deixa linhas ímpares sem fundo para a marca d'água aparecer", () => {
    const layout = zelluTableLayout();
    const fill = layout.fillColor as (row: number) => string | null;
    expect(fill(0)).toBe(PDF_COLORS.accent);
    expect(fill(1)).toBeNull();
    expect(fill(2)).toBe(PDF_COLORS.creamDeep);
  });
});
