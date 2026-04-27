import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { api } from "./api";
import type { AuthResponse, UserProfile } from "./types";

type SessionState = {
  token: string | null;
  expiresAt: string | null;
  user: UserProfile | null;
};

type AuthContextValue = SessionState & {
  isAuthenticated: boolean;
  isAdmin: boolean;
  setSession: (response: AuthResponse) => void;
  refreshProfile: () => Promise<UserProfile>;
  logout: () => void;
};

const storageKey = "autonix.auth.session";
const legacyTokenStorageKey = "token";

const emptySession: SessionState = {
  token: null,
  expiresAt: null,
  user: null,
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredSession(): SessionState {
  const rawValue = localStorage.getItem(storageKey);

  if (!rawValue) {
    return emptySession;
  }

  try {
    const parsed = JSON.parse(rawValue) as SessionState;
    if (!parsed.token || !parsed.expiresAt) {
      return emptySession;
    }

    if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
      localStorage.removeItem(storageKey);
      return emptySession;
    }

    return parsed;
  } catch {
    localStorage.removeItem(storageKey);
    return emptySession;
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSessionState] = useState<SessionState>(readStoredSession);

  useEffect(() => {
    if (!session.token || !session.expiresAt) {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(legacyTokenStorageKey);
      return;
    }

    localStorage.setItem(storageKey, JSON.stringify(session));
    localStorage.setItem(legacyTokenStorageKey, session.token);
  }, [session]);

  const logout = useCallback(() => {
    setSessionState(emptySession);
  }, []);

  const setSession = useCallback((response: AuthResponse) => {
    setSessionState({
      token: response.token,
      expiresAt: response.expiresAt,
      user: response.user,
    });
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session.token) {
      throw new Error("No active session.");
    }

    const user = await api.getCurrentUser(session.token);
    setSessionState((current) => ({
      ...current,
      user,
    }));

    return user;
  }, [session.token]);

  const value = useMemo<AuthContextValue>(() => {
    const isAuthenticated =
      !!session.token && !!session.expiresAt && new Date(session.expiresAt).getTime() > Date.now();

    return {
      ...session,
      isAuthenticated,
      isAdmin: session.user?.role === "Admin",
      setSession,
      refreshProfile,
      logout,
    };
  }, [logout, refreshProfile, session, setSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}