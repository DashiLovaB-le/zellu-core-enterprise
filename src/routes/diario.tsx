import { createFileRoute } from "@tanstack/react-router";
import { MobileDiarioPage } from "@/components/pages/mobile/DiarioPage";
import { DesktopDiarioPage } from "@/components/pages/desktop/DiarioPage";
import { BRANDING } from "@/lib/branding";

export const Route = createFileRoute("/diario")({
  head: () => ({
    meta: [
      { title: `Meu Diário — ${BRANDING.shortName}` },
      { name: "description", content: "Olhe para trás com carinho e autocompreensão." },
    ],
  }),
  component: DiarioPage,
});

function DiarioPage() {
  return (
    <>
      <div className="block md:hidden">
        <MobileDiarioPage />
      </div>
      <div className="hidden md:block">
        <DesktopDiarioPage />
      </div>
    </>
  );
}
