import { createBrowserClient } from "@supabase/ssr";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  const url = import.meta.env.VITE_SUPABASE_URL!;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY!;
  if (typeof window === "undefined") {
    return createBrowserClient(url, key);
  }
  if (!browserClient) {
    browserClient = createBrowserClient(url, key);
  }
  return browserClient;
}
