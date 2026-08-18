import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { logEvent } from "@/lib/api/logs.server";
import { requireUser } from "@/lib/require-user";
import { DEFAULT_TIMEZONE } from "@/lib/timezone";

export const getProfile = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string() }))
  .handler(async ({ data }: { data: { accessToken: string } }) => {
    const auth = await requireUser(data.accessToken);
    if ("error" in auth) return null;

    const { data: profile } = await auth.supabase
      .from("profiles")
      .select(
      "id, email, display_name, role, avatar_url, company_id, team_id, timezone, privacy_consent_at, privacy_consent_version, onboarding_completed_at, is_active, privacy_ai_opt_in, privacy_rh_opt_in, privacy_email_opt_in, adult_confirmed_at",
      )
      .eq("id", auth.userId)
      .maybeSingle();

    return profile ?? null;
  });

export const getUserRole = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string() }))
  .handler(async ({ data }: { data: { accessToken: string } }) => {
    const auth = await requireUser(data.accessToken);
    if ("error" in auth) return null;
    return auth.profile?.role ?? null;
  });

export const updateProfile = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      displayName: z.string().min(1).max(100).optional(),
      avatarUrl: z.string().max(500).optional(),
      timezone: z.string().min(1).max(80).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const auth = await requireUser(data.accessToken);
    if ("error" in auth) return { error: "Unauthorized" };

    const payload: Record<string, unknown> = {};
    if (data.displayName !== undefined) payload.display_name = data.displayName;
    if (data.avatarUrl !== undefined) payload.avatar_url = data.avatarUrl;
    if (data.timezone !== undefined) payload.timezone = data.timezone;

    const { error } = await auth.supabase
      .from("profiles")
      .update(payload)
      .eq("id", auth.userId);

    if (error) {
      void logEvent(
        "error",
        "auth.updateProfile",
        `Erro ao atualizar perfil ${auth.userId}`,
        { error: error.message },
        auth.userId,
      );
    }

    return { error: error?.message ?? null };
  });

export const updateEmail = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      email: z.string().email("E-mail inválido"),
    }),
  )
  .handler(async ({ data }) => {
    const auth = await requireUser(data.accessToken);
    if ("error" in auth) return { error: "Unauthorized" };

    const { error } = await auth.supabase.auth.updateUser({ email: data.email });
    if (error) {
      await logEvent(
        "warn",
        "auth.updateEmail",
        `Falha ao alterar email: ${auth.userId}`,
        { error: error.message },
        auth.userId,
      );
    }
    return { error: error?.message ?? null };
  });

export const updatePassword = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      email: z.string().email(),
      currentPassword: z.string().min(1, "Senha atual é obrigatória"),
      newPassword: z.string().min(8, "Nova senha deve ter no mínimo 8 caracteres"),
    }),
  )
  .handler(async ({ data }) => {
    const auth = await requireUser(data.accessToken);
    if ("error" in auth) return { error: "Unauthorized" };

    const { error: signInError } = await auth.supabase.auth.signInWithPassword({
      email: data.email,
      password: data.currentPassword,
    });
    if (signInError) return { error: "Senha atual incorreta" };

    const { error } = await auth.supabase.auth.updateUser({ password: data.newPassword });
    if (error) {
      await logEvent(
        "warn",
        "auth.updatePassword",
        "Falha ao alterar senha",
        { error: error.message },
        auth.userId,
      );
    }
    return { error: error?.message ?? null };
  });

export { DEFAULT_TIMEZONE };
