"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  loginWithApi,
  logoutWithApi,
  restoreAuthCredentials,
  type StaffRole,
} from "@/lib/api-client";

interface AuthContextValue {
  isAuthenticated: boolean;
  role: StaffRole | null;
  login: (pin: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<StaffRole | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const ok = restoreAuthCredentials();
    if (ok) {
      setIsAuthenticated(true);
      setRole(getStoredRoleFromMemory());
    }
    setChecked(true);
  }, []);

  const login = useCallback(async (pin: string) => {
    const resolved = await loginWithApi(pin);
    if (!resolved) return false;
    setIsAuthenticated(true);
    setRole(resolved);
    return true;
  }, []);

  const logout = useCallback(async () => {
    await logoutWithApi();
    setIsAuthenticated(false);
    setRole(null);
  }, []);

  if (!checked) return null;

  return (
    <AuthContext.Provider value={{ isAuthenticated, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function getStoredRoleFromMemory(): StaffRole | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("greenpark-role") as StaffRole | null;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export type { StaffRole } from "@/lib/auth-pins";
