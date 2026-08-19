import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getAuthSnapshot, signInWithPassword, signOutSession, updateProfile } from "@/lib/api/auth.server";
import type { AuthSnapshot } from "@/lib/api/auth.server";

export type UserRole = "companion" | "manager" | "dev" | "admin" | null;

export type AuthUser = AuthSnapshot["user"];

export interface AuthState {
  user: AuthUser | null;
  session: { user: AuthUser } | null;
  loading: boolean;
  role: UserRole;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  setAvatarUrl: (url: string) => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

const ROLE_CACHE_PREFIX = "zellu_role:";

function readCachedRole(userId: string): UserRole {
  try {
    const value = sessionStorage.getItem(ROLE_CACHE_PREFIX + userId);
    if (value === "companion" || value === "manager" || value === "dev" || value === "admin")
      return value;
  } catch {
    // ignore
  }
  return null;
}

function writeCachedRole(userId: string, role: UserRole) {
  try {
    if (!role) {
      sessionStorage.removeItem(ROLE_CACHE_PREFIX + userId);
      return;
    }
    sessionStorage.setItem(ROLE_CACHE_PREFIX + userId, role);
  } catch {
    // ignore
  }
}

function clearCachedRole(userId?: string) {
  try {
    if (userId) {
      sessionStorage.removeItem(ROLE_CACHE_PREFIX + userId);
      return;
    }
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(ROLE_CACHE_PREFIX)) sessionStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRoleState] = useState<UserRole>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const snapshot = await getAuthSnapshot();
        if (cancelled) return;
        if (!snapshot) {
          clearCachedRole();
          setUser(null);
          setRoleState(null);
          return;
        }
        setUser(snapshot.user);
        const nextRole = snapshot.role ?? readCachedRole(snapshot.user.id);
        setRoleState(nextRole);
        if (snapshot.role) writeCachedRole(snapshot.user.id, snapshot.role);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await signInWithPassword({ data: { email, password } });
    if (result.error || !result.snapshot) {
      return { error: result.error ?? "Não foi possível entrar." };
    }
    setUser(result.snapshot.user);
    setRoleState(result.snapshot.role);
    if (result.snapshot.role) writeCachedRole(result.snapshot.user.id, result.snapshot.role);
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    const userId = user?.id;
    await signOutSession();
    clearCachedRole(userId);
    setUser(null);
    setRoleState(null);
  }, [user?.id]);

  const setAvatarUrl = useCallback(async (url: string) => {
    if (!user) return;
    const result = await updateProfile({ data: { avatarUrl: url } });
    if (!result.error) {
      setUser({ ...user, avatar_url: url });
    }
  }, [user]);

  const session = user ? { user } : null;

  const value = useMemo(
    () => ({ user, session, loading, role, signIn, signOut, setAvatarUrl }),
    [user, session, loading, role, signIn, signOut, setAvatarUrl],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
