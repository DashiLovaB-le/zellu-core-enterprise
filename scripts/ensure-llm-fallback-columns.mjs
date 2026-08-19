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

const DEFAULT_MODEL_2 = "google/gemini-2.0-flash-001";
const DEFAULT_MODEL_3 = "meta-llama/llama-3.1-8b-instruct";

async function query(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`query ${res.status}: ${text}`);
  return JSON.parse(text);
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

async function listMigrations() {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/migrations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`list migrations ${res.status}: ${await res.text()}`);
  return res.json();
}

const migrationSql = readFileSync(resolve(root, "supabase/migrations/003_llm_fallback.sql"), "utf8");

const applied = await listMigrations();
const appliedNames = new Set(applied.map((m) => m.name));

if (!appliedNames.has("003_llm_fallback")) {
  console.log("Aplicando migration 003_llm_fallback...");
  await applyMigration("003_llm_fallback", migrationSql);
  console.log("  OK");
} else {
  console.log("Migration 003_llm_fallback já aplicada — garantindo colunas via DDL idempotente...");
  await query(migrationSql);
  console.log("  OK");
}

const columns = await query(`
  SELECT column_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'llm_config'
    AND column_name IN ('model_2', 'model_3')
  ORDER BY column_name;
`);
console.log("Colunas fallback:", columns.map((c) => c.column_name).join(", ") || "(nenhuma)");

const rows = await query(`SELECT id, model, model_2, model_3 FROM llm_config LIMIT 1`);

if (!rows.length) {
  console.log("Nenhuma linha em llm_config — inserindo defaults...");
  await query(`
    INSERT INTO llm_config (id, model, model_2, model_3)
    VALUES (1, 'openai/gpt-4o-mini', '${DEFAULT_MODEL_2}', '${DEFAULT_MODEL_3}')
    ON CONFLICT (id) DO NOTHING;
  `);
} else {
  const row = rows[0];
  const needsUpdate = !row.model_2?.trim() && !row.model_3?.trim();
  if (needsUpdate) {
    console.log("Preenchendo model_2/model_3 vazios com defaults editáveis...");
    await query(`
      UPDATE llm_config
      SET model_2 = '${DEFAULT_MODEL_2}',
          model_3 = '${DEFAULT_MODEL_3}',
          updated_at = now()
      WHERE id = 1
        AND coalesce(trim(model_2), '') = ''
        AND coalesce(trim(model_3), '') = '';
    `);
  } else {
    console.log("Fallbacks já configurados no banco.");
  }
}

const final = await query(`SELECT id, model, model_2, model_3 FROM llm_config LIMIT 1`);
console.log("Estado final:", JSON.stringify(final[0], null, 2));
