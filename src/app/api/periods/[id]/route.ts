import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireAuth, dbUnavailableResponse } from "@/lib/api-auth";
import { activatePeriod, fetchPeriodMap, fetchServerState, isDbConfigured } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  if (!(await isDbConfigured())) return dbUnavailableResponse();

  try {
    const { id } = await params;
    const map = await fetchPeriodMap(id);
    return NextResponse.json(map);
  } catch {
    return NextResponse.json({ error: "Periodo non trovato" }, { status: 404 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  if (!(await isDbConfigured())) return dbUnavailableResponse();

  try {
    const { id } = await params;
    const body = await request.json();
    if (body.action === "activate") {
      await activatePeriod(id);
      const state = await fetchServerState();
      return NextResponse.json(state);
    }
    return NextResponse.json({ error: "Azione non valida" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Errore aggiornamento periodo" }, { status: 500 });
  }
}
