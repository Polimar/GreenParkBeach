export type UmbrellaStatus = "available" | "assigned" | "blocked";

export interface RoomCode {
  room: string;
  block?: string;
  isGrande?: boolean;
}

export interface UmbrellaPosition {
  id: number;
  row: number;
  positionInRow: number;
  code: string | null;
  status: UmbrellaStatus;
  room?: string;
  block?: string;
  isGrande?: boolean;
  guestName?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
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

export interface AppState {
  positions: UmbrellaPosition[];
  viciniGroups: ViciniGroup[];
  periods: BookingPeriod[];
  lastUpdated?: string;
}

export function parseRoomCode(code: string): RoomCode | null {
  if (!code || code === "XX") return null;
  const grMatch = code.match(/^(\d+)GR$/i);
  if (grMatch) return { room: grMatch[1], isGrande: true };
  const match = code.match(/^(\d+)\s*([A-Z]+)$/i);
  if (match) return { room: match[1], block: match[2].toUpperCase() };
  const numOnly = code.match(/^(\d+)$/);
  if (numOnly) return { room: numOnly[1] };
  return { room: code };
}

export function formatRoomCode(pos: UmbrellaPosition): string {
  if (!pos.room) return "";
  if (pos.isGrande) return `${pos.room}GR`;
  if (pos.block) return `${pos.room} ${pos.block}`;
  return pos.room;
}

export function getStatusFromCode(code: string | null): UmbrellaStatus {
  if (!code) return "available";
  if (code === "XX") return "blocked";
  return "assigned";
}

export function codeToPosition(code: string | null): Partial<UmbrellaPosition> {
  if (!code) return { code: null, status: "available", room: undefined, block: undefined, isGrande: false };
  if (code === "XX") return { code: "XX", status: "blocked" };
  const parsed = parseRoomCode(code);
  if (!parsed) return { code, status: "assigned" };
  return {
    code,
    status: "assigned",
    room: parsed.room,
    block: parsed.block,
    isGrande: parsed.isGrande ?? false,
  };
}
