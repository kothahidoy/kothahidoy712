import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import { dataService } from "@/src/data/service";
import { UserProfile } from "@/src/types";

interface SessionContextValue {
  profile: UserProfile | null;
  isLoading: boolean;
  /** True the moment Supabase has a valid session OR we have a local
   *  anonymous (demo-mode) profile cached. Drives the splash redirect. */
  isAuthenticated: boolean;
  /** True only when Supabase has a real auth session (not anonymous). */
  hasSession: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
  setProfile: (p: UserProfile | null) => void;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(
  undefined,
);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // Track whether we've seen Supabase's INITIAL_SESSION event so the splash
  // doesn't redirect before the URL hash (magic-link tokens) has been parsed.
  const initialResolved = useRef(false);

  const refreshProfile = useCallback(async () => {
    const p = await dataService.getProfile();
    setProfile(p);
  }, []);

  useEffect(() => {
    let cancelled = false;

    // 1. Boot path for demo mode (no Supabase) — just load local profile
    //    and finish.
    if (!isSupabaseConfigured || !supabase) {
      (async () => {
        await refreshProfile();
        if (!cancelled) setIsLoading(false);
      })();
      return () => {
        cancelled = true;
      };
    }

    // 2. Real Supabase: prime hasSession from local storage immediately so
    //    the splash can route without a network call. Then subscribe to
    //    auth state changes (which include the URL-hash parse result from
    //    magic-link redirects).
    (async () => {
      try {
        const { data } = await supabase!.auth.getSession();
        if (cancelled) return;
        const sessionPresent = !!data.session;
        setHasSession(sessionPresent);
        if (sessionPresent) await refreshProfile();
        else await refreshProfile(); // still try local cache fallback
      } catch (e) {
        console.warn("[SessionContext] getSession failed", e);
      }
    })();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const present = !!session;
        setHasSession(present);
        await refreshProfile();
        // The first event Supabase emits is INITIAL_SESSION — once it fires
        // we know URL-hash parsing is done and it's safe to unblock the
        // splash redirect.
        if (!initialResolved.current) {
          initialResolved.current = true;
          setIsLoading(false);
        }
        // Helpful diagnostic in dev.
        if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
          console.log(`[auth] ${event}`, present);
        }
      },
    );

    // Safety net: never keep the splash up for more than 1.5s — if the
    // listener somehow doesn't fire (e.g. CDN slow), assume no session.
    const t = setTimeout(() => {
      if (!initialResolved.current) {
        initialResolved.current = true;
        setIsLoading(false);
      }
    }, 1500);

    return () => {
      cancelled = true;
      clearTimeout(t);
      listener.subscription.unsubscribe();
    };
  }, [refreshProfile]);

  const signOut = useCallback(async () => {
    await dataService.signOut();
    setProfile(null);
    setHasSession(false);
  }, []);

  const value = useMemo(
    () => ({
      profile,
      isLoading,
      isAuthenticated: hasSession || !!profile,
      hasSession,
      isAdmin: profile?.role === "admin",
      refreshProfile,
      setProfile,
      signOut,
    }),
    [profile, isLoading, hasSession, refreshProfile, signOut],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};

export const useSession = (): SessionContextValue => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
};
