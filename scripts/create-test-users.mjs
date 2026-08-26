import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  readFileSync(resolve(root, ".env"), "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^"|"$/g, "")];
    }),
);

const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  throw new Error("VITE_SUPABASE_URL/SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias no .env");
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = "MmcTeste#2026";
const now = new Date().toISOString();

const USERS = [
  {
    email: "colaborador.teste@zellu.app",
    password: PASSWORD,
    displayName: "Colaborador Teste",
    role: "companion",
  },
  {
    email: "rh.teste@zellu.app",
    password: PASSWORD,
    displayName: "RH Teste",
    role: "manager",
  },
];

const COMPANY_NAME = "Empresa Demo Zēllu";

function legacyEmail(email) {
  return email.replace(/@zellu\.app$/i, "@mundomental.care");
}

async function listAllUsers() {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw new Error(`listUsers: ${error.message}`);
  return data?.users ?? [];
}

async function ensureCompany() {
  const { data: existing, error } = await admin.from("companies").select("id, name").limit(1);
  if (error) throw new Error(`companies select: ${error.message}`);
  if (existing?.[0]) {
    if (existing[0].name !== COMPANY_NAME) {
      const { data: renamed, error: renameError } = await admin
        .from("companies")
        .update({ name: COMPANY_NAME })
        .eq("id", existing[0].id)
        .select("id, name")
        .single();
      if (renameError) throw new Error(`companies rename: ${renameError.message}`);
      return renamed;
    }
    return existing[0];
  }

  const { data, error: insertError } = await admin
    .from("companies")
    .insert({ name: COMPANY_NAME })
    .select("id, name")
    .single();
  if (insertError) throw new Error(`companies insert: ${insertError.message}`);
  return data;
}

async function ensureUser({ email, password, displayName }) {
  const users = await listAllUsers();
  const legacy = legacyEmail(email);
  const found =
    users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ??
    users.find((u) => u.email?.toLowerCase() === legacy.toLowerCase());

  if (found) {
    const { error } = await admin.auth.admin.updateUserById(found.id, {
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    });
    if (error) throw new Error(`updateUser ${email}: ${error.message}`);
    return found.id;
  }

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });
  if (error || !created?.user) throw new Error(`createUser ${email}: ${error?.message ?? "falhou"}`);
  return created.user.id;
}

const company = await ensureCompany();
const results = [];

const { data: teamRow } = await admin
  .from("teams")
  .select("id")
  .eq("company_id", company.id)
  .eq("name", "Equipe Demo")
  .maybeSingle();

let teamId = teamRow?.id ?? null;
if (!teamId) {
  const { data: createdTeam, error: teamError } = await admin
    .from("teams")
    .insert({ company_id: company.id, name: "Equipe Demo", description: "Equipe de demonstração" })
    .select("id")
    .single();
  if (teamError) throw new Error(`teams: ${teamError.message}`);
  teamId = createdTeam.id;
}

for (const user of USERS) {
  const id = await ensureUser(user);
  const profile = {
    id,
    email: user.email,
    display_name: user.displayName,
    role: user.role,
    company_id: company.id,
    team_id: teamId,
    is_active: true,
    timezone: "America/Sao_Paulo",
    onboarding_completed_at: now,
    adult_confirmed_at: now,
    privacy_consent_at: now,
    privacy_consent_version: "3.0",
    privacy_ai_opt_in: user.role === "companion",
    privacy_rh_opt_in: user.role === "companion",
    privacy_email_opt_in: false,
  };

  const { error } = await admin.from("profiles").upsert(profile);
  if (error) throw new Error(`profiles upsert ${user.email}: ${error.message}`);

  const { data: check, error: checkError } = await admin
    .from("profiles")
    .select("id, email, role, company_id, is_active, privacy_consent_version, onboarding_completed_at")
    .eq("id", id)
    .single();
  if (checkError) throw new Error(`profiles check ${user.email}: ${checkError.message}`);

  results.push({
    papel: user.role === "companion" ? "Colaborador" : "RH",
    email: user.email,
    senha: user.password,
    nome: user.displayName,
    role: check.role,
    empresa: company.name,
    ativo: check.is_active,
  });
}

console.log(JSON.stringify({ empresa: company, usuarios: results }, null, 2));
