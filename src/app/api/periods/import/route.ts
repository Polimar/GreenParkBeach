import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, dbUnavailableResponse } from "@/lib/api-auth";
import {
  bulkImportAssignments,
  createPeriod,
  fetchServerState,
  isDbConfigured,
} from "@/lib/db";
import { normalizeRoomCode } from "@/lib/types";

/** Crea nuovo periodo + import bulk in un'unica operazione */
export async function PUT(request: NextRequest) {
  const auth = requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  if (!(await isDbConfigured())) return dbUnavailableResponse();

  try {
    const body = await request.json();
    const { name, startDate, endDate, assignments } = body as {
      name: string;
      startDate: string;
      endDate: string;
      assignments: { positionId: number; roomCode: string | null }[];
    };

    if (!name || !startDate || !endDate) {
      return NextResponse.json({ error: "Periodo richiesto" }, { status: 400 });
    }

    const period = await createPeriod({ name, startDate, endDate, setActive: true });
    const normalized = (assignments ?? []).map((a) => ({
      positionId: a.positionId,
      roomCode: a.roomCode ? (a.roomCode === "XX" ? "XX" : normalizeRoomCode(a.roomCode)) : null,
    }));
    await bulkImportAssignments(period.id, normalized);

    const state = await fetchServerState();
    return NextResponse.json(state);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Errore import periodo" }, { status: 500 });
  }
}
