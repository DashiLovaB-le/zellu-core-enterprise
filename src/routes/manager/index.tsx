import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { BRANDING } from "@/lib/branding";

export const Route = createFileRoute("/manager/")({
  head: () => ({
    meta: [
      { title: `Dashboard RH — ${BRANDING.shortName}` },
      { name: "description", content: "Painel de indicadores de bem-estar." },
    ],
  }),
  component: ManagerHomeRedirect,
});

function ManagerHomeRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/manager/rh-dashboard", replace: true });
  }, [navigate]);
  return null;
}
