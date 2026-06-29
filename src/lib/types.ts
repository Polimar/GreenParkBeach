export type UmbrellaStatus = "available" | "assigned" | "blocked";

export interface UmbrellaPosition {
  id: number;
  row: number;
  positionInRow: number;
  code: string | null;
  status: UmbrellaStatus;
  /** Nome completo camera, es. "127D", "351GR", "116 V" */
  roomCode?: string;
  guestName?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
  /** @deprecated migrato in roomCode */
  room?: string;
  /** @deprecated migrato in roomCode */
  block?: string;
  /** @deprecated GR è parte del nome camera, non una dimensione */
  isGrande?: boolean;
}

export interface ViciniGroup {
  id: string;
  positionIds: number[];
  label?: string;
}

export interface BookingPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface PeriodSnapshot {
  positions: UmbrellaPosition[];
  referenceImage?: string;
}

export interface AppState {
  positions: UmbrellaPosition[];
  viciniGroups: ViciniGroup[];
  periods: BookingPeriod[];
  /** Assegnazioni salvate per ogni periodo */
  periodSnapshots?: Record<string, PeriodSnapshot>;
  /** @deprecated usare periodSnapshots */
  referenceImage?: string;
  lastUpdated?: string;
}

export interface PeriodInput {
  name: string;
  startDate: string;
  endDate: string;
}

/** Pattern camera: numero + opzionale spazio + 1-2 lettere (es. 127D, 351GR, 116 V) */
const ROOM_CODE_PATTERN = /^(\d{2,3})(?:\s*([A-Za-z]{1,2}))?$/;

export function normalizeRoomCode(input: string): string {
  const trimmed = input.trim().toUpperCase().replace(/\s+/g, " ");
  if (trimmed === "XX") return "XX";
  const match = trimmed.match(ROOM_CODE_PATTERN);
  if (!match) return trimmed;
  const num = match[1];
  const suffix = match[2];
  if (!suffix) return num;
  if (suffix.length === 2) return `${num}${suffix}`;
  return `${num} ${suffix}`;
}

export function isValidRoomCode(input: string): boolean {
  const n = input.trim().toUpperCase();
  if (n === "XX") return true;
  if (/^\d{2,3}[A-Z]{1,2}$/.test(n)) return true;
  if (/^\d{2,3}\s+[A-Z]{1,2}$/.test(n)) return true;
  if (/^\d{2,3}$/.test(n)) return true;
  return false;
}

export function isValidPeriod(input: PeriodInput): boolean {
  return Boolean(input.name.trim() && input.startDate && input.endDate && input.startDate <= input.endDate);
}

export function getRoomSuffix(roomCode: string): string | null {
  const n = roomCode.trim().toUpperCase();
  const grMatch = n.match(/^(\d{2,3})(GR)$/);
  if (grMatch) return "GR";
  const match = n.match(/^\d{2,3}\s*([A-Z]{1,2})$/);
  return match ? match[1] : null;
}

export function formatRoomCode(pos: Pick<UmbrellaPosition, "roomCode" | "code" | "room" | "block" | "isGrande">): string {
  if (pos.roomCode) return pos.roomCode;
  if (pos.isGrande && pos.room) return `${pos.room}GR`;
  if (pos.room && pos.block) return normalizeRoomCode(`${pos.room} ${pos.block}`);
  if (pos.room) return pos.room;
  return pos.code ?? "";
}

export function migratePosition(pos: UmbrellaPosition): UmbrellaPosition {
  if (pos.roomCode) {
    return { ...pos, code: pos.code ?? pos.roomCode };
  }
  const roomCode = formatRoomCode(pos);
  if (roomCode && roomCode !== "XX") {
    return { ...pos, roomCode, code: roomCode };
  }
  return pos;
}

export function getStatusFromCode(code: string | null): UmbrellaStatus {
  if (!code) return "available";
  if (code === "XX") return "blocked";
  return "assigned";
}

export function codeToPosition(code: string | null): Partial<UmbrellaPosition> {
  if (!code) return { code: null, status: "available", roomCode: undefined };
  if (code === "XX") return { code: "XX", status: "blocked", roomCode: undefined };
  const roomCode = normalizeRoomCode(code);
  return { code: roomCode, status: "assigned", roomCode };
}

export function formatPeriodLabel(startDate: string, endDate: string): string {
  const fmt = (d: string) => new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" });
  return `${fmt(startDate)} – ${fmt(endDate)}`;
}
