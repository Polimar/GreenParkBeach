import type { StaffRole } from "@/lib/auth-pins";
import { roleFromPin } from "@/lib/auth-pins";

export type { StaffRole };

const AUTH_COOKIE = "gp-auth";

let memoryPin: string | null = null;
let memoryRole: StaffRole | null = null;

export function setAuthCredentials(pin: string, role: StaffRole): void {
  memoryPin = pin.trim().toLowerCase();
  memoryRole = role;
  if (typeof window !== "undefined") {
    sessionStorage.setItem("greenpark-auth", "true");
    sessionStorage.setItem("greenpark-pin", memoryPin);
    sessionStorage.setItem("greenpark-role", role);
  }
}

export function clearAuthCredentials(): void {
  memoryPin = null;
  memoryRole = null;
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("greenpark-auth");
    sessionStorage.removeItem("greenpark-pin");
    sessionStorage.removeItem("greenpark-role");
  }
}

export function restoreAuthCredentials(): boolean {
  if (typeof window === "undefined") return false;
  const pin = sessionStorage.getItem("greenpark-pin");
  const role = sessionStorage.getItem("greenpark-role") as StaffRole | null;
  const authed = sessionStorage.getItem("greenpark-auth") === "true";
  if (authed && pin && role && roleFromPin(pin) === role) {
    memoryPin = pin;
    memoryRole = role;
    return true;
  }
  clearAuthCredentials();
  return false;
}

export function getStoredPin(): string | null {
  return memoryPin ?? (typeof window !== "undefined" ? sessionStorage.getItem("greenpark-pin") : null);
}

export function getStoredRole(): StaffRole | null {
  return memoryRole ?? (typeof window !== "undefined" ? (sessionStorage.getItem("greenpark-role") as StaffRole | null) : null);
}

export async function loginWithApi(pin: string): Promise<StaffRole | null> {
  const role = roleFromPin(pin);
  if (!role) return null;

  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ pin: pin.trim().toLowerCase() }),
  });

  if (!res.ok) return null;

  setAuthCredentials(pin, role);
  return role;
}

export async function logoutWithApi(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
  clearAuthCredentials();
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const pin = getStoredPin();

  const res = await fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(pin ? { "X-Staff-Pin": pin } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Errore ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export function canWrite(role: StaffRole | null): boolean {
  return role === "admin";
}

export { AUTH_COOKIE };
