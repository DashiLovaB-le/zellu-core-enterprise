import { describe, expect, it } from "vitest";
import { buildLocalFallbackReply } from "@/lib/companion-local-fallback";

describe("buildLocalFallbackReply", () => {
  const ctx = { mood: "grato", greeting: "Boa tarde" };

  it("responde saudação sem repetir humor do check-in", () => {
    const reply = buildLocalFallbackReply("Olá, boa tarde", "você", ctx);
    expect(reply).toContain("Boa tarde");
    expect(reply).not.toContain('humor recente foi');
  });

  it("reconhece sentimento positivo e gratidão", () => {
    const reply = buildLocalFallbackReply("Sou grato pela vida, me sinto bem hoje", "você", ctx);
    expect(reply).toContain("grato");
    expect(reply).not.toContain("você, obrigado");
    expect(reply).not.toContain("o que mais está presente");
  });

  it("orienta alongamento quando pedido", () => {
    const reply = buildLocalFallbackReply("Fazer um alongamento", "você", ctx);
    expect(reply.toLowerCase()).toContain("alongamento");
    expect(reply).not.toContain('humor recente foi');
  });

  it("cita trecho da mensagem em respostas genéricas com humor no contexto", () => {
    const reply = buildLocalFallbackReply("ah eu sou grato pela vida, acordei bem hoje", "você", ctx);
    expect(reply).toMatch(/grato|bem/i);
    expect(reply).not.toContain('humor recente foi **"grato"**');
  });

  it("não prefixa com 'você,'", () => {
    const reply = buildLocalFallbackReply("estou triste hoje", "você", {});
    expect(reply).not.toMatch(/^você,/);
  });
});
