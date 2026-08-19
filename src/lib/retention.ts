import { createHash, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin.server";
import { RETENTION_DAYS } from "@/lib/privacy";
import { logEvent } from "@/lib/api/logs.server";

function secretsEqual(provided: string, expected: string): boolean {
  const left = createHash("sha256").update(provided).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}

export function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  return secretsEqual(header, expected);
}

export async function executeRetentionPurge(actorUserId?: string | null): Promise<{ error: string | null }> {
  const admin = createAdminClient();
  const { error } = await admin.rpc("purge_expired_personal_data");

  if (error) {
    const now = new Date();
    const cut = (days: number) => new Date(now.getTime() - days * 86400000).toISOString();
    const results = await Promise.all([
      admin.from("chat_messages").delete().lt("created_at", cut(RETENTION_DAYS.chat)),
      admin.from("diary_entries").delete().lt("created_at", cut(RETENTION_DAYS.diary)),
      admin.from("preventive_notifications").delete().lt("created_at", cut(RETENTION_DAYS.preventive)),
      admin.from("companion_memories").delete().lt("created_at", cut(RETENTION_DAYS.chat)),
      admin.from("checkins").delete().lt("created_at", cut(RETENTION_DAYS.checkins)),
      admin.from("system_logs").delete().lt("created_at", cut(RETENTION_DAYS.logs)),
    ]);
    const fallbackError = results.find((r) => r.error)?.error?.message;
    if (fallbackError) {
      void logEvent("error", "privacy.executeRetentionPurge", "Falha na retenção", { error: fallbackError }, actorUserId);
      return { error: fallbackError };
    }
  }

  void logEvent("info", "privacy.executeRetentionPurge", "Retenção executada", {}, actorUserId);
  return { error: null };
}

export async function handleRetentionCronRequest(request: Request): Promise<Response> {
  // GitHub Actions dispara POST; crons da Vercel usam GET.
  if (request.method !== "POST" && request.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  if (!isCronAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const result = await executeRetentionPurge();
  return Response.json(result, { status: result.error ? 500 : 200 });
}
