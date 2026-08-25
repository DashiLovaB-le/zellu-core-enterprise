import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { PageLoader } from "@/components/ClayLoader";

export const Route = createFileRoute("/dashboard-emocional")({
  head: () => ({
    meta: [{ title: "Dashboard Emocional" }, { name: "description", content: "Redirecionando..." }],
  }),
  component: RedirectPage,
});

function RedirectPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/", replace: true });
  }, [navigate]);

  return (
    <PageLoader />
  );
}
