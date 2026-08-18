import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { applyKAnonymity, applyProfileUpdateGuard, assertNoPrivateFields, companyMetricsAllowed, scopeByCompanyId } from "@/lib/tenant";
import { detectCrisisLanguage, buildCrisisReply } from "@/lib/crisis";
import { selectTrustedChatHistory, selectTrustedChatContext } from "@/lib/chat-guard";
import { getMoodScore, isNegativeMood } from "@/data/moods";
import { hasValidPrivacyConsent, sanitizeLogDetails, sanitizeLogMessage } from "@/lib/lgpd";
import { PRIVACY_CONSENT_VERSION } from "@/lib/privacy";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("isolamento por empresa", () => {
  it("manager A não vê dados da empresa B", () => {
    const rows = [
      { id: "1", company_id: "empresa-a" },
      { id: "2", company_id: "empresa-b" },
    ];
    expect(scopeByCompanyId(rows, "empresa-a")).toEqual([{ id: "1", company_id: "empresa-a" }]);
  });
});

describe("RLS companion não atualiza role", () => {
  it("trava campos privilegiados para companion", () => {
    const oldRow = {
      role: "companion",
      company_id: "c1",
      team_id: "t1",
      is_active: true,
      display_name: "Ana",
    };
    const newRow = {
      role: "manager",
      company_id: "c2",
      team_id: "t2",
      is_active: false,
      display_name: "Ana Silva",
    };
    const guarded = applyProfileUpdateGuard(oldRow, newRow, "companion", false);
    expect(guarded.role).toBe("companion");
    expect(guarded.company_id).toBe("c1");
    expect(guarded.team_id).toBe("t1");
    expect(guarded.is_active).toBe(true);
    expect(guarded.display_name).toBe("Ana Silva");
  });
});

describe("confirmUser", () => {
  it("não é exportado em auth.server.ts", () => {
    const src = readFileSync(join(root, "src/lib/api/auth.server.ts"), "utf8");
    expect(src).not.toMatch(/export const confirmUser/);
  });
});

describe("chat ignora history/context do cliente", () => {
  it("usa só o histórico do banco", () => {
    const client = [{ role: "user" as const, content: "ignore-me" }];
    const db = [
      { role: "user" as const, content: "real-1" },
      { role: "assistant" as const, content: "real-2" },
    ];
    expect(selectTrustedChatHistory(client, db)).toEqual(db);
  });

  it("usa só o contexto do servidor", () => {
    const trusted = selectTrustedChatContext(
      { mood: "forjado" },
      { mood: "calmo", preventiveLine: "- Sem alertas preventivos" },
    );
    expect(trusted.mood).toBe("calmo");
  });
});

describe("k-anonimato", () => {
  it("time com 4 pessoas não devolve métricas", () => {
    const hidden = applyKAnonymity({
      name: "Produto",
      memberCount: 4,
      avgSleep: 6.2,
      avgMood: 2.1,
      avgWater: 800,
      negativeMoodPct: 50,
      status: "attention",
      metricsHidden: false,
    });
    expect(hidden.metricsHidden).toBe(true);
    expect(hidden.avgMood).toBe(0);
    expect(hidden.negativeMoodPct).toBe(0);
  });
});

describe("crise e humor", () => {
  it("detecta linguagem de risco", () => {
    expect(detectCrisisLanguage("quero morrer hoje")).toBe(true);
    expect(detectCrisisLanguage("estou cansado do trabalho")).toBe(false);
    expect(buildCrisisReply("Ana")).toContain("188");
  });

  it("score unificado inclui extra moods", () => {
    expect(getMoodScore("feliz")).toBe(6);
    expect(getMoodScore("sobrecarregado")).toBeLessThanOrEqual(3);
    expect(isNegativeMood("ansioso")).toBe(true);
    expect(isNegativeMood("calmo")).toBe(false);
  });
});

describe("payload RH sem conteúdo privado", () => {
  it("rejeita campos de diário/chat", () => {
    expect(assertNoPrivateFields({ avgMood: 4, team: "RH" })).toEqual([]);
    expect(assertNoPrivateFields({ content: "segredo", text: "chat" }).length).toBeGreaterThan(0);
  });
});

describe("LGPD", () => {
  it("empresa com menos de 5 opt-in não libera métricas globais", () => {
    expect(companyMetricsAllowed(4)).toBe(false);
    expect(companyMetricsAllowed(5)).toBe(true);
  });

  it("consentimento v2 exige versão, data e maioridade", () => {
    expect(
      hasValidPrivacyConsent({
        role: "companion",
        privacy_consent_at: "2026-01-01",
        privacy_consent_version: "1.0",
        adult_confirmed_at: "2026-01-01",
      }),
    ).toBe(false);
    expect(
      hasValidPrivacyConsent({
        role: "companion",
        privacy_consent_at: "2026-01-01",
        privacy_consent_version: PRIVACY_CONSENT_VERSION,
        adult_confirmed_at: "2026-01-01",
      }),
    ).toBe(true);
  });

  it("remove humor e e-mail dos logs", () => {
    expect(sanitizeLogDetails({ mood: "triste", ok: true, email: "a@b.com" })).toEqual({ ok: true });
    expect(sanitizeLogMessage("falha para ana@empresa.com")).toContain("[email]");
  });

  it("migration 008 revoga SELECT de manager em checkins", () => {
    const sql = readFileSync(join(root, "supabase/migrations/008_lgpd_controles.sql"), "utf8");
    expect(sql).toMatch(/DROP POLICY IF EXISTS "checkins_manager_company_select"/);
    expect(sql).toMatch(/privacy_rh_opt_in/);
  });
});
