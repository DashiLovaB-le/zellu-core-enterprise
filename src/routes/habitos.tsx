import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileHabitosPage } from "@/components/pages/mobile/HabitosPage";
import { DesktopHabitosPage } from "@/components/pages/desktop/HabitosPage";

export const Route = createFileRoute("/habitos")({
  head: () => ({
    meta: [
      { title: "Meus Hábitos — Sereno" },
      { name: "description", content: "Cuidar do corpo é o primeiro passo para acolher a mente." },
    ],
  }),
  component: HabitosPage,
});

function HabitosPage() {
  const isMobile = useIsMobile();
  const [water, setWater] = useState(1200);
  const [sleepQuality, setSleepQuality] = useState(70);

  if (isMobile) {
    return (
      <MobileHabitosPage
        water={water}
        onWaterChange={setWater}
        sleepQuality={sleepQuality}
        onSleepChange={setSleepQuality}
      />
    );
  }

  return (
    <DesktopHabitosPage
      water={water}
      onWaterChange={setWater}
      sleepQuality={sleepQuality}
      onSleepChange={setSleepQuality}
    />
  );
}
