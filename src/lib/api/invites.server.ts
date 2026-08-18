import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin.server";
import { requireAdmin, requireManager, requireUser } from "@/lib/require-user";
import { logEvent } from "@/lib/api/logs.server";

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function appBaseUrl(): string {
  return (
    process.env.APP_BASE_URL ??
    process.env.VITE_APP_URL ??
    "http://localhost:8080"
  ).replace(/\/$/, "");
}

async function assertSeatsAvailable(companyId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data: license } = await admin
    .from("licenses")
    .select("seats, seats_used, status")
    .eq("company_id", companyId)
    .in("status", ["active", "trial"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { count: activeCount } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("is_active", true);

  const { count: pendingCount } = await admin
    .from("invites")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString());

  const used = (activeCount ?? 0) + (pendingCount ?? 0);
  const seats = license?.seats ?? 50;
  if (used >= seats) {
    return `Limite de licenças atingido (${used}/${seats}).`;
  }
  return null;
}

export const createInvite = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      email: z.string().email(),
      role: z.enum(["companion", "manager"]),
      teamId: z.string().uuid().nullable().optional(),
      companyId: z.string().uuid().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const manager = await requireManager(data.accessToken);
    const adminAuth = await requireAdmin(data.accessToken);
    const isAdmin = !("error" in adminAuth);

    let companyId: string | null = null;
    let userId: string;

    if (isAdmin) {
      userId = adminAuth.userId;
      companyId = data.companyId ?? adminAuth.profile?.company_id ?? null;
      if (!companyId) return { error: "Informe a empresa do convite.", inviteUrl: null };
    } else if (!("error" in manager)) {
      userId = manager.userId;
      companyId = manager.companyId;
      if (data.role === "manager" && manager.role !== "dev") {
        // manager pode convidar managers da própria empresa
      }
    } else {
      return { error: "Unauthorized", inviteUrl: null };
    }

    if (!companyId) return { error: "Empresa não encontrada.", inviteUrl: null };

    const seatError = await assertSeatsAvailable(companyId);
    if (seatError) return { error: seatError, inviteUrl: null };

    const admin = createAdminClient();
    const token = randomToken();
    const expires = new Date(Date.now() + 7 * 86400000).toISOString();

    const { data: row, error } = await admin
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
      accessToken: z.string(),
      companyId: z.string().uuid().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const manager = await requireManager(data.accessToken);
    const adminAuth = await requireAdmin(data.accessToken);
    const isAdmin = !("error" in adminAuth);
    if (!isAdmin && "error" in manager) return { data: [], error: manager.error };

    const companyId = isAdmin
      ? (data.companyId ?? adminAuth.profile?.company_id ?? null)
      : !("error" in manager)
        ? manager.companyId
        : null;

    const client = isAdmin
      ? createAdminClient()
      : !("error" in manager)
        ? manager.supabase
        : createAdminClient();
    let query = client
      .from("invites")
      .select("id, email, role, team_id, expires_at, accepted_at, created_at, company_id")
      .order("created_at", { ascending: false });
    if (companyId) query = query.eq("company_id", companyId);

    const { data: rows, error } = await query;
    return { data: rows ?? [], error: error?.message ?? null };
  });

export const getInviteByToken = createServerFn({ method: "POST" })
  .inputValidator(z.object({ token: z.string().min(16) }))
  .handler(async ({ data }) => {
    const admin = createAdminClient();
    const { data: invite } = await admin
      .from("invites")
      .select("id, email, role, team_id, company_id, expires_at, accepted_at")
      .eq("token", data.token)
      .maybeSingle();

    if (!invite) return { data: null, error: "Convite inválido." };
    if (invite.accepted_at) return { data: null, error: "Este convite já foi usado." };
    if (new Date(invite.expires_at) < new Date()) return { data: null, error: "Convite expirado." };

    const { data: company } = await admin
      .from("companies")
      .select("name")
      .eq("id", invite.company_id)
      .maybeSingle();

    return {
      data: {
        email: invite.email,
        role: invite.role,
        companyName: company?.name ?? "sua empresa",
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
      accessToken: z.string(),
      profileId: z.string().uuid(),
      isActive: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    const manager = await requireManager(data.accessToken);
    const adminAuth = await requireAdmin(data.accessToken);
    const isAdmin = !("error" in adminAuth);
    if ("error" in manager && !isAdmin) return { error: manager.error };

    const admin = createAdminClient();
    const { data: target } = await admin
      .from("profiles")
      .select("id, company_id, role")
      .eq("id", data.profileId)
      .maybeSingle();

    if (!target) return { error: "Colaborador não encontrado." };
    if (!isAdmin) {
      if ("error" in manager) return { error: manager.error };
      if (target.company_id !== manager.companyId) return { error: "Unauthorized" };
    }
    if (target.role === "admin" || target.role === "dev") return { error: "Unauthorized" };

    const { error } = await admin
      .from("profiles")
      .update({ is_active: data.isActive })
      .eq("id", data.profileId);

    const actorId = isAdmin ? adminAuth.userId : "error" in manager ? undefined : manager.userId;

    void logEvent(
      "info",
      "invites.setEmployeeActive",
      `is_active=${data.isActive} para ${data.profileId}`,
      { company_id: target.company_id },
      actorId,
    );

    return { error: error?.message ?? null };
  });

export const listCompanyMembers = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string() }))
  .handler(async ({ data }) => {
    const auth = await requireManager(data.accessToken);
    if ("error" in auth) return { data: [], error: auth.error };
    if (!auth.companyId && !auth.isDev) return { data: [], error: "Unauthorized" };

    let query = auth.supabase
      .from("profiles")
      .select("id, email, display_name, role, team_id, is_active, company_id")
      .in("role", ["companion", "manager"])
      .order("display_name");
    if (auth.companyId) query = query.eq("company_id", auth.companyId);

    const { data: rows, error } = await query;
    return { data: rows ?? [], error: error?.message ?? null };
  });

export const completeOnboarding = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      displayName: z.string().min(1).max(100),
      timezone: z.string().min(1).max(80),
    }),
  )
  .handler(async ({ data }) => {
    const auth = await requireUser(data.accessToken);
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
