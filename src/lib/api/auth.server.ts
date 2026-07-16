import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin.server";
import { logEvent } from "@/lib/api/logs.server";
import { getUserIdFromAccessToken } from "@/lib/auth-token";

export const confirmUser = createServerFn({ method: "POST" })
  .inputValidator(z.object({ userId: z.string().uuid() }))
  .handler(async ({ data }: { data: { userId: string } }) => {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(data.userId, {
      email_confirm: true,
    });

    if (!error) {
      const { data: userData } = await admin.auth.admin.getUserById(data.userId);
      const email = userData?.user?.email ?? "";
      const role = (userData?.user?.user_metadata?.role as string) ?? "companion";
      await admin.from("profiles").upsert({
        id: data.userId,
        email,
        display_name: email.split("@")[0],
        role,
      });
      await logEvent("info", "auth.confirmUser", `Usuário confirmado: ${email}`, { role }, data.userId);
    } else {
      await logEvent("error", "auth.confirmUser", `Falha ao confirmar usuário ${data.userId}`, { error: error.message });
    }

    return { error: error?.message ?? null };
  });

export const getProfile = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string() }))
  .handler(async ({ data }: { data: { accessToken: string } }) => {
    const userId = getUserIdFromAccessToken(data.accessToken);
    if (!userId) return null;

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient(data.accessToken);

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, display_name, role, avatar_url")
      .eq("id", userId)
      .maybeSingle();

    return profile ?? null;
  });

export const getUserRole = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string() }))
  .handler(async ({ data }: { data: { accessToken: string } }) => {
    const userId = getUserIdFromAccessToken(data.accessToken);
    if (!userId) return null;

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient(data.accessToken);

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    return (profile?.role as "companion" | "manager" | "dev" | "admin") ?? null;
  });

export const updateProfile = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      displayName: z.string().min(1).max(100).optional(),
      avatarUrl: z.string().max(500).optional(),
    }),
  )
  .handler(
    async ({
      data,
    }: {
      data: { accessToken: string; displayName?: string; avatarUrl?: string };
    }) => {
      const userId = getUserIdFromAccessToken(data.accessToken);
      if (!userId) return { error: "Unauthorized" };

      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient(data.accessToken);

      const payload: Record<string, unknown> = {};
      if (data.displayName !== undefined) payload.display_name = data.displayName;
      if (data.avatarUrl !== undefined) payload.avatar_url = data.avatarUrl;

      const { error } = await supabase
        .from("profiles")
        .upsert({ id: userId, ...payload })
        .select("id")
        .single();

      if (error) {
        void logEvent("error", "auth.updateProfile", `Erro ao atualizar perfil ${userId}`, { error: error.message }, userId);
      } else {
        void logEvent("info", "auth.updateProfile", `Perfil atualizado: ${userId}`, { payload }, userId);
      }

      return { error: error?.message ?? null };
    },
  );

export const updateEmail = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      email: z.string().email("E-mail inválido"),
    }),
  )
  .handler(
    async ({
      data,
    }: {
      data: { accessToken: string; email: string };
    }) => {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient(data.accessToken);
      const {
        data: { user },
      } = await supabase.auth.getUser(data.accessToken);
      if (!user) return { error: "Unauthorized" };

      const { error } = await supabase.auth.updateUser({ email: data.email });

      if (error) {
        await logEvent("warn", "auth.updateEmail", `Falha ao alterar email: ${user.id}`, { error: error.message }, user.id);
      } else {
        await logEvent("info", "auth.updateEmail", `Email alterado: ${user.id}`, {}, user.id);
      }

      return { error: error?.message ?? null };
    },
  );

export const updatePassword = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      email: z.string().email(),
      currentPassword: z.string().min(1, "Senha atual é obrigatória"),
      newPassword: z.string().min(6, "Nova senha deve ter no mínimo 6 caracteres"),
    }),
  )
  .handler(
    async ({
      data,
    }: {
      data: { accessToken: string; email: string; currentPassword: string; newPassword: string };
    }) => {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient(data.accessToken);

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.currentPassword,
      });
      if (signInError) return { error: "Senha atual incorreta" };

      const {
        data: { user },
      } = await supabase.auth.getUser(data.accessToken);

      const { error } = await supabase.auth.updateUser({ password: data.newPassword });

      if (error) {
        await logEvent("warn", "auth.updatePassword", `Falha ao alterar senha`, { error: error.message }, user?.id);
      } else {
        await logEvent("info", "auth.updatePassword", `Senha alterada`, {}, user?.id);
      }

      return { error: error?.message ?? null };
    },
  );
