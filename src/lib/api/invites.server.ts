import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin.server";
import { getAppBaseUrl } from "@/lib/config.server";
import { requireAdmin, requireManager, requireUser } from "@/lib/require-user";
import { logEvent } from "@/lib/api/logs.server";

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function appBaseUrl(): string {
  return getAppBaseUrl();
}

async function assertSeatsAvailable(
  supabase: SupabaseClient,
  companyId: string,
): Promise<string | null> {
  const { data, error } = await supabase.rpc("company_has_available_seat", {
    p_company_id: companyId,
  });
  if (error) return error.message;
  if (data === false) return "Limite de licenças atingido.";
  return null;
}

export const createInvite = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      email: z.string().email(),
      role: z.enum(["companion", "manager"]),
      teamId: z.string().uuid().nullable().optional(),
      companyId: z.string().uuid().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const manager = await requireManager();
    const adminAuth = await requireAdmin();
    const isAdmin = !("error" in adminAuth);

    let companyId: string | null = null;
    let userId: string;
    let supabase: SupabaseClient;

    if (isAdmin) {
      userId = adminAuth.userId;
      companyId = data.companyId ?? adminAuth.profile?.company_id ?? null;
      supabase = adminAuth.supabase;
      if (!companyId) return { error: "Informe a empresa do convite.", inviteUrl: null };
    } else if (!("error" in manager)) {
      userId = manager.userId;
      companyId = manager.companyId;
      supabase = manager.supabase;
    } else {
      return { error: "Unauthorized", inviteUrl: null };
    }

    if (!companyId) return { error: "Empresa não encontrada.", inviteUrl: null };

    const seatError = await assertSeatsAvailable(supabase, companyId);
    if (seatError) return { error: seatError, inviteUrl: null };

    const token = randomToken();
    const expires = new Date(Date.now() + 7 * 86400000).toISOString();

    const { data: row, error } = await supabase
      .from("invites")
      .insert({
        company_id: companyId,
        team_id: data.teamId ?? null,
        email: data.email.toLowerCase().trim(),
        role: data.role,
        token,
        invited_by: userId,
        expires_at: expires,
      })
      .select("id, email, role, expires_at, token")
      .single();

    if (error) return { error: error.message, inviteUrl: null };

    const inviteUrl = `${appBaseUrl()}/aceitar-convite?token=${token}`;
    void logEvent(
      "info",
      "invites.createInvite",
      "Convite criado",
      { company_id: companyId, role: data.role },
      userId,
    );

    return { error: null, inviteUrl, invite: row };
  });

export const listInvites = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      companyId: z.string().uuid().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const adminAuth = await requireAdmin();
    if (!("error" in adminAuth)) {
      const companyId = data.companyId ?? adminAuth.profile?.company_id ?? null;
      let query = adminAuth.supabase
        .from("invites")
        .select("id, email, role, team_id, expires_at, accepted_at, created_at, company_id")
        .order("created_at", { ascending: false });
      if (companyId) query = query.eq("company_id", companyId);
      const { data: rows, error } = await query;
      return { data: rows ?? [], error: error?.message ?? null };
    }

    const manager = await requireManager();
    if ("error" in manager) return { data: [], error: manager.error };
    let query = manager.supabase
      .from("invites")
      .select("id, email, role, team_id, expires_at, accepted_at, created_at, company_id")
      .order("created_at", { ascending: false });
    if (manager.companyId) query = query.eq("company_id", manager.companyId);
    const { data: rows, error } = await query;
    return { data: rows ?? [], error: error?.message ?? null };
  });

export const getInviteByToken = createServerFn({ method: "POST" })
  .inputValidator(z.object({ token: z.string().min(16) }))
  .handler(async ({ data }) => {
    const { createAnonClient } = await import("@/lib/supabase/server");
    const supabase = createAnonClient();
    const { data: invite, error } = await supabase.rpc("get_invite_public", {
      p_token: data.token,
    });

    const row = Array.isArray(invite) ? invite[0] : invite;
    if (error || !row) return { data: null, error: "Convite inválido." };
    if (row.accepted_at) return { data: null, error: "Este convite já foi usado." };
    if (new Date(row.expires_at) < new Date()) return { data: null, error: "Convite expirado." };

    return {
      data: {
        email: row.email,
        role: row.role,
        companyName: row.company_name ?? "sua empresa",
      },
      error: null,
    };
  });

export const acceptInvite = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      token: z.string().min(16),
      password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
      displayName: z.string().min(1).max(100).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const admin = createAdminClient();
    const { data: invite } = await admin
      .from("invites")
      .select("id, email, role, team_id, company_id, expires_at, accepted_at")
      .eq("token", data.token)
      .maybeSingle();

    if (!invite) return { error: "Convite inválido." };
    if (invite.accepted_at) return { error: "Este convite já foi usado." };
    if (new Date(invite.expires_at) < new Date()) return { error: "Convite expirado." };

    const email = invite.email.toLowerCase();
    const displayName = data.displayName ?? email.split("@")[0];

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    });

    let userId = created?.user?.id ?? null;

    if (createError || !userId) {
      const { data: users } = await admin.auth.admin.listUsers();
      const existing = users?.users?.find((u) => u.email?.toLowerCase() === email);
      if (!existing) {
        return { error: createError?.message ?? "Não foi possível criar a conta." };
      }
      userId = existing.id;
    }

    const { error: profileError } = await admin.from("profiles").upsert({
      id: userId,
      email,
      display_name: displayName,
      role: invite.role,
      company_id: invite.company_id,
      team_id: invite.team_id,
      is_active: true,
    });

    if (profileError) return { error: profileError.message };

    await admin.from("invites").update({ accepted_at: new Date().toISOString() }).eq("id", invite.id);

    const { data: license } = await admin
      .from("licenses")
      .select("id, seats_used")
      .eq("company_id", invite.company_id)
      .in("status", ["active", "trial"])
      .limit(1)
      .maybeSingle();
    if (license) {
      await admin
        .from("licenses")
        .update({ seats_used: (license.seats_used ?? 0) + 1 })
        .eq("id", license.id);
    }

    void logEvent(
      "info",
      "invites.acceptInvite",
      "Convite aceito",
      { company_id: invite.company_id, role: invite.role },
      userId,
    );

    return { error: null, email };
  });

export const setEmployeeActive = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      profileId: z.string().uuid(),
      isActive: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    const manager = await requireManager();
    const adminAuth = await requireAdmin();
    const isAdmin = !("error" in adminAuth);
    if ("error" in manager && !isAdmin) return { error: manager.error };

    const actor = isAdmin ? adminAuth : manager;
    if ("error" in actor) return { error: actor.error };

    const { error } = await actor.supabase.rpc("set_employee_active", {
      p_profile_id: data.profileId,
      p_active: data.isActive,
    });

    void logEvent(
      "info",
      "invites.setEmployeeActive",
      `is_active=${data.isActive} para ${data.profileId}`,
      {},
      actor.userId,
    );

    return { error: error?.message ?? null };
  });

export const listCompanyMembers = createServerFn({ method: "POST" }).handler(async () => {
    const auth = await requireManager();
    if ("error" in auth) return { data: [], error: auth.error };
    if (!auth.companyId && !auth.isDev) return { data: [], error: "Unauthorized" };

    const { data: rows, error } = await auth.supabase.rpc("list_company_directory");
    if (error) return { data: [], error: error.message };
    return { data: rows ?? [], error: null };
  });

export const completeOnboarding = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      displayName: z.string().min(1).max(100),
      timezone: z.string().min(1).max(80),
    }),
  )
  .handler(async ({ data }) => {
    const auth = await requireUser();
    if ("error" in auth) return { error: "Unauthorized" };

    const { error } = await auth.supabase
      .from("profiles")
      .update({
        display_name: data.displayName,
        timezone: data.timezone,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq("id", auth.userId);

    return { error: error?.message ?? null };
  });
