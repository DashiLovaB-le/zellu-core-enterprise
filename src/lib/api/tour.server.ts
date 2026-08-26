import { createServerFn } from "@tanstack/react-start";
import { requireUser } from "@/lib/require-user";
import { logEvent } from "@/lib/api/logs.server";

export type ProductTourStatus = {
  needsTour: boolean;
};

/** Companion precisa do tour se já concluiu o onboarding LGPD e ainda não viu o guia. */
export const getProductTourStatus = createServerFn({ method: "GET" }).handler(async () => {
  const auth = await requireUser();
  if ("error" in auth) return { error: "Unauthorized" as const, status: null };

  const role = auth.profile?.role;
  if (role !== "companion") {
    return { error: null, status: { needsTour: false } satisfies ProductTourStatus };
  }

  const needsTour =
    !!auth.profile?.onboarding_completed_at && !auth.profile.product_tour_completed_at;

  return { error: null, status: { needsTour } satisfies ProductTourStatus };
});

export const completeProductTour = createServerFn({ method: "POST" }).handler(async () => {
  const auth = await requireUser();
  if ("error" in auth) return { error: "Unauthorized" };

  if (auth.profile?.role !== "companion") {
    return { error: null };
  }

  if (auth.profile.product_tour_completed_at) {
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
      "Falha ao marcar tour do companion",
      { error: error.message },
      auth.userId,
    );
    return { error: error.message };
  }

  void logEvent(
    "info",
    "tour.completeProductTour",
    "Tour do companion concluído",
    {},
    auth.userId,
  );

  return { error: null };
});
