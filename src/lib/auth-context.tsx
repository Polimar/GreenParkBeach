"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { roleFromPin, type StaffRole } from "@/lib/auth-pins";

const AUTH_KEY = "greenpark-auth";
const PIN_KEY = "greenpark-pin";
const ROLE_KEY = "greenpark-role";

interface AuthContextValue {
  isAuthenticated: boolean;
  role: StaffRole | null;
  login: (pin: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<StaffRole | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const storedRole = sessionStorage.getItem(ROLE_KEY) as StaffRole | null;
    const authed = sessionStorage.getItem(AUTH_KEY) === "true";
    setIsAuthenticated(authed);
    setRole(storedRole);
    setChecked(true);
  }, []);

  const login = (pin: string) => {
    const resolved = roleFromPin(pin);
    if (!resolved) return false;
    sessionStorage.setItem(AUTH_KEY, "true");
    sessionStorage.setItem(PIN_KEY, pin.trim().toLowerCase());
    sessionStorage.setItem(ROLE_KEY, resolved);
    setIsAuthenticated(true);
    setRole(resolved);
    return true;
  };

  const logout = () => {
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(PIN_KEY);
    sessionStorage.removeItem(ROLE_KEY);
    setIsAuthenticated(false);
    setRole(null);
  };

  if (!checked) return null;

  return (
    <AuthContext.Provider value={{ isAuthenticated, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export type { StaffRole } from "@/lib/auth-pins";
