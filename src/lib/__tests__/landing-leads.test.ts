import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("leads da landing", () => {
  it("grava no banco antes de disparar o e-mail", () => {
    const src = readFileSync(join(root, "src/lib/api/leads.server.ts"), "utf8");
    const persist = src.indexOf("await persistLead(");
    const email = src.indexOf("await sendTransactionalEmail(");
    expect(persist).toBeGreaterThan(-1);
    expect(email).toBeGreaterThan(persist);
  });

  it("migration cria landing_leads com RLS", () => {
    const sql = readFileSync(join(root, "supabase/migrations/018_landing_leads.sql"), "utf8");
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.landing_leads/);
    expect(sql).toMatch(/FORCE ROW LEVEL SECURITY/);
    expect(sql).toMatch(/landing_leads_admin_all/);
  });
});
