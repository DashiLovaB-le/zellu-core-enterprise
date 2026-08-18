import { useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth, type UserRole } from "@/lib/auth-context";
import { getProfile } from "@/lib/api/auth.server";
import { companionNeedsOnboarding } from "@/lib/lgpd";

export function useRequireAuth(allowedRole?: UserRole) {
  const { user, loading, role, session } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [gateReady, setGateReady] = useState(allowedRole !== "companion");

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate({ to: "/login", replace: true });
      return;
    }

    if (role === "dev") {
      setGateReady(true);
      return;
    }

    if (allowedRole && role !== allowedRole) {
      const target =
        role === "admin" ? "/admin" : role === "manager" ? "/manager" : "/";
      navigate({ to: target, replace: true });
      return;
    }

    if (allowedRole === "companion" && session?.access_token && pathname !== "/onboarding") {
      void (async () => {
        const profile = await getProfile({ data: { accessToken: session.access_token } });
        const p = profile as {
          onboarding_completed_at?: string | null;
          privacy_consent_at?: string | null;
          privacy_consent_version?: string | null;
          adult_confirmed_at?: string | null;
          role?: string | null;
        } | null;
        if (companionNeedsOnboarding(p)) {
          navigate({ to: "/onboarding", replace: true });
          return;
        }
        setGateReady(true);
      })();
      return;
    }

    setGateReady(true);
  }, [user, loading, role, allowedRole, navigate, session, pathname]);

  return {
    user,
    loading: loading || !gateReady,
    role,
    isAuthorized: !!user && (role === "dev" || !allowedRole || role === allowedRole),
  };
}
