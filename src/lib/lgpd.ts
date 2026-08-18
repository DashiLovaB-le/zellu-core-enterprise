import { PRIVACY_CONSENT_VERSION } from "@/lib/privacy";

const FORBIDDEN_DETAIL_KEYS = [
  "mood",
  "humor",
  "sleep",
  "sono",
  "water",
  "email",
  "text",
  "content",
  "diary",
  "chat",
  "password",
  "token",
  "api_key",
  "username",
  "display_name",
  "name",
  "message",
  "body",
];

export function sanitizeLogMessage(message: string): string {
  return message
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      "[id]",
    );
}

export function sanitizeLogDetails(
  details?: Record<string, unknown> | null,
): Record<string, string | number | boolean | null> | null {
  if (!details) return null;
  const out: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(details)) {
    const lower = key.toLowerCase();
    if (FORBIDDEN_DETAIL_KEYS.some((f) => lower.includes(f))) continue;
    if (typeof value === "string") {
      if (value.includes("@")) continue;
      if (value.length > 180) continue;
      out[key] = value;
    } else if (typeof value === "number" || typeof value === "boolean") {
      out[key] = value;
    } else if (value === null) {
      out[key] = null;
    }
  }
  return Object.keys(out).length > 0 ? out : null;
}

export type ConsentProfile = {
  role?: string | null;
  privacy_consent_at?: string | null;
  privacy_consent_version?: string | null;
  adult_confirmed_at?: string | null;
  onboarding_completed_at?: string | null;
  privacy_ai_opt_in?: boolean | null;
  privacy_rh_opt_in?: boolean | null;
  privacy_email_opt_in?: boolean | null;
};

export function hasValidPrivacyConsent(profile: ConsentProfile | null | undefined): boolean {
  if (!profile) return false;
  if (profile.role && profile.role !== "companion") return true;
  return Boolean(
    profile.privacy_consent_at &&
      profile.privacy_consent_version === PRIVACY_CONSENT_VERSION &&
      profile.adult_confirmed_at,
  );
}

export function companionNeedsOnboarding(profile: ConsentProfile | null | undefined): boolean {
  if (!profile) return true;
  if (profile.role && profile.role !== "companion") return false;
  return !hasValidPrivacyConsent(profile) || !profile.onboarding_completed_at;
}
