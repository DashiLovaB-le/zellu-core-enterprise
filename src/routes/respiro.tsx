import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileRespiroPage } from "@/components/pages/mobile/RespiroPage";
import { DesktopRespiroPage } from "@/components/pages/desktop/RespiroPage";

export const Route = createFileRoute("/respiro")({
  head: () => ({
    meta: [
      { title: "Espaço do Respiro — Sereno" },
      { name: "description", content: "Faça uma pausa. O mundo pode esperar um minuto." },
    ],
  }),
  component: RespiroPage,
});

function RespiroPage() {
  const isMobile = useIsMobile();
  const [activeSound, setActiveSound] = useState<string | null>(null);

  if (isMobile) {
    return <MobileRespiroPage activeSound={activeSound} onSoundToggle={setActiveSound} />;
  }

  return <DesktopRespiroPage activeSound={activeSound} onSoundToggle={setActiveSound} />;
}
