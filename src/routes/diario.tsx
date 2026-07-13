import { createFileRoute } from "@tanstack/react-router";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileDiarioPage } from "@/components/pages/mobile/DiarioPage";
import { DesktopDiarioPage } from "@/components/pages/desktop/DiarioPage";

export const Route = createFileRoute("/diario")({
  head: () => ({
    meta: [
      { title: "Meu Diário — Sereno" },
      { name: "description", content: "Olhe para trás com carinho e autocompreensão." },
    ],
  }),
  component: DiarioPage,
});

function DiarioPage() {
  const isMobile = useIsMobile();
  return isMobile ? <MobileDiarioPage /> : <DesktopDiarioPage />;
}
