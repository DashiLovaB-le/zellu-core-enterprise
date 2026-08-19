import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin.server";
import { requireAdmin } from "@/lib/require-user";
import { getZonedHour, zonedDateKey, DEFAULT_TIMEZONE } from "@/lib/timezone";
import { logEvent } from "@/lib/api/logs.server";
import { executeRetentionPurge } from "@/lib/retention";

/**
 * Job diário (cron / admin): lembra companions sem check-in no dia local.
 * E-mail: loga o envio; se RESEND_API_KEY existir, tenta disparar.
 */
export const sendCheckinReminders = createServerFn({ method: "POST" })
  .inputValidator(z.object({ hour: z.number().int().min(0).max(23).default(9) }))
  .handler(async ({ data }) => {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error, sent: 0 };

    const admin = createAdminClient();
    const { data: companions } = await admin
      .from("profiles")
      .select("id, email, display_name, timezone, last_checkin_reminder_at")
      .eq("role", "companion")
      .eq("is_active", true)
      .eq("privacy_email_opt_in", true);

    let sent = 0;
    const now = new Date();

    for (const profile of companions ?? []) {
      const tz = profile.timezone || DEFAULT_TIMEZONE;
      if (getZonedHour(tz, now) !== data.hour) continue;

      const todayKey = zonedDateKey(tz, now);
      if (profile.last_checkin_reminder_at) {
        const lastKey = zonedDateKey(tz, new Date(profile.last_checkin_reminder_at));
        if (lastKey === todayKey) continue;
      }

      const dayStart = new Date(`${todayKey}T00:00:00.000Z`);
      const { count } = await admin
        .from("checkins")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .gte("created_at", dayStart.toISOString());

      if ((count ?? 0) > 0) continue;

      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey && profile.email) {
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: process.env.REMINDER_FROM_EMAIL ?? "Mundo Mental Care <noreply@mundomental.care>",
              to: profile.email,
              subject: "Seu check-in de hoje",
              text: `Olá${profile.display_name ? `, ${profile.display_name}` : ""}. Ainda dá tempo de registrar como você está hoje no Mundo Mental Care.`,
            }),
          });
        } catch (err) {
          void logEvent(
            "warn",
            "reminders.sendCheckinReminders",
            "Falha ao enviar e-mail",
            { error: String(err) },
            profile.id,
          );
        }
      }

      await admin
        .from("profiles")
        .update({ last_checkin_reminder_at: now.toISOString() })
        .eq("id", profile.id);

      void logEvent(
        "info",
        "reminders.sendCheckinReminders",
        "Lembrete de check-in enviado",
        { timezone: tz },
        profile.id,
      );
      sent += 1;
    }

    void executeRetentionPurge(auth.userId);

    return { error: null, sent };
  });

export const hasCheckinToday = createServerFn({ method: "POST" })

  .handler(async ({ data }) => {
    const { requireUser } = await import("@/lib/require-user");
    const auth = await requireUser();
    if ("error" in auth) return { done: false };
    const tz = auth.profile?.timezone || DEFAULT_TIMEZONE;
    const todayKey = zonedDateKey(tz);
    const { data: row } = await auth.supabase
      .from("checkins")
      .select("id, created_at")
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!row) return { done: false };
    return { done: zonedDateKey(tz, new Date(row.created_at)) === todayKey };
  });
