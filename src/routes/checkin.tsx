import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileCheckinPage } from "@/components/pages/mobile/CheckinPage";
import { DesktopCheckinPage } from "@/components/pages/desktop/CheckinPage";
import { BRANDING } from "@/lib/branding";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useAuth } from "@/lib/auth-context";
import { Icon } from "@/components/Icon";
import { saveCheckin, getTodaysCheckin } from "@/lib/api/checkin.server";
import type { CheckinData } from "@/lib/api/checkin.server";

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
  const [saved, setSaved] = useState(false);
  const [todaysCheckin, setTodaysCheckin] = useState<CheckinData | null>(null);
  const [loadingCheckin, setLoadingCheckin] = useState(true);

  useEffect(() => {
    if (!session) return;
    setLoadingCheckin(true);
    getTodaysCheckin().then((res) => {
      if (res.data) {
        setTodaysCheckin(res.data);
        setSaved(true);
      }
      setLoadingCheckin(false);
    });
  }, [session]);

  if (loading || !isAuthorized) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Icon name="sync" className="animate-spin text-3xl text-[var(--clay-title)]" />
      </div>
    );
  }

  if (loadingCheckin) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Icon name="sync" className="animate-spin text-3xl text-[var(--clay-title)]" />
      </div>
    );
  }

  const handleSave = async (data: {
    sleepHours: number;
    sleepLabel: string;
    waterMl: number;
    mood: string;
  }) => {
    if (!session) return;
    setSaving(true);
    try {
      const result = await saveCheckin({ data: { sleepHours: data.sleepHours,
          sleepLabel: data.sleepLabel,
          waterMl: data.waterMl,
          mood: data.mood,
        },
      });
      if (result.error) {
        console.error(result.error);
        return;
      }
      const refreshed = await getTodaysCheckin();
      if (refreshed.data) {
        setTodaysCheckin(refreshed.data);
      }
      setSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="block md:hidden">
        <MobileCheckinPage
          onSave={handleSave}
          saved={saved}
          saving={saving}
          todaysCheckin={todaysCheckin}
        />
      </div>
      <div className="hidden md:block">
        <DesktopCheckinPage
          onSave={handleSave}
          saved={saved}
          saving={saving}
          todaysCheckin={todaysCheckin}
        />
      </div>
    </>
  );
}
