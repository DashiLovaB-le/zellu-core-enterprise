import { createAdminClient } from "@/lib/supabase/admin.server";
import { getAppBaseUrl } from "@/lib/config.server";
import { sendTransactionalEmail } from "@/lib/email.server";
import { logEvent } from "@/lib/api/logs.server";
import { isCronAuthorized } from "@/lib/retention";
import {
  buildMonthlyReportEmail,
  monthlySummarySchema,
  previousMonthOf,
  reportMonthFor,
  type MonthlySummary,
} from "@/lib/monthly-report";

type Admin = ReturnType<typeof createAdminClient>;

export type MonthlyReportRun = {
  month: string;
  dryRun: boolean;
  companies: number;
  sent: number;
  alreadySent: number;
  failed: number;
  skippedCompanies: number;
  previews: Array<{ company: string; recipients: number; subject: string; text: string }>;
};

async function loadSummary(
  admin: Admin,
  companyId: string,
  month: string,
): Promise<MonthlySummary | null> {
  const { data, error } = await admin.rpc("get_company_monthly_rh_summary", {
    p_company: companyId,
    p_month: month,
  });
  if (error || data == null) {
    void logEvent("error", "monthlyReport.loadSummary", "Falha ao calcular resumo mensal", {
      company_id: companyId,
      month,
      error: error?.message ?? "vazio",
    });
    return null;
  }
  const payload = typeof data === "string" ? JSON.parse(data) : data;
  const parsed = monthlySummarySchema.safeParse(payload);
  return parsed.success ? parsed.data : null;
}

async function markSend(
  admin: Admin,
  key: { companyId: string; recipientId: string; month: string },
  status: "sent" | "failed" | "skipped",
  error: string | null,
) {
  await admin
    .from("rh_monthly_report_sends")
    .update({ status, error, updated_at: new Date().toISOString() })
    .eq("company_id", key.companyId)
    .eq("recipient_id", key.recipientId)
    .eq("report_month", key.month);
}

export async function runMonthlyRhReport(options: {
  now?: Date;
  month?: string;
  dryRun?: boolean;
}): Promise<MonthlyReportRun> {
  const admin = createAdminClient();
  const month = options.month ?? reportMonthFor(options.now ?? new Date()).month;
  const previousMonth = previousMonthOf(month);
  const dryRun = options.dryRun ?? false;
  const baseUrl = getAppBaseUrl();
  const run: MonthlyReportRun = {
    month,
    dryRun,
    companies: 0,
    sent: 0,
    alreadySent: 0,
    failed: 0,
    skippedCompanies: 0,
    previews: [],
  };

  const { data: companies, error: companiesError } = await admin
    .from("companies")
    .select("id, name")
    .in("status", ["active", "trial"]);
  if (companiesError) throw new Error(companiesError.message);

  for (const company of companies ?? []) {
    const { data: recipients, error: recipientsError } = await admin
      .from("profiles")
      .select("id, email")
      .eq("company_id", company.id)
      .eq("role", "manager")
      .eq("rh_monthly_report_opt_out", false)
      .or("is_active.is.null,is_active.eq.true")
      .not("email", "is", null);
    if (recipientsError) throw new Error(recipientsError.message);
    if (!recipients?.length) continue;

    const current = await loadSummary(admin, company.id, month);
    if (!current || current.totalUsers === 0) {
      run.skippedCompanies += 1;
      continue;
    }
    const previous = await loadSummary(admin, company.id, previousMonth);
    const email = buildMonthlyReportEmail({
      companyName: company.name,
      current,
      previous,
      panelUrl: `${baseUrl}/manager/rh-dashboard`,
      profileUrl: `${baseUrl}/perfil`,
    });
    run.companies += 1;

    if (dryRun) {
      run.previews.push({
        company: company.name,
        recipients: recipients.length,
        subject: email.subject,
        text: email.text,
      });
      continue;
    }

    for (const recipient of recipients) {
      const key = { companyId: company.id, recipientId: recipient.id, month };
      const { data: claimed, error: claimError } = await admin.rpc("claim_rh_monthly_report_send", {
        p_company: company.id,
        p_recipient: recipient.id,
        p_month: month,
      });
      if (claimError) {
        run.failed += 1;
        void logEvent("error", "monthlyReport.claim", "Falha ao reservar envio", {
          company_id: company.id,
          error: claimError.message,
        });
        continue;
      }
      if (!claimed) {
        run.alreadySent += 1;
        continue;
      }

      const result = await sendTransactionalEmail({
        to: recipient.email as string,
        subject: email.subject,
        text: email.text,
        html: email.html,
      });
      if (result.sent) {
        run.sent += 1;
        await markSend(admin, key, "sent", null);
      } else if (result.skipped) {
        run.failed += 1;
        await markSend(admin, key, "failed", "RESEND_API_KEY ausente");
      } else {
        run.failed += 1;
        await markSend(admin, key, "failed", result.error);
      }
    }
  }

  void logEvent("info", "monthlyReport.run", "Resumo mensal processado", {
    month: run.month,
    dryRun: run.dryRun,
    companies: run.companies,
    sent: run.sent,
    alreadySent: run.alreadySent,
    failed: run.failed,
  });
  return run;
}

export async function handleMonthlyReportCronRequest(request: Request): Promise<Response> {
  if (request.method !== "POST" && request.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  if (!isCronAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const url = new URL(request.url);
  const monthParam = url.searchParams.get("month");
  if (monthParam && !/^\d{4}-(0[1-9]|1[0-2])$/.test(monthParam)) {
    return Response.json({ error: "month deve ser AAAA-MM" }, { status: 400 });
  }
  try {
    const run = await runMonthlyRhReport({
      month: monthParam ? `${monthParam}-01` : undefined,
      dryRun: url.searchParams.get("dry") === "1",
    });
    return Response.json(run, { status: run.failed > 0 ? 207 : 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    void logEvent("error", "monthlyReport.run", "Falha no resumo mensal", { error: message });
    return Response.json({ error: message }, { status: 500 });
  }
}
