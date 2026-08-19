import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";

const ACCESS_COOKIE = "mmc-at";
const REFRESH_COOKIE = "mmc-rt";

function isSecure() {
  if (process.env.VERCEL_ENV === "development") return false;
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: isSecure(),
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function readAccessCookie(): string | undefined {
  return getCookie(ACCESS_COOKIE);
}

export function readRefreshCookie(): string | undefined {
  return getCookie(REFRESH_COOKIE);
}

export function setAuthCookies(session: {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
}) {
  const accessMaxAge = Math.max(60, (session.expires_in ?? 3600) - 30);
  setCookie(ACCESS_COOKIE, session.access_token, cookieOptions(accessMaxAge));
  setCookie(REFRESH_COOKIE, session.refresh_token, cookieOptions(60 * 60 * 24 * 14));
}

export function clearAuthCookies() {
  deleteCookie(ACCESS_COOKIE);
  deleteCookie(REFRESH_COOKIE);
}
