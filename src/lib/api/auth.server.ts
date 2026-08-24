import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { logEvent } from "@/lib/api/logs.server";
import { requireUser, type AppRole, type ProfileRow } from "@/lib/require-user";
import { DEFAULT_TIMEZONE } from "@/lib/timezone";
import { createAnonClient, createClient } from "@/lib/supabase/server";
import { clearAuthCookies, setAuthCookies } from "@/lib/supabase/session";

export type AuthSnapshot = {
  user: { id: string; email: string | null; avatar_url: string | null };
  role: AppRole | null;
  profile: ProfileRow | null;
};

export const getAuthSnapshot = createServerFn({ method: "GET" }).handler(async () => {
  const auth = await requireUser();
  if ("error" in auth) return null;
  return {
    user: {
      id: auth.userId,
      email: auth.email,
      avatar_url: auth.profile?.avatar_url ?? null,
    },
    role: auth.profile?.role ?? null,
    profile: auth.profile,
  } satisfies AuthSnapshot;
});

export const signInWithPassword = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const supabase = createAnonClient();
    const { data: result, error } = await supabase.auth.signInWithPassword({
      email: data.email.trim().toLowerCase(),
      password: data.password,
    });
    if (error || !result.session || !result.user) {
      return { error: error?.message ?? "Não foi possível entrar.", snapshot: null };
    }

    setAuthCookies(result.session);

    const authed = await createClient(result.session.access_token);
    const { data: profile } = await authed
      .from("profiles")
      .select("*")
      .eq("id", result.user.id)
      .maybeSingle();

    if (profile && profile.is_active === false) {
      clearAuthCookies();
      return { error: "Unauthorized", snapshot: null };
    }

    const role = (profile?.role as AppRole | undefined) ?? null;
    return {
      error: null,
      snapshot: {
        user: {
          id: result.user.id,
          email: result.user.email ?? null,
          avatar_url: (profile?.avatar_url as string | null) ?? null,
        },
        role,
        profile: (profile as ProfileRow | null) ?? null,
      } satisfies AuthSnapshot,
    };
  });

export const signOutSession = createServerFn({ method: "POST" }).handler(async () => {
  const auth = await requireUser();
  if (!("error" in auth)) {
    await auth.supabase.auth.signOut();
  }
  clearAuthCookies();
  return { error: null };
});

export const getProfile = createServerFn({ method: "GET" }).handler(async () => {
  const auth = await requireUser();
  if ("error" in auth) return null;
  return auth.profile ?? null;
});

export const getUserRole = createServerFn({ method: "GET" }).handler(async () => {
  const auth = await requireUser();
  if ("error" in auth) return null;
  return auth.profile?.role ?? null;
});

export const updateProfile = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      displayName: z.string().min(1).max(100).optional(),
      avatarUrl: z.string().max(500).optional(),
      timezone: z.string().min(1).max(80).optional(),
      jobTitle: z.string().max(100).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const auth = await requireUser();
    if ("error" in auth) return { error: "Unauthorized" };

    const payload: Record<string, unknown> = {};
    if (data.displayName !== undefined) payload.display_name = data.displayName;
    if (data.avatarUrl !== undefined) payload.avatar_url = data.avatarUrl;
    if (data.timezone !== undefined) payload.timezone = data.timezone;
    if (data.jobTitle !== undefined) {
      const trimmed = data.jobTitle.trim();
      payload.job_title = trimmed.length > 0 ? trimmed : null;
    }

    const { error } = await auth.supabase.from("profiles").update(payload).eq("id", auth.userId);

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
      email: z.string().email("E-mail inválido"),
    }),
  )
  .handler(async ({ data }) => {
    const auth = await requireUser();
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
      email: z.string().email(),
      currentPassword: z.string().min(1, "Senha atual é obrigatória"),
      newPassword: z.string().min(8, "Nova senha deve ter no mínimo 8 caracteres"),
    }),
  )
  .handler(async ({ data }) => {
    const auth = await requireUser();
    if ("error" in auth) return { error: "Unauthorized" };

    const probe = createAnonClient();
    const { error: signInError } = await probe.auth.signInWithPassword({
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
