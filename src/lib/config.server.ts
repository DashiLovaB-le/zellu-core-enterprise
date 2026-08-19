// Server-only config. The .server.ts suffix prevents Vite from bundling
// this file into the client — values here never reach the browser.
//
// On Cloudflare Workers, env binds at REQUEST time. Module-scope reads
// (e.g. `const x = process.env.X`) resolve to undefined — always read
// process.env INSIDE a function or handler.
//
// When to use which env-access pattern:
//   - .server.ts module (this file): server-only helpers reused across
//     handlers. Wrap reads in a function so they run per-request.
//   - inline process.env inside a createServerFn handler: one-off reads
//     not reused elsewhere.
//   - import.meta.env.VITE_FOO: PUBLIC config readable from both client
//     and server (analytics IDs, public URLs). Define in .env with the
//     VITE_ prefix. Never put secrets here — they ship to the browser.

function vercelHostUrl(host: string | undefined): string | undefined {
  if (!host) return undefined;
  return (host.startsWith("http") ? host : `https://${host}`).replace(/\/$/, "");
}

/** URL canônica do app (convites, cron). Em preview usa o host do deploy. */
export function getAppBaseUrl(): string {
  const explicit = process.env.APP_BASE_URL ?? process.env.VITE_APP_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const productionHost = vercelHostUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  const deployHost = vercelHostUrl(process.env.VERCEL_URL);
  if (process.env.VERCEL_ENV === "production") {
    return productionHost ?? deployHost ?? "http://localhost:8080";
  }
  return deployHost ?? productionHost ?? "http://localhost:8080";
}

export function getServerConfig() {
  return {
    nodeEnv: process.env.NODE_ENV,
    appBaseUrl: getAppBaseUrl(),
  };
}
