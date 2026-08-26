import { createClient, getRequestAccessToken } from "@/lib/supabase/server";
import { hasValidPrivacyConsent, type ConsentProfile } from "@/lib/lgpd";

export type AppRole = "companion" | "manager" | "dev" | "admin";

export type ProfileRow = {
  role: AppRole;
  company_id: string | null;
  team_id: string | null;
  display_name: string | null;
  timezone: string | null;
  job_title?: string | null;
  privacy_consent_at: string | null;
  privacy_consent_version: string | null;
  onboarding_completed_at: string | null;
  product_tour_completed_at?: string | null;
  is_active: boolean | null;
  support_channel?: string | null;
  privacy_ai_opt_in?: boolean | null;
  privacy_rh_opt_in?: boolean | null;
  privacy_email_opt_in?: boolean | null;
  adult_confirmed_at?: string | null;
  email?: string | null;
  avatar_url?: string | null;
};

export type AuthedUser = {
  userId: string;
  email: string | null;
  supabase: Awaited<ReturnType<typeof createClient>>;
  profile: ProfileRow | null;
};

/**
 * Identidade a partir do cookie httpOnly (mmc-at / mmc-rt).
 * O JWT não deve ir no body das server functions.
 */
export async function requireUser(): Promise<AuthedUser | { error: string }> {
  const accessToken = await getRequestAccessToken();
  if (!accessToken) return { error: "Unauthorized" };

  const supabase = await createClient(accessToken);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profile && profile.is_active === false) {
    return { error: "Unauthorized" };
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    supabase,
    profile: (profile as ProfileRow | null) ?? null,
  };
}

export async function requireCompanionConsent(): Promise<AuthedUser | { error: string }> {
  const auth = await requireUser();
  if ("error" in auth) return auth;
  const role = auth.profile?.role;
  if (role && role !== "companion") return auth;
  if (!hasValidPrivacyConsent(auth.profile as ConsentProfile | null)) {
    return { error: "Consentimento de privacidade ausente ou desatualizado" };
  }
  return auth;
}

export async function requireRole(
  roles: AppRole[],
): Promise<(AuthedUser & { role: AppRole }) | { error: string }> {
  const auth = await requireUser();
  if ("error" in auth) return auth;
  const role = auth.profile?.role;
  if (!role || !roles.includes(role)) return { error: "Unauthorized" };
  return { ...auth, role };
}

export async function requireManager(): Promise<
  (AuthedUser & { role: AppRole; companyId: string | null; isDev: boolean }) | { error: string }
> {
  const auth = await requireRole(["manager", "dev"]);
  if ("error" in auth) return auth;
  if (auth.role === "dev") {
    return { ...auth, companyId: auth.profile?.company_id ?? null, isDev: true };
  }
  const companyId = auth.profile?.company_id;
  if (!companyId) return { error: "Unauthorized — manager sem empresa" };
  return { ...auth, companyId, isDev: false };
}

export async function requireAdmin(): Promise<(AuthedUser & { role: AppRole }) | { error: string }> {
  return requireRole(["admin", "dev"]);
}

export function isAppRole(value: string | null | undefined): value is AppRole {
  return value === "companion" || value === "manager" || value === "dev" || value === "admin";
}
