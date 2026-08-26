import { createServerFn } from "@tanstack/react-start";
import { requireUser } from "@/lib/require-user";
import { logEvent } from "@/lib/api/logs.server";

export type ProductTourAudience = "companion" | "manager";

export type ProductTourStatus = {
  needsTour: boolean;
  audience: ProductTourAudience | null;
};

/** Status do guia de produto (companion ou RH/manager). */
export const getProductTourStatus = createServerFn({ method: "GET" }).handler(async () => {
  const auth = await requireUser();
  if ("error" in auth) return { error: "Unauthorized" as const, status: null };

  const { data: row, error } = await auth.supabase
    .from("profiles")
    .select("role, onboarding_completed_at, product_tour_completed_at")
    .eq("id", auth.userId)
    .maybeSingle();

  if (error) {
    return { error: error.message, status: null };
  }

  const role = row?.role ?? auth.profile?.role;
  const tourDone = row?.product_tour_completed_at != null;

  if (role === "companion") {
    const needsTour = !!row?.onboarding_completed_at && !tourDone;
    return {
      error: null,
      status: {
        needsTour,
        audience: needsTour ? "companion" : null,
      } satisfies ProductTourStatus,
    };
  }

  if (role === "manager") {
    // Managers entram pelo painel RH; não dependem do onboarding LGPD do companion.
    const needsTour = !tourDone;
    return {
      error: null,
      status: {
        needsTour,
        audience: needsTour ? "manager" : null,
      } satisfies ProductTourStatus,
    };
  }

  return {
    error: null,
    status: { needsTour: false, audience: null } satisfies ProductTourStatus,
  };
});

export const completeProductTour = createServerFn({ method: "POST" }).handler(async () => {
  const auth = await requireUser();
  if ("error" in auth) return { error: "Unauthorized" };

  const { data: row } = await auth.supabase
    .from("profiles")
    .select("role, product_tour_completed_at")
    .eq("id", auth.userId)
    .maybeSingle();

  if (row?.role !== "companion" && row?.role !== "manager") {
    return { error: null };
  }

  if (row.product_tour_completed_at) {
    return { error: null };
  }

  const { error } = await auth.supabase
    .from("profiles")
    .update({ product_tour_completed_at: new Date().toISOString() })
    .eq("id", auth.userId);

  if (error) {
    void logEvent(
      "error",
      "tour.completeProductTour",
      "Falha ao marcar tour de produto",
      { error: error.message },
      auth.userId,
    );
    return { error: error.message };
  }

  void logEvent(
    "info",
    "tour.completeProductTour",
    "Tour de produto concluído",
    { role: row.role },
    auth.userId,
  );

  return { error: null };
});
