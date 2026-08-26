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

const { data: profiles, error } = await admin
  .from("profiles")
  .select("id, email, avatar_url, role")
  .eq("role", "companion");
if (error) throw new Error(error.message);

let updated = 0;
for (const profile of profiles ?? []) {
  if (profile.avatar_url && profile.avatar_url !== "Amora") continue;
  const { error: updateError } = await admin
    .from("profiles")
    .update({ avatar_url: "Chico" })
    .eq("id", profile.id);
  if (updateError) throw new Error(`${profile.email}: ${updateError.message}`);
  updated++;
}

console.log(JSON.stringify({ companions: profiles?.length ?? 0, updatedToChico: updated }, null, 2));
