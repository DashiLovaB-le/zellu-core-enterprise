import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin.server";
import { requireAdmin, requireCompanionConsent, requireUser } from "@/lib/require-user";
import { PRIVACY_CONSENT_VERSION, RETENTION_DAYS } from "@/lib/privacy";
import { logEvent } from "@/lib/api/logs.server";
import { executeRetentionPurge } from "@/lib/retention";

export type PrivacyPreferences = {
  aiOptIn: boolean;
  rhOptIn: boolean;
  emailOptIn: boolean;
};

function readPrivacyPreferences(profile: {
  privacy_ai_opt_in?: boolean | null;
  privacy_rh_opt_in?: boolean | null;
  privacy_email_opt_in?: boolean | null;
} | null): PrivacyPreferences {
  return {
    aiOptIn: profile?.privacy_ai_opt_in === true,
    rhOptIn: profile?.privacy_rh_opt_in === true,
    emailOptIn: profile?.privacy_email_opt_in === true,
  };
}

export const getPrivacyPreferences = createServerFn({ method: "GET" }).handler(async () => {
  const auth = await requireUser();
  if ("error" in auth) return { error: "Unauthorized" as const, preferences: null };
  return { error: null, preferences: readPrivacyPreferences(auth.profile) };
});

export const savePrivacyConsent = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      adultConfirmed: z.literal(true),
      aiOptIn: z.boolean(),
      rhOptIn: z.boolean(),
      emailOptIn: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    const auth = await requireUser();
    if ("error" in auth) return { error: "Unauthorized" };

    const now = new Date().toISOString();
    const { error } = await auth.supabase
      .from("profiles")
      .update({
        privacy_consent_at: now,
        privacy_consent_version: PRIVACY_CONSENT_VERSION,
        adult_confirmed_at: now,
        privacy_ai_opt_in: data.aiOptIn,
        privacy_rh_opt_in: data.rhOptIn,
        privacy_email_opt_in: data.emailOptIn,
      })
      .eq("id", auth.userId);

    return { error: error?.message ?? null };
  });

export const updatePrivacyPreferences = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      aiOptIn: z.boolean().optional(),
      rhOptIn: z.boolean().optional(),
      emailOptIn: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const auth = await requireUser();
    if ("error" in auth) return { error: "Unauthorized" };

    const payload: Record<string, boolean> = {};
    if (data.aiOptIn !== undefined) payload.privacy_ai_opt_in = data.aiOptIn;
    if (data.rhOptIn !== undefined) payload.privacy_rh_opt_in = data.rhOptIn;
    if (data.emailOptIn !== undefined) payload.privacy_email_opt_in = data.emailOptIn;
    if (Object.keys(payload).length === 0) {
      return { error: null, preferences: readPrivacyPreferences(auth.profile) };
    }

    const { data: updated, error } = await auth.supabase
      .from("profiles")
      .update(payload)
      .eq("id", auth.userId)
      .select("privacy_ai_opt_in, privacy_rh_opt_in, privacy_email_opt_in")
      .single();

    if (error) {
      void logEvent(
        "warn",
        "privacy.updatePrivacyPreferences",
        "Falha ao salvar preferências LGPD",
        { error: error.message, payload },
        auth.userId,
      );
      return { error: error.message, preferences: null };
    }

    return { error: null, preferences: readPrivacyPreferences(updated) };
  });

export const withdrawPrivacyConsent = createServerFn({ method: "POST" })

  .handler(async ({ data }) => {
    const auth = await requireUser();
    if ("error" in auth) return { error: "Unauthorized" };

    const { error } = await auth.supabase
      .from("profiles")
      .update({
        privacy_consent_at: null,
        privacy_consent_version: null,
        privacy_ai_opt_in: false,
        privacy_rh_opt_in: false,
        privacy_email_opt_in: false,
      })
      .eq("id", auth.userId);

    return { error: error?.message ?? null };
  });

export const exportMyData = createServerFn({ method: "POST" })

  .handler(async ({ data }) => {
    const auth = await requireCompanionConsent();
    if ("error" in auth) return { error: auth.error, data: null };
    const { supabase, userId } = auth;

    const [profile, checkins, habits, diary, chat, plans, checklist, preventive, memories] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id, email, display_name, role, timezone, company_id, team_id, privacy_consent_at, privacy_consent_version, privacy_ai_opt_in, privacy_rh_opt_in, privacy_email_opt_in, adult_confirmed_at, onboarding_completed_at, created_at",
        )
        .eq("id", userId)
        .maybeSingle(),
      supabase.from("checkins").select("*").eq("user_id", userId),
      supabase.from("habits").select("*").eq("user_id", userId),
      supabase.from("diary_entries").select("*").eq("user_id", userId),
      supabase.from("chat_messages").select("*").eq("user_id", userId),
      supabase.from("wellness_plans").select("*").eq("user_id", userId),
      supabase.from("wellness_checklist").select("*").eq("user_id", userId),
      supabase.from("preventive_notifications").select("*").eq("user_id", userId),
      supabase.from("companion_memories").select("*").eq("user_id", userId),
    ]);

    return {
      error: null,
      data: {
        exportedAt: new Date().toISOString(),
        retentionDays: RETENTION_DAYS,
        profile: profile.data,
        checkins: checkins.data ?? [],
        habits: habits.data ?? [],
        diary_entries: diary.data ?? [],
        chat_messages: chat.data ?? [],
        wellness_plans: plans.data ?? [],
        wellness_checklist: checklist.data ?? [],
        preventive_notifications: preventive.data ?? [],
        companion_memories: memories.data ?? [],
      },
    };
  });

export const deleteMyAccount = createServerFn({ method: "POST" })

  .handler(async ({ data }) => {
    const auth = await requireUser();
    if ("error" in auth) return { error: "Unauthorized" };

    const admin = createAdminClient();
    await admin.from("system_logs").delete().eq("user_id", auth.userId);
    await admin.auth.admin.signOut(auth.userId, "global").catch(() => undefined);

    const { error } = await admin.auth.admin.deleteUser(auth.userId);
    if (error) {
      void logEvent(
        "error",
        "privacy.deleteMyAccount",
        "Falha ao excluir conta",
        { error: error.message },
        auth.userId,
      );
      return { error: error.message };
    }

    void logEvent("info", "privacy.deleteMyAccount", "Conta excluída", {});
    return { error: null };
  });

export const purgeExpiredPersonalData = createServerFn({ method: "POST" })

  .handler(async ({ data }) => {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };
    return executeRetentionPurge(auth.userId);
  });
