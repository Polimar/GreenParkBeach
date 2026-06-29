import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/api-client";
import { roleFromPin } from "@/lib/auth-pins";
import type { StaffRole } from "@/lib/auth-pins";

export function getAuth(request: NextRequest): { role: StaffRole; pin: string } | null {
  const pin =
    request.cookies.get(AUTH_COOKIE)?.value ??
    request.headers.get("x-staff-pin") ??
    "";
  const role = roleFromPin(pin);
  if (!role) return null;
  return { role, pin };
}

export function requireAuth(request: NextRequest): { role: StaffRole; pin: string } | NextResponse {
  const auth = getAuth(request);
  if (!auth) {
    return NextResponse.json({ error: "Non autorizzato — effettua di nuovo il login" }, { status: 401 });
  }
  return auth;
}

export function requireAdmin(request: NextRequest): { role: StaffRole; pin: string } | NextResponse {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  if (auth.role !== "admin") {
    return NextResponse.json({ error: "Solo amministrativa può modificare i dati" }, { status: 403 });
  }
  return auth;
}

export function dbUnavailableResponse(): NextResponse {
  return NextResponse.json(
    { error: "Database non configurato. Collega Neon/Postgres al progetto Vercel." },
    { status: 503 }
  );
}

export function authCookieOptions(pin: string) {
  return {
    name: AUTH_COOKIE,
    value: pin.trim().toLowerCase(),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 12,
    path: "/",
  };
}
