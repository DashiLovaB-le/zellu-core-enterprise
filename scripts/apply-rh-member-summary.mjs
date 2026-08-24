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

const name = "014_rh_member_summary";
const sql = readFileSync(resolve(root, "supabase/migrations/014_rh_member_summary.sql"), "utf8");

async function listMigrations() {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/migrations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`list migrations ${res.status}: ${await res.text()}`);
  return res.json();
}

async function applyMigration(migrationName, query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/migrations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: migrationName, query }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${migrationName} ${res.status}: ${text}`);
  return text;
}

async function query(sqlText) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sqlText }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`query ${res.status}: ${text}`);
  return JSON.parse(text);
}

const applied = await listMigrations();
const names = new Set(applied.map((m) => m.name));
if (names.has(name)) {
  console.log(`Skip ${name} (já aplicada) — reaplicando via query...`);
  await query(sql);
} else {
  console.log(`Applying ${name}...`);
  await applyMigration(name, sql);
  console.log("  OK");
}

const fns = await query(`
  SELECT proname
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname IN ('public', 'private')
    AND proname IN ('get_rh_member_summary', 'list_rh_member_signals', 'rh_wellness_signals')
  ORDER BY n.nspname, proname;
`);
console.log("Funções:", fns.map((f) => f.proname).join(", "));
