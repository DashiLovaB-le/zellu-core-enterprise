import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MobileHabitosPage } from "@/components/pages/mobile/HabitosPage";
import { DesktopHabitosPage } from "@/components/pages/desktop/HabitosPage";
import { BRANDING } from "@/lib/branding";

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
  const [water, setWater] = useState(1200);
  const [sleepQuality, setSleepQuality] = useState(70);

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
