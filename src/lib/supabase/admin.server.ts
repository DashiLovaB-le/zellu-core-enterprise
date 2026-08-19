import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.VITE_SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "createAdminClient: env vars VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias."
    );
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
