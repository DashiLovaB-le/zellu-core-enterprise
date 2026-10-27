import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireManager } from "@/lib/require-user";
import { logEvent } from "@/lib/api/logs.server";

export const getMonthlyReportPreference = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ receive: boolean | null; error: string | null }> => {
    const auth = await requireManager();
    if ("error" in auth) return { receive: null, error: auth.error };
    const { data, error } = await auth.supabase
      .from("profiles")
      .select("rh_monthly_report_opt_out")
      .eq("id", auth.userId)
      .maybeSingle();
    if (error || !data) return { receive: null, error: "Não foi possível carregar a preferência." };
    return { receive: data.rh_monthly_report_opt_out !== true, error: null };
  },
);

export const setMonthlyReportPreference = createServerFn({ method: "POST" })
  .inputValidator(z.object({ receive: z.boolean() }))
  .handler(async ({ data }): Promise<{ receive: boolean | null; error: string | null }> => {
    const auth = await requireManager();
    if ("error" in auth) return { receive: null, error: auth.error };
    const { error } = await auth.supabase.rpc("set_my_monthly_report_opt_out", {
      p_opt_out: !data.receive,
    });
    if (error) {
      void logEvent(
        "error",
        "reportPreferences.set",
        "Falha ao salvar preferência do resumo mensal",
        { error: error.message },
        auth.userId,
      );
      return { receive: null, error: "Não foi possível salvar. Tente novamente." };
    }
    return { receive: data.receive, error: null };
  });
