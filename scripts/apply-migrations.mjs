import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env");

function loadEnv(path) {
  if (!existsSync(path)) throw new Error(".env não encontrado");
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    out[line.slice(0, idx).trim()] = line.slice(idx + 1).trim().replace(/^"|"$/g, "");
  }
  return out;
}

const env = loadEnv(envPath);
const token = env.TOKEN_SUPABASE;
const projectRef = env.PROJETO_SUPABASE || "cxogfjczajhxgyffxcbk";
if (!token) throw new Error("TOKEN_SUPABASE ausente no .env");

const migrations = [
  ["008_lgpd_controles", "supabase/migrations/008_lgpd_controles.sql"],
  ["009_confianca_rls_retencao", "supabase/migrations/009_confianca_rls_retencao.sql"],
  ["010_companion_memories", "supabase/migrations/010_companion_memories.sql"],
  ["011_hardening_sessao_rls", "supabase/migrations/011_hardening_sessao_rls.sql"],
  ["012_profiles_authenticated_grants", "supabase/migrations/012_profiles_authenticated_grants.sql"],
];

async function listMigrations() {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/migrations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`list migrations ${res.status}: ${await res.text()}`);
  return res.json();
}

async function applyMigration(name, sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/migrations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, query: sql }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${name} ${res.status}: ${text}`);
  return { status: res.status, body: text };
}

async function verifyColumns() {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'profiles'
          AND column_name LIKE 'privacy_%'
        ORDER BY column_name;
      `,
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`verify ${res.status}: ${text}`);
  return JSON.parse(text);
}

const before = await listMigrations();
const appliedNames = new Set(before.map((m) => m.name));
console.log("Já aplicadas:", [...appliedNames].join(", ") || "(nenhuma)");

for (const [name, relPath] of migrations) {
  if (appliedNames.has(name)) {
    console.log(`Skip ${name} (já existe)`);
    continue;
  }
  const sql = readFileSync(resolve(root, relPath), "utf8");
  console.log(`Applying ${name}...`);
  const result = await applyMigration(name, sql);
  console.log(`  OK ${result.status}`);
  appliedNames.add(name);
}

const after = await listMigrations();
console.log("\nMigrations remotas:");
for (const m of after) console.log(`  ${m.version} ${m.name}`);

const columns = await verifyColumns();
console.log("\nColunas privacy_* em profiles:", JSON.stringify(columns));

const objects = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    query: `
      SELECT
        to_regclass('public.companion_memories') AS companion_memories,
        to_regprocedure('public.get_rh_dashboard(integer)') AS rh_dashboard,
        to_regprocedure('public.company_has_available_seat(uuid)') AS seats;
    `,
  }),
}).then(async (res) => {
  const text = await res.text();
  if (!res.ok) throw new Error(`objects ${res.status}: ${text}`);
  return JSON.parse(text);
});
console.log("\nObjetos-chave:", JSON.stringify(objects));
