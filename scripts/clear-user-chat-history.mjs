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
  if (!res.ok) throw new Error(`${res.status}: ${text}`);
  return JSON.parse(text);
}

const users = await query(`
  SELECT p.id, p.display_name, u.email,
         (SELECT count(*)::int FROM chat_messages cm WHERE cm.user_id = p.id) AS chat_count
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  ORDER BY u.created_at ASC;
`);

console.log("Usuários encontrados:", users.length);
for (const user of users) {
  console.log(`- ${user.email} (${user.display_name ?? "sem nome"}): ${user.chat_count} mensagens`);
}

for (const user of users) {
  const deleted = await query(`
    DELETE FROM chat_messages
    WHERE user_id = '${user.id}'
    RETURNING id;
  `);
  const remaining = await query(`
    SELECT count(*)::int AS chat_count
    FROM chat_messages
    WHERE user_id = '${user.id}';
  `);
  console.log(
    `Limpo: ${user.email} — removidas ${deleted.length}, restantes ${remaining[0]?.chat_count ?? 0}`,
  );
}
