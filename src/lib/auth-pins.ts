export type StaffRole = "admin" | "bagnino";

const PINS: Record<string, StaffRole> = {
  greenpark: "admin",
  bagnino: "bagnino",
};

export function roleFromPin(pin: string): StaffRole | null {
  return PINS[pin.trim().toLowerCase()] ?? null;
}
