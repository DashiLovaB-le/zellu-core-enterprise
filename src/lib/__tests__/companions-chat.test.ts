import { describe, expect, it } from "vitest";
import { resolveCompanionQuickReply, getCompanionStarterReplies } from "@/lib/companions/quick-replies";
import { buildLocalFallbackReply } from "@/lib/companion-local-fallback";

describe("resolveCompanionQuickReply", () => {
  it("usa tom do Chico para respirar", () => {
    const result = resolveCompanionQuickReply("Chico", "respirar");
    expect(result?.messageText).toBe("Vamos respirar");
    expect(result?.buttonLabel).toBe("Respirar");
  });

  it("usa tom da Amora para respirar", () => {
    const result = resolveCompanionQuickReply("Amora", "respirar");
    expect(result?.messageText).toBe("Quero respirar com calma");
  });

  it("usa tom do Zeca para movimento", () => {
    const result = resolveCompanionQuickReply("Zeca", "movimento");
    expect(result?.messageText).toContain("Alongamento");
  });

  it("marca navegação para check-in", () => {
    const result = resolveCompanionQuickReply("Pipoca", "checkin");
    expect(result?.navigates).toBe(true);
  });
});

describe("getCompanionStarterReplies", () => {
  it("retorna atalhos por companion", () => {
    expect(getCompanionStarterReplies("Amora")[0]?.label).toBe("Preciso desabafar");
    expect(getCompanionStarterReplies("Zeca")[0]?.label).toBe("Próximo passo");
  });
});

describe("buildLocalFallbackReply companion voice", () => {
  it("saudação da Amora difere do Chico", () => {
    const chico = buildLocalFallbackReply("Oi", "você", { greeting: "Boa tarde", companionId: "Chico" });
    const amora = buildLocalFallbackReply("Oi", "você", { greeting: "Boa tarde", companionId: "Amora" });
    expect(chico).toContain("apoiar seu bem-estar");
    expect(amora).toContain("Que bom ter você aqui");
  });

  it("Pipoca usa tom leve na saudação", () => {
    const reply = buildLocalFallbackReply("Oi", "você", { greeting: "Bom dia", companionId: "Pipoca" });
    expect(reply).toContain("Que bom te ver");
  });
});
