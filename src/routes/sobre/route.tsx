import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SobreLayout } from "@/components/sobre/SobreLayout";
import { BRANDING } from "@/lib/branding";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: `Sobre — ${BRANDING.shortName}` },
      {
        name: "description",
        content: "Guia público sobre o funcionamento do Zēllu para colaboradores, RH e clientes.",
      },
    ],
  }),
  component: SobreLayoutRoute,
});

function SobreLayoutRoute() {
  return (
    <SobreLayout>
      <Outlet />
    </SobreLayout>
  );
}
