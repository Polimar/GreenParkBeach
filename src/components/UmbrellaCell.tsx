"use client";

import { UmbrellaPosition } from "@/lib/types";
import { useBeach } from "@/lib/beach-context";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";

interface UmbrellaCellProps {
  position: UmbrellaPosition;
  selected?: boolean;
  highlighted?: boolean;
  compact?: boolean;
  onClick: () => void;
}

export function UmbrellaCell({ position, selected, highlighted, compact, onClick }: UmbrellaCellProps) {
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
        "umbrella-cell relative flex flex-col items-center justify-center rounded-lg border-2 text-center active:scale-95",
        compact ? "min-h-[56px] p-1" : "min-h-[48px] w-full p-1",
        bgColor,
        selected && "ring-2 ring-sky-600 ring-offset-1",
        highlighted && "ring-2 ring-yellow-400",
        position.status === "blocked" && "opacity-70"
      )}
      title={`#${position.id} — ${displayCode || "Libero"}`}
    >
      {vicini && (
        <span className="absolute left-0.5 top-0.5 rounded-full bg-purple-500 p-0.5">
          <Users className="h-2 w-2 text-white" />
        </span>
      )}
      <span className={cn("font-bold leading-tight text-gray-800", compact ? "text-[11px]" : "text-[10px]")}>
        {position.status === "blocked" ? "XX" : displayCode || "—"}
      </span>
      <span className={cn("font-medium text-gray-400", compact ? "text-[9px]" : "text-[8px]")}>
        #{position.id}
      </span>
    </button>
  );
}
