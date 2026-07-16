import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { confirmUser, getUserRole } from "@/lib/api/auth.server";

export type UserRole = "companion" | "manager" | "dev" | "admin" | null;

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: UserRole;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, role: UserRole) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  setRole: (role: UserRole) => Promise<void>;
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

async function fetchRoleFromProfile(
  accessToken: string,
): Promise<"companion" | "manager" | "dev" | "admin" | null> {
  try {
    return await getUserRole({ data: { accessToken } });
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRoleState] = useState<UserRole>(null);

  const applyOptimisticRole = (u: User) => {
    const cached = readCachedRole(u.id);
    const metaRole = (u.user_metadata?.role as UserRole) ?? null;
    setRoleState(cached ?? metaRole ?? null);
  };

  const syncRole = async (u: User, accessToken: string) => {
    const profileRole = await fetchRoleFromProfile(accessToken);
    const next = profileRole ?? (u.user_metadata?.role as UserRole) ?? null;
    setRoleState(next);
    if (next) writeCachedRole(u.id, next);
  };

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session: current } }) => {
      setSession(current);
      setUser(current?.user ?? null);
      if (current?.user && current.access_token) {
        applyOptimisticRole(current.user);
        setLoading(false);
        void syncRole(current.user, current.access_token);
      } else {
        setRoleState(null);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      // Refresh de token não precisa reconsultar role (evita waterfall em toda navegação)
      if (event === "TOKEN_REFRESHED") {
        setLoading(false);
        return;
      }

      if (nextSession?.user && nextSession.access_token) {
        applyOptimisticRole(nextSession.user);
        setLoading(false);
        if (event === "SIGNED_IN" || event === "USER_UPDATED" || event === "INITIAL_SESSION") {
          void syncRole(nextSession.user, nextSession.access_token);
        }
      } else {
        clearCachedRole();
        setRoleState(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.user && data.session?.access_token) {
      applyOptimisticRole(data.user);
      await syncRole(data.user, data.session.access_token);
    }
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string, role: UserRole) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role: role ?? "companion" } },
    });
    if (!error && data.user) {
      await confirmUser({ data: { userId: data.user.id } });
      if (data.session?.access_token) {
        applyOptimisticRole(data.user);
        await syncRole(data.user, data.session.access_token);
      } else {
        setRoleState(role ?? "companion");
      }
    }
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    const supabase = createClient();
    const userId = user?.id;
    await supabase.auth.signOut();
    clearCachedRole(userId);
    setRoleState(null);
  };

  const setRole = async (newRole: UserRole) => {
    if (!user) return;
    const supabase = createClient();
    const { data, error } = await supabase.auth.updateUser({
      data: { role: newRole },
    });
    if (!error && data.user) {
      setUser(data.user);
      setRoleState(newRole);
      if (newRole) writeCachedRole(data.user.id, newRole);
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.access_token) {
        await syncRole(data.user, sessionData.session.access_token);
      }
    }
  };

  const setAvatarUrl = async (url: string) => {
    if (!user) return;
    const supabase = createClient();
    const { data, error } = await supabase.auth.updateUser({
      data: { avatar_url: url },
    });
    if (!error && data.user) {
      setUser(data.user);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, role, signIn, signUp, signOut, setRole, setAvatarUrl }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
