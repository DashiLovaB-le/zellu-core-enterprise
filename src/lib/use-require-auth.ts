import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth, type UserRole } from "@/lib/auth-context";

export function useRequireAuth(allowedRole?: UserRole) {
  const { user, loading, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate({ to: "/login", replace: true });
      return;
    }

    if (allowedRole && role !== allowedRole) {
      const target = role === "manager" ? "/manager" : "/";
      navigate({ to: target, replace: true });
    }
  }, [user, loading, role, allowedRole, navigate]);

  return { user, loading, role, isAuthorized: !!user && (!allowedRole || role === allowedRole) };
}
