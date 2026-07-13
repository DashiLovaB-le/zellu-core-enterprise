import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = import.meta.env.VITE_SUPABASE_URL!;
  const key = import.meta.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
