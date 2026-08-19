import { describe, expect, it } from "vitest";
import { buildLocalFallbackReply } from "@/lib/companion-local-fallback";

describe("buildLocalFallbackReply", () => {
  const ctx = { mood: "grato", greeting: "Boa tarde" };

  it("responde saudação sem repetir humor do check-in", () => {
    const reply = buildLocalFallbackReply("Olá, boa tarde", "você", ctx);
    expect(reply).toContain("Boa tarde");
    expect(reply).not.toContain("humor estava");
  });

  it("reconhece sentimento positivo e gratidão", () => {
    const reply = buildLocalFallbackReply("Sou grato pela vida, me sinto bem hoje", "você", ctx);
    expect(reply).toContain("grato");
    expect(reply).not.toContain("você, obrigado");
  });

  it("orienta alongamento quando pedido", () => {
    const reply = buildLocalFallbackReply("Fazer um alongamento", "você", ctx);
    expect(reply.toLowerCase()).toContain("alongamento");
    expect(reply).not.toContain("humor estava");
  });

  it("orienta pausa quando sugerido", () => {
    const reply = buildLocalFallbackReply("Fazer uma pausa", "você", ctx);
    expect(reply.toLowerCase()).toContain("pausa");
    expect(reply).not.toContain("humor estava");
  });

  it("reconhece humor selecionado na UI sem perguntar do check-in", () => {
    const reply = buildLocalFallbackReply("Neutro", "você", ctx);
    expect(reply.toLowerCase()).toContain("neutro");
    expect(reply).not.toContain("humor estava");
  });

  it("não repete pergunta de humor após resposta do usuário", () => {
    const history = [
      { role: "assistant" as const, content: 'Pelo seu check-in recente, seu humor estava "grato" — como você se sente agora?' },
      { role: "user" as const, content: "me sinto grato ainda" },
      { role: "assistant" as const, content: "Que bom saber que você continua se sentindo grato." },
    ];
    const reply = buildLocalFallbackReply("Fazer uma pausa", "você", ctx, history);
    expect(reply.toLowerCase()).toContain("pausa");
    expect(reply).not.toContain("humor estava");
  });

  it("pede desculpas quando usuário aponta repetição", () => {
    const history = [
      { role: "user" as const, content: "me sinto grato ainda" },
      { role: "assistant" as const, content: "Que bom saber que você está se sentindo grato hoje." },
    ];
    const reply = buildLocalFallbackReply("ué, eu ja respondi isso...", "você", ctx, history);
    expect(reply.toLowerCase()).toMatch(/desculpe|razão|repetição|já tinha compartilhado/);
    expect(reply).not.toContain("humor estava");
  });

  it("cita trecho da mensagem em respostas genéricas com humor no contexto", () => {
    const reply = buildLocalFallbackReply("ah eu sou grato pela vida, acordei bem hoje", "você", ctx);
    expect(reply).toMatch(/grato|bem/i);
    expect(reply).not.toContain('humor estava **"grato"**');
  });

  it("não prefixa com 'você,'", () => {
    const reply = buildLocalFallbackReply("estou triste hoje", "você", {});
    expect(reply).not.toMatch(/^você,/);
  });
});
