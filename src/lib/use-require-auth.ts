import { useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth, type UserRole } from "@/lib/auth-context";
import { getProfile } from "@/lib/api/auth.server";
import { companionNeedsOnboarding } from "@/lib/lgpd";

function homeForRole(role: UserRole): "/" | "/dashiadmin" | "/manager/rh-dashboard" {
  if (role === "admin") return "/dashiadmin";
  if (role === "manager") return "/manager/rh-dashboard";
  return "/";
}

export function useRequireAuth(allowedRole?: UserRole) {
  const { user, loading, role } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [gateReady, setGateReady] = useState(allowedRole !== "companion");

  useEffect(() => {
    if (loading) return;

    if (!user) {
      if (pathname !== "/login") navigate({ to: "/login", replace: true });
      return;
    }

    if (!role) return;

    if (role === "dev") {
      setGateReady(true);
      return;
    }

    if (allowedRole && role !== allowedRole) {
      const target = homeForRole(role);
      if (pathname !== target) navigate({ to: target, replace: true });
      return;
    }

    if (allowedRole === "companion" && pathname !== "/onboarding") {
      void (async () => {
        const profile = await getProfile();
        if (profile && companionNeedsOnboarding(profile)) {
          navigate({ to: "/onboarding", replace: true });
          return;
        }
        setGateReady(true);
      })();
      return;
    }

    setGateReady(true);
  }, [user, loading, role, allowedRole, navigate, pathname]);

  return {
    user,
    loading: loading || !role || (allowedRole === "companion" && !gateReady),
    role,
    isAuthorized: !!user && !!role && (role === "dev" || !allowedRole || role === allowedRole),
  };
}
