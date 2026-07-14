import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { confirmUser, getUserRole } from "@/lib/api/auth.server";

export type UserRole = "companion" | "manager" | "dev" | null;

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

async function fetchRoleFromProfile(user: User): Promise<"companion" | "manager" | "dev" | null> {
  try {
    const supabase = createClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return null;
    const role = await getUserRole({ data: { accessToken: token } });
    return role;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRoleState] = useState<UserRole>(null);

  const syncRole = async (u: User | null) => {
    if (!u) {
      setRoleState(null);
      return;
    }
    const profileRole = await fetchRoleFromProfile(u);
    setRoleState(profileRole ?? (u?.user_metadata?.role as UserRole) ?? null);
  };

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await syncRole(session.user);
      } else {
        setRoleState(null);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await syncRole(session.user);
      } else {
        setRoleState(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.user) {
      await syncRole(data.user);
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
      await syncRole(data.user);
    }
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
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
      await syncRole(data.user);
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
