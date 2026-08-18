import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin.server";
import { sanitizeLogDetails, sanitizeLogMessage } from "@/lib/lgpd";

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

async function requireDevRole(
  accessToken: string,
): Promise<{ user: import("@supabase/supabase-js").User } | { error: string }> {
  const supabase = await createClient(accessToken);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "dev") {
    return { error: "Unauthorized — role dev required" };
  }

  return { user };
}

export const getSystemLogs = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
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
        accessToken: string;
        limit: number;
        offset: number;
        level?: LogLevel;
        source?: string;
      };
    }) => {
      const auth = await requireDevRole(data.accessToken);
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
      accessToken: z.string(),
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
        accessToken: string;
        level: LogLevel;
        source: string;
        message: string;
        details?: Record<string, string | number | boolean | null>;
      };
    }) => {
      const supabase = await createClient(data.accessToken);
      const {
        data: { user },
      } = await supabase.auth.getUser(data.accessToken);
      if (!user) return { success: false };

      await logEvent(data.level, data.source, data.message, data.details, user.id);

      return { success: true };
    },
  );

export type { LogLevel, LogEntry };
