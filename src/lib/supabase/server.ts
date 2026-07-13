import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function createClient(accessToken: string) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

  const supabase = createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });

  return supabase;
}
