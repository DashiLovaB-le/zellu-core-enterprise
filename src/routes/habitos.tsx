import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { PageLoader } from "@/components/ClayLoader";
import { BRANDING } from "@/lib/branding";

export const Route = createFileRoute("/habitos")({
  head: () => ({
    meta: [
      { title: `Meu Bem-estar — ${BRANDING.shortName}` },
      { name: "description", content: "Redirecionando..." },
    ],
  }),
  component: RedirectPage,
});

function RedirectPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/meu-bem-estar", replace: true });
  }, [navigate]);

  return (
    <PageLoader />
  );
}
