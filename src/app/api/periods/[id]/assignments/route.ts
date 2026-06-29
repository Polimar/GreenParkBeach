import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, dbUnavailableResponse } from "@/lib/api-auth";
import { fetchServerState, isDbConfigured, upsertAssignment } from "@/lib/db";
import { normalizeRoomCode } from "@/lib/types";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  if (!(await isDbConfigured())) return dbUnavailableResponse();

  try {
    const { id: periodId } = await params;
    const body = await request.json();
    const { positionId, roomCode, status, guestName, notes, action } = body as {
      positionId: number;
      roomCode?: string;
      status?: string;
      guestName?: string;
      notes?: string;
      action?: "clear" | "block";
    };

    if (!positionId) {
      return NextResponse.json({ error: "positionId richiesto" }, { status: 400 });
    }

    if (action === "clear") {
      await upsertAssignment(periodId, positionId, { status: "available" });
    } else if (action === "block") {
      await upsertAssignment(periodId, positionId, { status: "blocked" });
    } else if (status === "assigned" && roomCode) {
      await upsertAssignment(periodId, positionId, {
        status: "assigned",
        roomCode: normalizeRoomCode(roomCode),
        guestName,
        notes,
      });
    } else {
      return NextResponse.json({ error: "Dati assegnazione non validi" }, { status: 400 });
    }

    const state = await fetchServerState();
    return NextResponse.json(state);
  } catch {
    return NextResponse.json({ error: "Errore salvataggio" }, { status: 500 });
  }
}
