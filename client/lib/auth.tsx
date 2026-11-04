/* eslint-disable react-refresh/only-export-components */
import type { Session } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { SUPABASE_ENABLED } from "./config";
import { supabase } from "./supabase";

type AuthState = {
  user: { id: string; email: string } | null;
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

function toUser(session: Session | null) {
  if (!session?.user) return null;
  return { id: session.user.id, email: session.user.email ?? "" };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthState["user"]>(null);
  const [loading, setLoading] = useState(SUPABASE_ENABLED);

  useEffect(() => {
    if (!SUPABASE_ENABLED) return;

    supabase.auth.getSession().then(({ data }) => {
      setUser(toUser(data.session));
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT") queryClient.clear();
        setUser(toUser(session));
        setLoading(false);
      },
    );

    return () => subscription.subscription.unsubscribe();
  }, [queryClient]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,

      async signInWithPassword(email, password) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw new Error(error.message);
      },

      async signUpWithPassword(email, password) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw new Error(error.message);

        return data.session === null;
      },

      async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw new Error(error.message);
      },
    }),
    [user, loading],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>.");
  }
  return context;
}

export function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <main>Loading...</main>;

  if (!user) {
    return (
      <Navigate to="/signin" state={{ from: location.pathname }} replace />
    );
  }

  return <Outlet />;
}
