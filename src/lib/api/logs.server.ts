import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin.server";
import { sanitizeLogDetails, sanitizeLogMessage } from "@/lib/lgpd";
import { requireUser } from "@/lib/require-user";

type LogLevel = "info" | "warn" | "error" | "debug";

type LogEntry = {
  id: string;
  level: LogLevel;
  source: string;
  message: string;
  details: Record<string, string | number | boolean | null> | null;
  user_id: string | null;
  created_at: string;
};

export async function logEvent(
  level: LogLevel,
  source: string,
  message: string,
  details?: Record<string, unknown> | null,
  userId?: string | null,
) {
  try {
    const admin = createAdminClient();
    await admin.from("system_logs").insert({
      level,
      source,
      message: sanitizeLogMessage(message),
      details: sanitizeLogDetails(details ?? null),
      user_id: userId ?? null,
    });
  } catch (err) {
    console.error("logEvent failed:", err);
  }
}

async function requireDevRole(): Promise<{ user: import("@supabase/supabase-js").User } | { error: string }> {
  const auth = await requireUser();
  if ("error" in auth) return auth;
  if (auth.profile?.role !== "dev") {
    return { error: "Unauthorized — role dev required" };
  }
  return { user: { id: auth.userId, email: auth.email ?? undefined } as import("@supabase/supabase-js").User };
}

export const getSystemLogs = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      limit: z.number().int().min(1).max(500).default(100),
      offset: z.number().int().min(0).default(0),
      level: z.enum(["info", "warn", "error", "debug"]).optional(),
      source: z.string().optional(),
    }),
  )
  .handler(
    async ({
      data,
    }: {
      data: {
        limit: number;
        offset: number;
        level?: LogLevel;
        source?: string;
      };
    }) => {
      const auth = await requireDevRole();
      if ("error" in auth) return auth;

      const admin = createAdminClient();

      let query = admin.from("system_logs").select("*", { count: "exact" });

      if (data.level) {
        query = query.eq("level", data.level);
      }
      if (data.source) {
        query = query.eq("source", data.source);
      }

      const { data: logs, error, count } = await query
        .order("created_at", { ascending: false })
        .range(data.offset, data.offset + data.limit - 1);

      if (error) {
        return { error: error.message };
      }

      return { data: (logs ?? []) as LogEntry[], total: count ?? 0, error: null };
    },
  );

export const logClientEvent = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      level: z.enum(["info", "warn", "error", "debug"]),
      source: z.string().min(1).max(80),
      message: z.string().min(1).max(280),
      details: z
        .record(z.union([z.string().max(80), z.number(), z.boolean(), z.null()]))
        .optional(),
    }),
  )
  .handler(
    async ({
      data,
    }: {
      data: {
        level: LogLevel;
        source: string;
        message: string;
        details?: Record<string, string | number | boolean | null>;
      };
    }) => {
      const auth = await requireUser();
      if ("error" in auth) return { success: false };

      const { data: allowed, error: quotaError } = await auth.supabase.rpc("consume_client_log_quota");
      if (quotaError || allowed !== true) return { success: false };

      await logEvent(data.level, data.source, data.message, data.details, auth.userId);

      return { success: true };
    },
  );

export type { LogLevel, LogEntry };
