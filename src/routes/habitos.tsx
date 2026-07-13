import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MobileHabitosPage } from "@/components/pages/mobile/HabitosPage";
import { DesktopHabitosPage } from "@/components/pages/desktop/HabitosPage";
import { BRANDING } from "@/lib/branding";
import { useRequireAuth } from "@/lib/use-require-auth";
import { Icon } from "@/components/Icon";

export const Route = createFileRoute("/habitos")({
  head: () => ({
    meta: [
      { title: `Meus Hábitos — ${BRANDING.shortName}` },
      { name: "description", content: "Cuidar do corpo é o primeiro passo para acolher a mente." },
    ],
  }),
  component: HabitosPage,
});

function HabitosPage() {
  const { isAuthorized, loading } = useRequireAuth("companion");
  const [water, setWater] = useState(1200);
  const [sleepQuality, setSleepQuality] = useState(70);

  if (loading || !isAuthorized) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Icon name="sync" className="animate-spin text-3xl text-[var(--clay-title)]" />
      </div>
    );
  }

  return (
    <>
      <div className="block md:hidden">
        <MobileHabitosPage
          water={water}
          onWaterChange={setWater}
          sleepQuality={sleepQuality}
          onSleepChange={setSleepQuality}
        />
      </div>
      <div className="hidden md:block">
        <DesktopHabitosPage
          water={water}
          onWaterChange={setWater}
          sleepQuality={sleepQuality}
          onSleepChange={setSleepQuality}
        />
      </div>
    </>
  );
}
