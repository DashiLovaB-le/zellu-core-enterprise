import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MobileRespiroPage } from "@/components/pages/mobile/RespiroPage";
import { DesktopRespiroPage } from "@/components/pages/desktop/RespiroPage";
import { BRANDING } from "@/lib/branding";

export const Route = createFileRoute("/respiro")({
  head: () => ({
    meta: [
      { title: `Espaço do Respiro — ${BRANDING.shortName}` },
      { name: "description", content: "Faça uma pausa. O mundo pode esperar um minuto." },
    ],
  }),
  component: RespiroPage,
});

function RespiroPage() {
  const [activeSound, setActiveSound] = useState<string | null>(null);

  return (
    <>
      <div className="block md:hidden">
        <MobileRespiroPage activeSound={activeSound} onSoundToggle={setActiveSound} />
      </div>
      <div className="hidden md:block">
        <DesktopRespiroPage activeSound={activeSound} onSoundToggle={setActiveSound} />
      </div>
    </>
  );
}
