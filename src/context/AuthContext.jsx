import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { supabase } from "../lib/supabaseClient.js";
import { fetchProfile, signOut as signOutRequest } from "../lib/auth.js";

const AuthContext = createContext(null);

/**
 * `configured` tells the UI whether Supabase env vars are present at
 * all, distinct from `loading`/`session`. Pages use it to show an
 * honest "auth isn't connected yet" state instead of silently failing
 * or looking broken.
 *
 * Important: `loading` is initial bootstrap only. Background token
 * refreshes (common when returning to a browser tab) must NOT flip
 * loading — that used to unmount AdminRoute and close open modals.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    const { profile: p } = await fetchProfile(userId);
    setProfile(p);
    return p;
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadProfile(data.session?.user?.id);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);

        // Tab focus often triggers TOKEN_REFRESHED. Session JWT changed;
        // profile/role did not. Reloading profile here used to flip a
        // loading flag that unmounted admin pages and closed modals.
        if (event === "TOKEN_REFRESHED") {
          return;
        }

        if (event === "SIGNED_OUT") {
          setProfile(null);
          return;
        }

        // SIGNED_IN / USER_UPDATED / INITIAL_SESSION — refresh profile
        // in the background without gating the whole app on loading.
        if (newSession?.user?.id) {
          loadProfile(newSession.user.id);
        } else {
          setProfile(null);
        }
      },
    );

    return () => listener?.subscription?.unsubscribe();
  }, [loadProfile]);

  const signOut = async () => {
    await signOutRequest();
    setSession(null);
    setProfile(null);
  };

  const refreshProfile = () => loadProfile(session?.user?.id);

  return (
    <AuthContext.Provider
      value={{
        configured: !!supabase,
        session,
        user: session?.user ?? null,
        profile,
        loading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
