import { createFileRoute } from "@tanstack/react-router";
import { MobileDiarioPage } from "@/components/pages/mobile/DiarioPage";
import { DesktopDiarioPage } from "@/components/pages/desktop/DiarioPage";
import { BRANDING } from "@/lib/branding";
import { useRequireAuth } from "@/lib/use-require-auth";
import { Icon } from "@/components/Icon";

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
  const { isAuthorized, loading } = useRequireAuth("companion");

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
        <MobileDiarioPage />
      </div>
      <div className="hidden md:block">
        <DesktopDiarioPage />
      </div>
    </>
  );
}
