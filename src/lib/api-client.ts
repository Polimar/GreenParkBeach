import type { StaffRole } from "@/lib/auth-pins";
import { roleFromPin } from "@/lib/auth-pins";

export type { StaffRole };

export function getStoredPin(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("greenpark-pin");
}

export function getStoredRole(): StaffRole | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("greenpark-role") as StaffRole | null;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const pin = getStoredPin();
  const role = getStoredRole();

  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(pin ? { "X-Staff-Pin": pin } : {}),
      ...(role ? { "X-Staff-Role": role } : {}),
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
