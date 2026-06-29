import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireAuth, dbUnavailableResponse } from "@/lib/api-auth";
import { createPeriod, fetchServerState, isDbConfigured } from "@/lib/db";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  if (!(await isDbConfigured())) return dbUnavailableResponse();

  try {
    const state = await fetchServerState();
    return NextResponse.json({ periods: state.periods });
  } catch {
    return NextResponse.json({ error: "Errore lettura periodi" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  if (!(await isDbConfigured())) return dbUnavailableResponse();

  try {
    const body = await request.json();
    const { name, startDate, endDate } = body as { name: string; startDate: string; endDate: string };
    if (!name || !startDate || !endDate) {
      return NextResponse.json({ error: "Dati periodo mancanti" }, { status: 400 });
    }
    const period = await createPeriod({ name, startDate, endDate, setActive: true });
    const state = await fetchServerState();
    return NextResponse.json({ period, state });
  } catch {
    return NextResponse.json({ error: "Errore creazione periodo" }, { status: 500 });
  }
}
