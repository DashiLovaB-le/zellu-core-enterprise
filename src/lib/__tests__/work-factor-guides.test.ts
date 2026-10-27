import { describe, expect, it } from "vitest";
import { WORK_FACTOR_IDS } from "@/lib/work-factors";
import {
  WORK_FACTOR_GUIDES,
  WORK_FACTOR_GUIDE_PRIVACY_NOTE,
  workFactorGuide,
  workFactorGuideIntro,
} from "@/lib/work-factor-guides";

describe("guias de ação dos fatores de trabalho", () => {
  it("cada fator tem sinal e de 3 a 4 ações distintas", () => {
    for (const id of WORK_FACTOR_IDS) {
      const guide = workFactorGuide(id);
      expect(guide.factorId).toBe(id);
      expect(guide.signal.length).toBeGreaterThan(20);
      expect(guide.actions.length).toBeGreaterThanOrEqual(3);
      expect(guide.actions.length).toBeLessThanOrEqual(4);
      expect(new Set(guide.actions).size).toBe(guide.actions.length);
    }
    expect(Object.keys(WORK_FACTOR_GUIDES).sort()).toEqual([...WORK_FACTOR_IDS].sort());
  });

  it("só sugere ação quando o fator está em atenção ou risco", () => {
    expect(workFactorGuideIntro("risco")).toMatch(/Prioridade/);
    expect(workFactorGuideIntro("atencao")).toMatch(/antes que piore/);
    expect(workFactorGuideIntro("favoravel")).toBeNull();
    expect(workFactorGuideIntro(null)).toBeNull();
  });

  it("não orienta a identificar quem respondeu nem usa linguagem clínica", () => {
    const text = Object.values(WORK_FACTOR_GUIDES)
      .flatMap((guide) => [guide.signal, ...guide.actions])
      .join(" ")
      .toLowerCase();
    expect(text).not.toMatch(/descubra quem|identifique quem|pergunte quem respondeu/);
    expect(text).not.toMatch(/diagn[oó]stico|transtorno|burnout|depress/);
    expect(WORK_FACTOR_GUIDE_PRIVACY_NOTE).toMatch(/Não tente descobrir quem respondeu/);
  });
});
