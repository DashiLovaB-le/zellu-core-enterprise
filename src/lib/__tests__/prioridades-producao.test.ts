import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { applyKAnonymity, applyProfileUpdateGuard, assertNoPrivateFields, companyMetricsAllowed, scopeByCompanyId } from "@/lib/tenant";
import { detectCrisisLanguage, buildCrisisReply } from "@/lib/crisis";
import { selectTrustedChatHistory, selectTrustedChatContext } from "@/lib/chat-guard";
import { getMoodScore, isNegativeMood, toMainMood, buildWeeklyMoodBars } from "@/data/moods";
import { hasValidPrivacyConsent, sanitizeLogDetails, sanitizeLogMessage } from "@/lib/lgpd";
import { PRIVACY_CONSENT_VERSION, CLINICAL_DISCLAIMER, PRIVACY_AI_PROCESSING } from "@/lib/privacy";

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

  it("humores extras entram nas 6 categorias do gráfico semanal", () => {
    expect(toMainMood("grato")).toBe("feliz");
    expect(toMainMood("sereno")).toBe("calmo");
    expect(toMainMood("preocupado")).toBe("ansioso");
    expect(toMainMood("bravo")).toBe("irritado");
    const bars = buildWeeklyMoodBars({ grato: 2, ansioso: 1, sereno: 1 });
    expect(bars.find((b) => b.key === "feliz")?.count).toBe(2);
    expect(bars.find((b) => b.key === "calmo")?.count).toBe(1);
    expect(bars.find((b) => b.key === "ansioso")?.count).toBe(1);
    expect(bars).toHaveLength(6);
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

  it("migration 009 expõe só agregados RH e agenda retenção", () => {
    const sql = readFileSync(join(root, "supabase/migrations/009_confianca_rls_retencao.sql"), "utf8");
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.get_rh_dashboard/);
    expect(sql).toMatch(/privacy_rh_opt_in IS TRUE/);
    expect(sql).not.toMatch(/jsonb_build_object\([\s\S]*user_id/);
    expect(sql).toMatch(/DROP POLICY IF EXISTS "profiles_manager_company_select"/);
    expect(sql).toMatch(/list_company_directory/);
    expect(sql).toMatch(/cron\.schedule/);
    expect(sql).toMatch(/purge-personal-data-daily/);
  });

  it("painel manager não usa service role", () => {
    const src = readFileSync(join(root, "src/lib/api/manager.server.ts"), "utf8");
    expect(src).not.toMatch(/createAdminClient/);
    expect(src).toMatch(/get_rh_dashboard/);
  });

  it("IA pede ZDR e descreve o tratamento no termo", () => {
    const llm = readFileSync(join(root, "src/lib/api/llm-config.server.ts"), "utf8");
    expect(llm).toMatch(/data_collection:\s*"deny"/);
    expect(llm).toMatch(/zdr:\s*true/);
    expect(PRIVACY_AI_PROCESSING.routing).toMatch(/ZDR/);
    expect(PRIVACY_AI_PROCESSING.neverSent).toContain("Nome");
  });

  it("disclaimer clínico está no termo versionado", () => {
    expect(PRIVACY_CONSENT_VERSION).toBe("3.0");
    expect(CLINICAL_DISCLAIMER).toMatch(/não substitui atendimento psicológico/);
  });

  it("sessão não pede accessToken no body das APIs de identidade", () => {
    const auth = readFileSync(join(root, "src/lib/api/auth.server.ts"), "utf8");
    expect(auth).toMatch(/setAuthCookies/);
    expect(auth).not.toMatch(/z\.object\(\{[\s\S]*accessToken/);
    const requireUser = readFileSync(join(root, "src/lib/require-user.ts"), "utf8");
    expect(requireUser).toMatch(/getRequestAccessToken/);
    expect(requireUser).toMatch(/export async function requireUser\(\)/);
  });

  it("wellness-plan e convites autenticados não usam service role", () => {
    const plan = readFileSync(join(root, "src/lib/api/wellness-plan.server.ts"), "utf8");
    expect(plan).not.toMatch(/createAdminClient/);
    const invites = readFileSync(join(root, "src/lib/api/invites.server.ts"), "utf8");
    expect(invites).toMatch(/company_has_available_seat/);
    expect(invites).toMatch(/set_employee_active/);
    expect(invites).toMatch(/get_invite_public/);
  });

  it("headers de segurança incluem CSP", () => {
    const src = readFileSync(join(root, "src/lib/security-headers.ts"), "utf8");
    expect(src).toMatch(/Content-Security-Policy/);
    expect(src).toMatch(/fonts\.googleapis\.com/);
    expect(src).toMatch(/fonts\.gstatic\.com/);
    expect(src).toMatch(/Strict-Transport-Security/);
  });

  it("migration 010 força RLS, quota e self-test", () => {
    const sql = readFileSync(join(root, "supabase/migrations/010_hardening_sessao_rls.sql"), "utf8");
    expect(sql).toMatch(/FORCE ROW LEVEL SECURITY/);
    expect(sql).toMatch(/consume_client_log_quota/);
    expect(sql).toMatch(/run_rls_self_test/);
    expect(sql).toMatch(/preventive_cache_set/);
  });

  it("cron de retenção aceita GET da Vercel e POST do GitHub Actions", () => {
    const src = readFileSync(join(root, "src/lib/retention.ts"), "utf8");
    expect(src).toMatch(/request\.method !== "POST" && request\.method !== "GET"/);
  });

  it("cache da LLM não fica só na memória do processo", () => {
    const llm = readFileSync(join(root, "src/lib/api/llm-config.server.ts"), "utf8");
    expect(llm).not.toMatch(/llmConfigCache/);
  });

  it("build da Vercel usa Nitro preset vercel e framework tanstack-start", () => {
    const vite = readFileSync(join(root, "vite.config.ts"), "utf8");
    expect(vite).toMatch(/preset:\s*["']vercel["']/);
    const vercel = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
    expect(vercel.framework).toBe("tanstack-start");
    expect(vercel.crons?.[0]?.path).toBe("/api/jobs/retention");
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    expect(pkg.dependencies?.["lightningcss-win32-x64-msvc"]).toBeUndefined();
    expect(pkg.devDependencies["@lovable.dev/vite-tanstack-config"]).toMatch(/2\.(6|7|8|9)/);
  });
});

describe("RLS no Postgres", () => {
  it.skipIf(!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.VITE_SUPABASE_URL)(
    "self-test de FORCE RLS e isolamento",
    async () => {
      const { createAdminClient } = await import("@/lib/supabase/admin.server");
      const admin = createAdminClient();
      const { data, error } = await admin.rpc("run_rls_self_test");
      if (error?.code === "PGRST202") {
        console.warn("run_rls_self_test ainda não está no schema cache do PostgREST");
        return;
      }
      expect(error).toBeNull();
      const payload = typeof data === "string" ? JSON.parse(data) : data;
      expect(payload.missing_force ?? []).toEqual([]);
      expect(payload.force_rls).toBe(true);
      expect(["ok", "skipped_no_two_tenants"]).toContain(payload.isolation_note);
    },
  );
});
