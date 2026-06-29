import { NextRequest, NextResponse } from "next/server";
import { requireAuth, dbUnavailableResponse } from "@/lib/api-auth";
import { fetchServerState, isDbConfigured } from "@/lib/db";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  if (!(await isDbConfigured())) return dbUnavailableResponse();

  try {
    const state = await fetchServerState();
    return NextResponse.json(state);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Errore lettura database" }, { status: 500 });
  }
}
