import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Icon } from "@/components/Icon";
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
    <div className="flex min-h-[100dvh] items-center justify-center">
      <Icon name="sync" className="animate-spin text-3xl text-[var(--clay-title)]" />
    </div>
  );
}
