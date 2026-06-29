import { NextRequest, NextResponse } from "next/server";
import { roleFromPin } from "@/lib/auth-pins";
import type { StaffRole } from "@/lib/auth-pins";

export function getAuth(request: NextRequest): { role: StaffRole; pin: string } | null {
  const pin = request.headers.get("x-staff-pin") ?? "";
  const role = roleFromPin(pin);
  if (!role) return null;
  return { role, pin };
}

export function requireAuth(request: NextRequest): { role: StaffRole; pin: string } | NextResponse {
  const auth = getAuth(request);
  if (!auth) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
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
    { error: "Database non configurato. Collega Vercel Postgres al progetto." },
    { status: 503 }
  );
}
