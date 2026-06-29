import { NextResponse } from "next/server";
import { isDbConfigured, seedDatabase } from "@/lib/db";

export async function POST() {
  if (!(await isDbConfigured())) {
    return NextResponse.json({ error: "Database non configurato" }, { status: 503 });
  }
  try {
    await seedDatabase();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Errore inizializzazione" }, { status: 500 });
  }
}
