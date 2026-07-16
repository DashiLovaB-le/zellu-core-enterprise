/**
 * Decodifica o JWT localmente para obter o user id sem roundtrip ao Auth API.
 * O token continua sendo validado pelo Postgres/RLS nas queries.
 */
export function getUserIdFromAccessToken(accessToken: string): string | null {
  const payload = decodeJwtPayload(accessToken);
  if (!payload) return null;

  const exp = payload.exp;
  if (typeof exp === "number" && exp * 1000 < Date.now()) return null;

  return typeof payload.sub === "string" ? payload.sub : null;
}

export function getEmailFromAccessToken(accessToken: string): string | null {
  const payload = decodeJwtPayload(accessToken);
  if (!payload) return null;
  return typeof payload.email === "string" ? payload.email : null;
}

function decodeJwtPayload(accessToken: string): Record<string, unknown> | null {
  try {
    const parts = accessToken.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json =
      typeof atob === "function"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}
