import { sql } from "@vercel/postgres";
import { createEmptyPositions, getInitialState } from "@/lib/seed-data";
import { BookingPeriod, UmbrellaPosition, UmbrellaStatus, ViciniGroup } from "@/lib/types";

let schemaReady: Promise<void> | null = null;

export async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS periods (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS assignments (
          period_id TEXT NOT NULL REFERENCES periods(id) ON DELETE CASCADE,
          position_id SMALLINT NOT NULL CHECK (position_id BETWEEN 1 AND 107),
          room_code TEXT,
          status TEXT NOT NULL DEFAULT 'available',
          guest_name TEXT,
          notes TEXT,
          PRIMARY KEY (period_id, position_id)
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS vicini_groups (
          id TEXT PRIMARY KEY,
          period_id TEXT NOT NULL REFERENCES periods(id) ON DELETE CASCADE,
          position_ids JSONB NOT NULL,
          label TEXT
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS app_meta (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )
      `;
    })();
  }
  return schemaReady;
}

export async function isDbConfigured(): Promise<boolean> {
  return Boolean(process.env.POSTGRES_URL);
}

async function getMeta(key: string): Promise<string | null> {
  const { rows } = await sql`SELECT value FROM app_meta WHERE key = ${key}`;
  return rows[0]?.value ?? null;
}

async function setMeta(key: string, value: string): Promise<void> {
  await sql`
    INSERT INTO app_meta (key, value) VALUES (${key}, ${value})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;
}

function rowToPeriod(row: Record<string, unknown>): BookingPeriod {
  return {
    id: row.id as string,
    name: row.name as string,
    startDate: String(row.start_date).slice(0, 10),
    endDate: String(row.end_date).slice(0, 10),
    isActive: Boolean(row.is_active),
  };
}

function mergeAssignments(
  layout: UmbrellaPosition[],
  rows: Record<string, unknown>[],
  period: BookingPeriod
): UmbrellaPosition[] {
  const map = new Map(rows.map((r) => [Number(r.position_id), r]));
  return layout.map((p) => {
    const row = map.get(p.id);
    if (!row) {
      return { ...p, startDate: period.startDate, endDate: period.endDate };
    }
    const status = row.status as UmbrellaStatus;
    const roomCode = row.room_code as string | null;
    return {
      ...p,
      status,
      roomCode: roomCode ?? undefined,
      code: status === "blocked" ? "XX" : roomCode ?? null,
      guestName: (row.guest_name as string) ?? undefined,
      notes: (row.notes as string) ?? undefined,
      startDate: status === "assigned" ? period.startDate : undefined,
      endDate: status === "assigned" ? period.endDate : undefined,
    };
  });
}

export interface ServerState {
  periods: BookingPeriod[];
  activePeriod: BookingPeriod | undefined;
  positions: UmbrellaPosition[];
  viciniGroups: ViciniGroup[];
  lastUpdated: string;
}

export async function fetchServerState(): Promise<ServerState> {
  await ensureSchema();

  const seeded = await getMeta("seeded");
  if (seeded !== "true") {
    await seedDatabase();
  }

  const { rows: periodRows } = await sql`
    SELECT * FROM periods ORDER BY created_at DESC
  `;
  const periods = periodRows.map(rowToPeriod);
  const activePeriod = periods.find((p) => p.isActive) ?? periods[0];
  if (!activePeriod) {
    const empty = createEmptyPositions();
    return { periods: [], activePeriod: undefined, positions: empty, viciniGroups: [], lastUpdated: new Date().toISOString() };
  }

  const { rows: assignmentRows } = await sql`
    SELECT * FROM assignments WHERE period_id = ${activePeriod.id}
  `;
  const { rows: viciniRows } = await sql`
    SELECT * FROM vicini_groups WHERE period_id = ${activePeriod.id}
  `;

  const layout = createEmptyPositions();
  const positions = mergeAssignments(layout, assignmentRows, activePeriod);
  const viciniGroups: ViciniGroup[] = viciniRows.map((r) => ({
    id: r.id as string,
    positionIds: Array.isArray(r.position_ids)
      ? (r.position_ids as number[])
      : JSON.parse(String(r.position_ids ?? "[]")),
    label: (r.label as string) ?? undefined,
  }));

  return {
    periods,
    activePeriod,
    positions,
    viciniGroups,
    lastUpdated: new Date().toISOString(),
  };
}

export async function seedDatabase(): Promise<void> {
  const initial = getInitialState();
  const period = initial.periods[0];

  await sql`DELETE FROM vicini_groups`;
  await sql`DELETE FROM assignments`;
  await sql`DELETE FROM periods`;

  await sql`
    INSERT INTO periods (id, name, start_date, end_date, is_active)
    VALUES (${period.id}, ${period.name}, ${period.startDate}, ${period.endDate}, true)
  `;

  for (const pos of initial.positions) {
    if (pos.status === "available") continue;
    await sql`
      INSERT INTO assignments (period_id, position_id, room_code, status, guest_name, notes)
      VALUES (${period.id}, ${pos.id}, ${pos.roomCode ?? pos.code}, ${pos.status}, ${pos.guestName ?? null}, ${pos.notes ?? null})
    `;
  }

  for (const group of initial.viciniGroups) {
    await sql`
      INSERT INTO vicini_groups (id, period_id, position_ids, label)
      VALUES (${group.id}, ${period.id}, ${JSON.stringify(group.positionIds)}, ${group.label ?? null})
    `;
  }

  await setMeta("seeded", "true");
}

export async function createPeriod(input: {
  name: string;
  startDate: string;
  endDate: string;
  setActive?: boolean;
}): Promise<BookingPeriod> {
  await ensureSchema();
  const id = `p-${Date.now()}`;
  if (input.setActive !== false) {
    await sql`UPDATE periods SET is_active = false`;
  }
  await sql`
    INSERT INTO periods (id, name, start_date, end_date, is_active)
    VALUES (${id}, ${input.name}, ${input.startDate}, ${input.endDate}, ${input.setActive !== false})
  `;
  return { id, name: input.name, startDate: input.startDate, endDate: input.endDate, isActive: input.setActive !== false };
}

export async function activatePeriod(periodId: string): Promise<void> {
  await ensureSchema();
  await sql`UPDATE periods SET is_active = false`;
  await sql`UPDATE periods SET is_active = true WHERE id = ${periodId}`;
}

export async function upsertAssignment(
  periodId: string,
  positionId: number,
  data: {
    roomCode?: string | null;
    status: UmbrellaStatus;
    guestName?: string;
    notes?: string;
  }
): Promise<void> {
  await ensureSchema();
  if (data.status === "available") {
    await sql`DELETE FROM assignments WHERE period_id = ${periodId} AND position_id = ${positionId}`;
    return;
  }
  const roomCode = data.status === "blocked" ? null : data.roomCode ?? null;
  await sql`
    INSERT INTO assignments (period_id, position_id, room_code, status, guest_name, notes)
    VALUES (${periodId}, ${positionId}, ${roomCode}, ${data.status}, ${data.guestName ?? null}, ${data.notes ?? null})
    ON CONFLICT (period_id, position_id) DO UPDATE SET
      room_code = EXCLUDED.room_code,
      status = EXCLUDED.status,
      guest_name = EXCLUDED.guest_name,
      notes = EXCLUDED.notes
  `;
}

export async function bulkImportAssignments(
  periodId: string,
  assignments: { positionId: number; roomCode: string | null }[]
): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM assignments WHERE period_id = ${periodId}`;

  for (const a of assignments) {
    if (!a.roomCode) continue;
    if (a.roomCode === "XX") {
      await sql`
        INSERT INTO assignments (period_id, position_id, room_code, status)
        VALUES (${periodId}, ${a.positionId}, NULL, 'blocked')
      `;
    } else {
      await sql`
        INSERT INTO assignments (period_id, position_id, room_code, status)
        VALUES (${periodId}, ${a.positionId}, ${a.roomCode}, 'assigned')
      `;
    }
  }
}

export async function fetchPeriodMap(periodId: string): Promise<{
  period: BookingPeriod;
  positions: UmbrellaPosition[];
  viciniGroups: ViciniGroup[];
}> {
  await ensureSchema();
  const { rows } = await sql`SELECT * FROM periods WHERE id = ${periodId}`;
  if (!rows[0]) throw new Error("Periodo non trovato");
  const period = rowToPeriod(rows[0]);

  const { rows: assignmentRows } = await sql`SELECT * FROM assignments WHERE period_id = ${periodId}`;
  const { rows: viciniRows } = await sql`SELECT * FROM vicini_groups WHERE period_id = ${periodId}`;

  return {
    period,
    positions: mergeAssignments(createEmptyPositions(), assignmentRows, period),
    viciniGroups: viciniRows.map((r) => ({
      id: r.id as string,
      positionIds: Array.isArray(r.position_ids)
        ? (r.position_ids as number[])
        : JSON.parse(String(r.position_ids ?? "[]")),
      label: (r.label as string) ?? undefined,
    })),
  };
}
