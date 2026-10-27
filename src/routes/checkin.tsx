import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileCheckinPage } from "@/components/pages/mobile/CheckinPage";
import { DesktopCheckinPage } from "@/components/pages/desktop/CheckinPage";
import { BRANDING } from "@/lib/branding";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useAuth } from "@/lib/auth-context";
import { PageLoader } from "@/components/ClayLoader";
import { saveCheckin, getTodaysCheckin, getTodayWorkFactor } from "@/lib/api/checkin.server";
import type { CheckinData, TodayWorkFactor } from "@/lib/api/checkin.server";

export const Route = createFileRoute("/checkin")({
  head: () => ({
    meta: [
      { title: `Check-in Matinal — ${BRANDING.shortName}` },
      { name: "description", content: "Registre como você está hoje." },
    ],
  }),
  component: CheckinPage,
});

function CheckinPage() {
  const { isAuthorized, loading } = useRequireAuth("companion");
  const { session } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [todaysCheckin, setTodaysCheckin] = useState<CheckinData | null>(null);
  const [todayFactor, setTodayFactor] = useState<TodayWorkFactor | null>(null);
  const [factorError, setFactorError] = useState<string | null>(null);
  const [loadingCheckin, setLoadingCheckin] = useState(true);

  useEffect(() => {
    if (!session) return;
    setLoadingCheckin(true);
    Promise.all([getTodaysCheckin(), getTodayWorkFactor()]).then(([checkinRes, factorRes]) => {
      if (checkinRes.data) setTodaysCheckin(checkinRes.data);
      if (factorRes.data) setTodayFactor(factorRes.data);
      else setFactorError(factorRes.error ?? "A pergunta do dia está indisponível.");
      setLoadingCheckin(false);
    });
  }, [session]);

  if (loading || !isAuthorized) {
    return <PageLoader />;
  }

  if (loadingCheckin) {
    return <PageLoader />;
  }

  const handleSave = async (data: {
    sleepHours: number;
    sleepLabel: string;
    waterMl: number;
    mood: string;
    workFactorId: "carga" | "autonomia" | "apoio" | "relacoes";
    workFactorScore: number;
  }) => {
    if (!session) return;
    setSaving(true);
    setSaveError(null);
    try {
      const result = await saveCheckin({
        data: {
          sleepHours: data.sleepHours,
          sleepLabel: data.sleepLabel,
          waterMl: data.waterMl,
          mood: data.mood,
          workFactorId: data.workFactorId,
          workFactorScore: data.workFactorScore,
        },
      });
      if (result.error) {
        setSaveError(result.error);
        return;
      }
      const refreshed = await getTodaysCheckin();
      if (refreshed.data) setTodaysCheckin(refreshed.data);
      if (!refreshed.data?.work_factor_score) {
        setSaveError("Não foi possível confirmar o check-in. Tente de novo.");
      }
    } catch (err) {
      console.error(err);
      setSaveError("Não foi possível salvar o check-in. Tente de novo.");
    } finally {
      setSaving(false);
    }
  };

  const complete = Boolean(
    todaysCheckin && (todaysCheckin.work_factor_score != null || !todayFactor),
  );
  const pendingWorkFactor = Boolean(
    todayFactor && todaysCheckin && todaysCheckin.work_factor_score == null,
  );
  if (!todaysCheckin && !todayFactor) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 text-center">
        <p className="max-w-sm text-sm text-[var(--clay-title)]">
          {factorError ?? "A pergunta do dia está indisponível."}
        </p>
      </div>
    );
  }

  const pageProps = {
    onSave: handleSave,
    saving,
    saveError,
    todaysCheckin: complete ? todaysCheckin : null,
    workFactor: todayFactor?.factor ?? null,
    startAtWorkFactor: pendingWorkFactor,
  };

  return (
    <>
      <div className="block md:hidden">
        <MobileCheckinPage {...pageProps} />
      </div>
      <div className="hidden md:block">
        <DesktopCheckinPage {...pageProps} />
      </div>
    </>
  );
}
