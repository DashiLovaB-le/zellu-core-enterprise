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
    out[line.slice(0, idx).trim()] = line
      .slice(idx + 1)
      .trim()
      .replace(/^"|"$/g, "");
  }
  return out;
}

const env = loadEnv(envPath);
const token = env.TOKEN_SUPABASE;
const projectRef = env.PROJETO_SUPABASE;
if (!token) throw new Error("TOKEN_SUPABASE ausente no .env");
if (!projectRef) throw new Error("PROJETO_SUPABASE ausente no .env");

const name = process.argv[2] ?? "019_work_factor_responses";
const sql = readFileSync(resolve(root, `supabase/migrations/${name}.sql`), "utf8");

async function listMigrations() {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/migrations`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (!res.ok)
    throw new Error(`list migrations ${res.status}: ${(await res.text()).slice(0, 500)}`);
  return res.json();
}

async function applyMigration(migrationName, query) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/migrations`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: migrationName, query }),
    },
  );
  const text = await res.text();
  if (!res.ok) throw new Error(`${migrationName} ${res.status}: ${text.slice(0, 1200)}`);
  return text;
}

const applied = await listMigrations();
const names = new Set(applied.map((m) => m.name));
if (names.has(name)) {
  console.log(`Skip ${name} (já aplicada)`);
} else {
  console.log(`Applying ${name}...`);
  await applyMigration(name, sql);
  console.log("OK");
}

const after = await listMigrations();
console.log(
  after.some((m) => m.name === name)
    ? "Confirmada na lista de migrations"
    : "Não apareceu na lista",
);
