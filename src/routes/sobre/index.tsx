import { createFileRoute, Navigate } from "@tanstack/react-router";
import { SOBRE_DEFAULT_SLUG } from "@/lib/sobre";

export const Route = createFileRoute("/sobre/")({
  component: SobreIndexRedirect,
});

function SobreIndexRedirect() {
  return <Navigate to="/sobre/$slug" params={{ slug: SOBRE_DEFAULT_SLUG }} replace />;
}
