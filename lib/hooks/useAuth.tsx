"use client";

// ─────────────────────────────────────────────
// Auth Context & Provider
// ─────────────────────────────────────────────
// Provee estado de autenticación a toda la app.
// Persiste el usuario en localStorage para
// recargas y valida el token al montar.
// ─────────────────────────────────────────────

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { AuthState, LoginRequest, User } from "@/lib/types";
import * as authService from "@/lib/services/auth.service";
import { removeStoredToken } from "@/lib/api";

// ── Context shape ─────────────────────────────

interface AuthContextValue extends AuthState {
  login: (payload: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Storage keys ──────────────────────────────

const USER_STORAGE_KEY = "eco_user";

function getPersistedUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function persistUser(user: User | null) {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

// ── Provider ──────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = getPersistedUser();
    const storedToken =
      typeof window !== "undefined"
        ? localStorage.getItem("eco_token")
        : null;

    if (stored && storedToken) {
      // Ensure the cookie is in sync so the proxy (edge) can read it.
      // This covers stale sessions where localStorage has a token but
      // the cookie was never set or expired.
      if (!document.cookie.includes("eco_token=")) {
        document.cookie = `eco_token=${storedToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      }

      setUser(stored);
      setToken(storedToken);

      // Validate token against backend (optional, graceful)
      authService
        .getMe()
        .then((freshUser) => {
          setUser(freshUser);
          persistUser(freshUser);
        })
        .catch(() => {
          // Token inválido — limpiar todo
          setUser(null);
          setToken(null);
          persistUser(null);
          removeStoredToken();
        })
        .finally(() => setIsLoading(false));
    } else {
      // No hay sesión — limpiar posibles restos inconsistentes
      persistUser(null);
      removeStoredToken();
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (payload: LoginRequest) => {
    setIsLoading(true);
    try {
      const res = await authService.login(payload);
      setUser(res.user);
      setToken(res.token);
      persistUser(res.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setToken(null);
      persistUser(null);
      setIsLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const freshUser = await authService.getMe();
      setUser(freshUser);
      persistUser(freshUser);
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: !!user && !!token,
      isLoading,
      login,
      logout,
      refreshUser,
    }),
    [user, token, isLoading, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Hook ──────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }
  return ctx;
}
