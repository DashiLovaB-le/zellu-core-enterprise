import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { assertDirectoryHasNoHealthFields } from "@/lib/api/manager.server";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("manager team roster", () => {
  it("bloqueia campos de saúde no diretório", () => {
    expect(
      assertDirectoryHasNoHealthFields({
        id: "1",
        email: "a@b.com",
        display_name: "Ana",
        role: "companion",
        team_id: null,
        is_active: true,
        job_title: "Analista",
        avatar_url: "Amora",
      }),
    ).toEqual([]);

    expect(
      assertDirectoryHasNoHealthFields({
        id: "1",
        mood: "calmo",
        privacy_rh_opt_in: true,
      }),
    ).toEqual(expect.arrayContaining(["mood", "privacy_rh_opt_in"]));
  });

  it("migration 013 libera edição de equipe para manager sem service role", () => {
    const sql = readFileSync(join(root, "supabase/migrations/013_manager_team_edit.sql"), "utf8");
    expect(sql).toMatch(/assign_team_member/);
    expect(sql).toMatch(/teams_manager_update/);
    expect(sql).toMatch(/mmc\.assign_team_member/);
    expect(sql).toMatch(/job_title/);

    const api = readFileSync(join(root, "src/lib/api/manager.server.ts"), "utf8");
    expect(api).not.toMatch(/createAdminClient/);
    expect(api).toMatch(/assign_team_member/);
    expect(api).toMatch(/renameManagerTeam/);

    const page = readFileSync(join(root, "src/routes/manager/equipe/$teamId.tsx"), "utf8");
    expect(page).toMatch(/Avatar name=\{m\.avatar_url/);
  });
});
