"use client";

import { useBeach } from "@/lib/beach-context";
import { ROW_LABELS } from "@/lib/seed-data";
import { UmbrellaCell } from "./UmbrellaCell";
import { UmbrellaPosition } from "@/lib/types";

interface BeachGridProps {
  selectedId?: number;
  highlightedIds?: number[];
  onSelect: (position: UmbrellaPosition) => void;
}

export function BeachGrid({ selectedId, highlightedIds = [], onSelect }: BeachGridProps) {
  const { state } = useBeach();

  const rows = Array.from({ length: 8 }, (_, i) => i + 1);

  return (
    <div className="overflow-x-auto">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-sky-900">Mappa Ombrelloni</h2>
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded border border-emerald-300 bg-emerald-50" /> Libero
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded border border-amber-300 bg-amber-100" /> Assegnato
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded border border-red-300 bg-red-100" /> Bloccato
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded bg-purple-500" /> Vicini
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 xl:grid-cols-8">
        {rows.map((row) => {
          const positions = state.positions.filter((p) => p.row === row);
          return (
            <div key={row} className="rounded-xl border border-sky-200 bg-white/80 p-3 shadow-sm backdrop-blur">
              <h3 className="mb-2 text-center text-xs font-bold uppercase tracking-wide text-sky-700">
                {ROW_LABELS[row]}
              </h3>
              <div className="flex flex-col gap-1.5">
                {positions.map((pos) => (
                  <UmbrellaCell
                    key={pos.id}
                    position={pos}
                    selected={selectedId === pos.id}
                    highlighted={highlightedIds.includes(pos.id)}
                    onClick={() => onSelect(pos)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
