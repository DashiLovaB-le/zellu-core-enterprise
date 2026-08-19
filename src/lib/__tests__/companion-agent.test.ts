import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  formatCompanionContextBlock,
  parseCompanionAiPayload,
  pickMemoryIdsToPrune,
  sanitizeCompanionMemory,
} from "@/lib/companion-agent";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("parseCompanionAiPayload", () => {
  it("lê JSON válido e sanitiza memória", () => {
    const payload = parseCompanionAiPayload(`{
      "message": "Que tal uma pausa curta agora?",
      "memory": "Prefere respiração curta pela manhã",
      "memory_importance": 4,
      "suggestion": "respirar"
    }`);
    expect(payload.message).toMatch(/pausa/);
    expect(payload.memory).toBe("Prefere respiração curta pela manhã");
    expect(payload.memoryImportance).toBe(4);
    expect(payload.suggestion).toBe("respirar");
    expect(payload.parseFailed).toBe(false);
  });

  it("aceita JSON dentro de fence e ignora suggestion inválida", () => {
    const payload = parseCompanionAiPayload(
      "```json\n{\"message\":\"Ok\",\"memory\":null,\"suggestion\":\"abc\"}\n```",
    );
    expect(payload.message).toBe("Ok");
    expect(payload.memory).toBeNull();
    expect(payload.suggestion).toBeNull();
    expect(payload.parseFailed).toBe(false);
  });

  it("marca parseFailed quando JSON não tem message", () => {
    const payload = parseCompanionAiPayload('{"memory":"x"}');
    expect(payload.message).not.toContain("{");
    expect(payload.memory).toBeNull();
    expect(payload.parseFailed).toBe(true);
  });
});

describe("sanitizeCompanionMemory", () => {
  it("bloqueia crise, e-mail e texto curto", () => {
    expect(sanitizeCompanionMemory("quero morrer hoje à noite")).toBeNull();
    expect(sanitizeCompanionMemory("falar com ana@empresa.com sobre o dia")).toBeNull();
    expect(sanitizeCompanionMemory("ok")).toBeNull();
  });
});

describe("pickMemoryIdsToPrune", () => {
  it("mantém as 20 mais importantes e recentes", () => {
    const rows = Array.from({ length: 22 }, (_, i) => ({
      id: String(i),
      importance: i < 2 ? 1 : 5,
      created_at: new Date(2026, 0, i + 1).toISOString(),
    }));
    const pruned = pickMemoryIdsToPrune(rows, 20);
    expect(pruned).toHaveLength(2);
    expect(pruned.sort()).toEqual(["0", "1"]);
  });
});

describe("formatCompanionContextBlock", () => {
  it("não inclui diário nem identificadores", () => {
    const block = formatCompanionContextBlock({
      checkins: [{ day: "2026-08-18", mood: "calmo", sleepHours: 7, sleepLabel: "Bom", waterMl: 1200 }],
      habitsToday: {
        waterMl: 800,
        sleepQuality: 70,
        mood: "calmo",
        movementMinutes: 20,
        energyLevel: 60,
      },
      plan: {
        goal: "melhorar-sono",
        today: { water: true, walk: false, breathe: true, talk: false },
      },
      preventiveLine: "- Sem alertas preventivos",
      memories: [{ importance: 4, content: "Prefere pausas curtas" }],
    });
    expect(block).toMatch(/RETRATO DO MOMENTO/);
    expect(block).toMatch(/Melhorar o sono/);
    expect(block).toMatch(/Prefere pausas curtas/);
    expect(block).not.toMatch(/diário/i);
    expect(block).not.toMatch(/@/);
  });
});

describe("chat-ai não lê diário", () => {
  it("não consulta diary_entries", () => {
    const src = readFileSync(join(root, "src/lib/api/chat-ai.server.ts"), "utf8");
    expect(src).not.toMatch(/diary_entries/);
    expect(src).toMatch(/companionContextBlock/);
    expect(src).toMatch(/jsonMode:\s*true/);
  });
});
