"use client";

import { UmbrellaPosition } from "@/lib/types";
import { useBeach } from "@/lib/beach-context";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";

interface UmbrellaCellProps {
  position: UmbrellaPosition;
  selected?: boolean;
  highlighted?: boolean;
  onClick: () => void;
}

export function UmbrellaCell({ position, selected, highlighted, onClick }: UmbrellaCellProps) {
  const { getViciniForPosition } = useBeach();
  const vicini = getViciniForPosition(position.id);

  const bgColor =
    position.status === "assigned"
      ? "bg-amber-100 border-amber-300"
      : position.status === "blocked"
        ? "bg-red-100 border-red-300"
        : "bg-emerald-50 border-emerald-200";

  const displayCode = position.code ?? "";

  return (
    <button
      onClick={onClick}
      className={cn(
        "umbrella-cell relative flex min-h-[52px] w-full flex-col items-center justify-center rounded-md border-2 p-1 text-center",
        bgColor,
        selected && "selected ring-2 ring-sky-600",
        highlighted && "ring-2 ring-yellow-400",
        position.status === "blocked" && "opacity-70"
      )}
      title={`Posizione ${position.id} — ${displayCode || "Libero"}`}
    >
      {vicini && (
        <span className="absolute -left-1 top-1/2 -translate-y-1/2 rounded bg-purple-500 px-0.5 text-[7px] font-bold text-white">
          <Users className="h-2.5 w-2.5" />
        </span>
      )}
      <span className="text-[10px] font-bold leading-tight text-gray-800">
        {position.status === "blocked" ? "XX" : displayCode || "—"}
      </span>
      {position.isGrande && (
        <span className="text-[7px] font-semibold text-amber-700">GR</span>
      )}
      <span className="absolute -right-2 top-1/2 -translate-y-1/2 text-[9px] font-medium text-gray-400">
        {position.id}
      </span>
    </button>
  );
}
