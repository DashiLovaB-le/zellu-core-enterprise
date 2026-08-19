import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  clearAuthCookies,
  readAccessCookie,
  readRefreshCookie,
  setAuthCookies,
} from "@/lib/supabase/session";

function supabaseUrl() {
  return process.env.VITE_SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL;
}

function supabaseAnonKey() {
  return process.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;
}

export function createAnonClient() {
  const url = supabaseUrl();
  const key = supabaseAnonKey();
  if (!url || !key) {
    throw new Error("createAnonClient: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias.");
  }
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function clientWithToken(accessToken: string) {
  const url = supabaseUrl();
  const key = supabaseAnonKey();
  if (!url || !key) {
    throw new Error("createClient: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias.");
  }
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const anon = createAnonClient();
  const { data, error } = await anon.auth.refreshSession({ refresh_token: refreshToken });
  if (error || !data.session) {
    clearAuthCookies();
    return null;
  }
  setAuthCookies(data.session);
  return data.session.access_token;
}

export async function getRequestAccessToken(): Promise<string | null> {
  const access = readAccessCookie();
  if (access) {
    const probe = clientWithToken(access);
    const { data, error } = await probe.auth.getUser(access);
    if (!error && data.user) return access;
  }

  const refresh = readRefreshCookie();
  if (!refresh) return null;
  return refreshAccessToken(refresh);
}

export async function createClient(accessToken?: string): Promise<SupabaseClient> {
  const token = accessToken || (await getRequestAccessToken());
  if (!token) return createAnonClient();
  return clientWithToken(token);
}
