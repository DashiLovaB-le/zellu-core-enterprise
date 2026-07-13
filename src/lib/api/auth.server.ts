import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

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
    }

    return { error: error?.message ?? null };
  });

export const getProfile = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string() }))
  .handler(async ({ data }: { data: { accessToken: string } }) => {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient(data.accessToken);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    return profile ?? null;
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
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient(data.accessToken);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { error: "Unauthorized" };

      const payload: Record<string, unknown> = {};
      if (data.displayName !== undefined) payload.display_name = data.displayName;
      if (data.avatarUrl !== undefined) payload.avatar_url = data.avatarUrl;

      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, ...payload })
        .select()
        .single();

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
      } = await supabase.auth.getUser();
      if (!user) return { error: "Unauthorized" };

      const { error } = await supabase.auth.updateUser({ email: data.email });
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

      const { error } = await supabase.auth.updateUser({ password: data.newPassword });
      return { error: error?.message ?? null };
    },
  );
