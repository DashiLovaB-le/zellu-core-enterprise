import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sendTransactionalEmail } from "@/lib/email.server";
import { createAdminClient } from "@/lib/supabase/admin.server";
import { requireAdmin } from "@/lib/require-user";
import { COMPANY_SIZES, companySizeLabel, type CompanySize } from "@/lib/landing-leads";

const LeadInput = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(80),
  email: z.string().trim().email("Informe um e-mail válido."),
  company: z.string().trim().min(2, "Informe a empresa.").max(120),
  companySize: z.enum(COMPANY_SIZES, {
    errorMap: () => ({ message: "Escolha o número de colaboradores." }),
  }),
  website: z.string().max(200).optional(),
});

const LEAD_COLUMNS =
  "id, name, email, company, company_size, status, notes, email_status, email_error, contacted_at, created_at, updated_at";

export const LANDING_LEAD_STATUSES = [
  "new",
  "contacted",
  "in_progress",
  "qualified",
  "converted",
  "archived",
] as const;

export type LandingLeadStatus = (typeof LANDING_LEAD_STATUSES)[number];

export type LandingLeadEmailStatus = "pending" | "sent" | "skipped" | "failed";

export type LandingLead = {
  id: string;
  name: string;
  email: string;
  company: string;
  company_size: CompanySize | null;
  status: LandingLeadStatus;
  notes: string | null;
  email_status: LandingLeadEmailStatus;
  email_error: string | null;
  contacted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SubmitLandingLeadResult =
  | { ok: true; delivered: boolean }
  | { ok: false; error: string };

function leadsInbox(): string {
  const to = process.env.LEADS_TO_EMAIL?.trim();
  return to && to.length > 3 ? to : "privacidade@zellu.app";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function persistLead(row: {
  name: string;
  email: string;
  company: string;
  companySize: CompanySize;
}): Promise<{ id: string } | { error: string }> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("landing_leads")
      .insert({
        name: row.name,
        email: row.email,
        company: row.company,
        company_size: row.companySize,
        status: "new",
        email_status: "pending",
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      return { error: "Não foi possível registrar o pedido agora. Tente de novo em instantes." };
    }
    return { id: data.id as string };
  } catch {
    return { error: "Não foi possível registrar o pedido agora. Tente de novo em instantes." };
  }
}

async function markLeadEmail(
  id: string,
  emailStatus: LandingLeadEmailStatus,
  emailError: string | null,
): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin
      .from("landing_leads")
      .update({
        email_status: emailStatus,
        email_error: emailError,
      })
      .eq("id", id);
  } catch {
    // O registro já existe; o painel admin cobre o tratamento.
  }
}

export const submitLandingLead = createServerFn({ method: "POST" })
  .inputValidator(LeadInput)
  .handler(async ({ data }): Promise<SubmitLandingLeadResult> => {
    if (data.website && data.website.trim().length > 0) {
      return { ok: true, delivered: true };
    }

    const saved = await persistLead({
      name: data.name,
      email: data.email,
      company: data.company,
      companySize: data.companySize,
    });
    if ("error" in saved) {
      return { ok: false, error: saved.error };
    }

    const size = companySizeLabel(data.companySize) ?? data.companySize;
    const to = leadsInbox();
    const result = await sendTransactionalEmail({
      to,
      subject: `Zēllu · pedido de demonstração — ${data.company}`,
      text: [
        "Pedido de demonstração (landing)",
        "",
        `Nome: ${data.name}`,
        `E-mail: ${data.email}`,
        `Empresa: ${data.company}`,
        `Tamanho: ${size}`,
      ].join("\n"),
      html: `
        <p>Pedido de demonstração (landing)</p>
        <p><strong>Nome:</strong> ${escapeHtml(data.name)}<br/>
        <strong>E-mail:</strong> ${escapeHtml(data.email)}<br/>
        <strong>Empresa:</strong> ${escapeHtml(data.company)}<br/>
        <strong>Tamanho:</strong> ${escapeHtml(size)}</p>
      `,
    });

    if (!result.sent && result.skipped) {
      await markLeadEmail(saved.id, "skipped", null);
      return { ok: true, delivered: false };
    }
    if (!result.sent) {
      await markLeadEmail(saved.id, "failed", result.error);
      return { ok: true, delivered: false };
    }

    await markLeadEmail(saved.id, "sent", null);
    return { ok: true, delivered: true };
  });

export const listLandingLeads = createServerFn({ method: "POST" }).handler(async () => {
  const auth = await requireAdmin();
  if ("error" in auth) return { data: [] as LandingLead[], error: auth.error };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("landing_leads")
    .select(LEAD_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) return { data: [] as LandingLead[], error: error.message };
  return { data: (data ?? []) as LandingLead[], error: null };
});

export const updateLandingLead = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      status: z.enum(LANDING_LEAD_STATUSES).optional(),
      notes: z.string().max(4000).optional().nullable(),
    }),
  )
  .handler(async ({ data }) => {
    const auth = await requireAdmin();
    if ("error" in auth) return { data: null as LandingLead | null, error: auth.error };

    const admin = createAdminClient();
    const { data: current, error: readError } = await admin
      .from("landing_leads")
      .select("id, status, contacted_at")
      .eq("id", data.id)
      .maybeSingle();

    if (readError) return { data: null, error: readError.message };
    if (!current) return { data: null, error: "Lead não encontrado." };

    const payload: Record<string, unknown> = {};
    if (data.status) payload.status = data.status;
    if (data.notes !== undefined) payload.notes = data.notes?.trim() ? data.notes.trim() : null;

    const nextStatus = (data.status ?? current.status) as LandingLeadStatus;
    if (nextStatus !== "new" && !current.contacted_at) {
      payload.contacted_at = new Date().toISOString();
    }

    const { data: row, error } = await admin
      .from("landing_leads")
      .update(payload)
      .eq("id", data.id)
      .select(LEAD_COLUMNS)
      .single();

    return { data: (row as LandingLead | null) ?? null, error: error?.message ?? null };
  });

export const deleteLandingLead = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { error } = await admin.from("landing_leads").delete().eq("id", data.id);
    return { error: error?.message ?? null };
  });
