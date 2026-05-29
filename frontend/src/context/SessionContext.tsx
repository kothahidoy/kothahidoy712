import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { dataService } from "@/src/data/service";
import { UserProfile } from "@/src/types";

interface SessionContextValue {
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
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
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const p = await dataService.getProfile();
    setProfile(p);
  }, []);

  useEffect(() => {
    (async () => {
      await refreshProfile();
      setIsLoading(false);
    })();
  }, [refreshProfile]);

  const signOut = useCallback(async () => {
    await dataService.signOut();
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({
      profile,
      isLoading,
      isAuthenticated: !!profile,
      refreshProfile,
      setProfile,
      signOut,
    }),
    [profile, isLoading, refreshProfile, signOut],
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
