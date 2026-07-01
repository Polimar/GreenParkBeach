import { BookingPeriod } from "@/lib/types";

export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function findPeriodForDate(periods: BookingPeriod[], date: string): BookingPeriod | undefined {
  return periods.find((p) => p.startDate <= date && date <= p.endDate);
}
