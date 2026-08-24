import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertRhSummarySafe,
  buildRhWellnessSignals,
  statusLabelPt,
} from "@/lib/rh-member-summary";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("resumo RH do colaborador", () => {
  it("marca atenção com alta carga negativa e tendência de piora", () => {
    const signals = buildRhWellnessSignals({
      optedIn: true,
      recentCheckinCount: 5,
      previousCheckinCount: 5,
      recentNegativePct: 60,
      previousNegativePct: 20,
      daysWithCheckinLast7: 5,
      lastCheckinDaysAgo: 0,
      avgSleepLast7: 5.5,
    });
    expect(signals.available).toBe(true);
    expect(signals.status).toBe("attention");
    expect(signals.trend).toBe("worsening");
    expect(statusLabelPt(signals.status)).toBe("Atenção");
    expect(signals.sleepSignal).toBe("attention");
  });

  it("omite resumo quando não há opt-in", () => {
    const signals = buildRhWellnessSignals({
      optedIn: false,
      recentCheckinCount: 7,
      previousCheckinCount: 7,
      recentNegativePct: 80,
      previousNegativePct: 10,
      daysWithCheckinLast7: 7,
      lastCheckinDaysAgo: 0,
      avgSleepLast7: 8,
    });
    expect(signals.available).toBe(false);
    expect(signals.status).toBe("unknown");
  });

  it("rejeita payload com humor, diário ou chat", () => {
    expect(assertRhSummarySafe({ id: "1", wellness: { status: "stable" } })).toEqual([]);
    expect(
      assertRhSummarySafe({
        mood: "triste",
        diary: "texto",
        chat: "oi",
      }),
    ).toEqual(expect.arrayContaining(["mood", "diary", "chat"]));
  });

  it("migration e páginas não expõem diário/chat", () => {
    const sql = readFileSync(join(root, "supabase/migrations/014_rh_member_summary.sql"), "utf8");
    expect(sql).toMatch(/get_rh_member_summary/);
    expect(sql).toMatch(/list_rh_member_signals/);
    expect(sql).not.toMatch(/diary_entries/);
    expect(sql).not.toMatch(/chat_messages/);

    const api = readFileSync(join(root, "src/lib/api/manager.server.ts"), "utf8");
    expect(api).not.toMatch(/createAdminClient/);
    expect(api).toMatch(/get_rh_member_summary/);

    const equipe = readFileSync(join(root, "src/routes/manager/equipe/$teamId.tsx"), "utf8");
    expect(equipe).toMatch(/colaborador\/\$profileId/);

    const convites = readFileSync(join(root, "src/routes/manager/convites.tsx"), "utf8");
    expect(convites).toMatch(/colaborador\/\$profileId/);
  });
});
