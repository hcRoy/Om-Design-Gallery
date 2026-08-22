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
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true); // initial bootstrap only
  const [profileLoading, setProfileLoading] = useState(false); // any (re)fetch, incl. post-login

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    setProfileLoading(true);
    const { profile: p } = await fetchProfile(userId);
    setProfile(p);
    setProfileLoading(false);
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      // JUDGMENT CALL (bugfix): this used to call loadProfile without
      // awaiting it, then immediately set loading to false. That let
      // AdminRoute/ProtectedRoute render — and check profile.role —
      // before the profile query had actually returned, so a real admin
      // could get bounced to "/" on a fresh page load simply because
      // their role hadn't loaded yet. Awaiting here closes that gap.
      await loadProfile(data.session?.user?.id);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        // Not awaited here (an event handler can't block the SDK), so
        // `profileLoading` — exposed below as part of the combined
        // `loading` value — is what covers this window instead: it
        // catches the same race right after login/logout, when a route
        // guard might otherwise check `profile` before this resolves.
        loadProfile(newSession?.user?.id);
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
        // Combined so every consumer (ProtectedRoute, AdminRoute, pages
        // reading `profile` directly) waits out both the initial
        // bootstrap AND any later profile refetch — e.g. right after
        // login, before role-gated routing decisions are made.
        loading: loading || profileLoading,
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
