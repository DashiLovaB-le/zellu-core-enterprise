import { describe, expect, it } from "vitest";
import { getSobrePage, getSobreNavItems, SOBRE_DEFAULT_SLUG, SOBRE_PAGES } from "@/lib/sobre";

describe("sobre pages", () => {
  it("tem páginas com slug único", () => {
    const slugs = SOBRE_PAGES.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("resolve página por slug", () => {
    expect(getSobrePage(SOBRE_DEFAULT_SLUG)?.title).toMatch(/Zēllu/);
    expect(getSobrePage("pagina-inexistente")).toBeUndefined();
  });

  it("nav items alinhados às páginas", () => {
    expect(getSobreNavItems()).toHaveLength(SOBRE_PAGES.length);
  });
});
