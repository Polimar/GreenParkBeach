import { NextRequest, NextResponse } from "next/server";
import { authCookieOptions } from "@/lib/api-auth";
import { roleFromPin } from "@/lib/auth-pins";

export async function POST(request: NextRequest) {
  try {
    const { pin } = (await request.json()) as { pin?: string };
    if (!pin) {
      return NextResponse.json({ error: "PIN richiesto" }, { status: 400 });
    }

    const role = roleFromPin(pin);
    if (!role) {
      return NextResponse.json({ error: "PIN non valido" }, { status: 401 });
    }

    const response = NextResponse.json({ role, ok: true });
    response.cookies.set(authCookieOptions(pin));
    return response;
  } catch {
    return NextResponse.json({ error: "Errore login" }, { status: 500 });
  }
}
