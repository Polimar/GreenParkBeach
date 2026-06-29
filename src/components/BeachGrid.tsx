"use client";

import { useEffect, useRef, useState } from "react";
import { useBeach } from "@/lib/beach-context";
import { ROW_LABELS } from "@/lib/seed-data";
import { UmbrellaCell } from "./UmbrellaCell";
import { SearchPanel } from "./SearchPanel";
import { UmbrellaPosition } from "@/lib/types";
import { ChevronDown, ChevronUp } from "lucide-react";

interface BeachGridProps {
  selectedId?: number;
  searchHighlightId?: number;
  onSelect: (position: UmbrellaPosition) => void;
  onSearchSelect: (position: UmbrellaPosition) => void;
}

export function BeachGrid({
  selectedId,
  searchHighlightId,
  onSelect,
  onSearchSelect,
}: BeachGridProps) {
  const { state, activePeriod } = useBeach();
  const [expandedRows, setExpandedRows] = useState<Set<number>>(() => new Set());
  const scrollTargetRef = useRef<number | null>(null);

  const rows = Array.from({ length: 8 }, (_, i) => i + 1);

  const toggleRow = (row: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(row)) next.delete(row);
      else next.add(row);
      return next;
    });
  };

  const handleSearchPick = (pos: UmbrellaPosition) => {
    setExpandedRows((prev) => new Set([...prev, pos.row]));
    scrollTargetRef.current = pos.id;
    onSearchSelect(pos);
  };

  useEffect(() => {
    if (!searchHighlightId) return;
    const pos = state.positions.find((p) => p.id === searchHighlightId);
    if (!pos) return;
    setExpandedRows((prev) => new Set([...prev, pos.row]));
    scrollTargetRef.current = searchHighlightId;
  }, [searchHighlightId, state.positions]);

  useEffect(() => {
    const id = scrollTargetRef.current;
    if (!id) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(`umbrella-${id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      scrollTargetRef.current = null;
    }, 150);
    return () => clearTimeout(timer);
  }, [expandedRows, searchHighlightId]);

  return (
    <div>
      <SearchPanel variant="inline" onSelect={handleSearchPick} />

      <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-500">
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded border border-emerald-300 bg-emerald-50" /> Libero</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded border border-amber-300 bg-amber-100" /> Assegnato</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded border border-red-300 bg-red-100" /> Bloccato</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded border-2 border-emerald-500 bg-emerald-100" /> Trovato</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-purple-500" /> Vicini</span>
      </div>

      {activePeriod && (
        <div className="mb-3 rounded-lg bg-sky-600 px-3 py-2 text-white">
          <p className="text-xs opacity-80">Periodo attivo</p>
          <p className="text-sm font-semibold">{activePeriod.name}</p>
        </div>
      )}

      <div className="space-y-2 md:hidden">
        {rows.map((row) => {
          const positions = state.positions.filter((p) => p.row === row);
          const expanded = expandedRows.has(row);
          const assigned = positions.filter((p) => p.status !== "available").length;
          const hasSearchHit = positions.some((p) => p.id === searchHighlightId);

          return (
            <div
              key={row}
              id={`row-${row}`}
              className={`overflow-hidden rounded-xl border bg-white shadow-sm transition-colors ${
                hasSearchHit ? "border-emerald-400 ring-1 ring-emerald-300" : "border-sky-200"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleRow(row)}
                className="flex w-full items-center justify-between px-3 py-2.5 active:bg-sky-50"
              >
                <span className="text-sm font-bold text-sky-800">{ROW_LABELS[row]}</span>
                <span className="flex items-center gap-2 text-xs text-gray-400">
                  {assigned}/{positions.length}
                  {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </span>
              </button>
              {expanded && (
                <div className="grid grid-cols-3 gap-1.5 border-t border-sky-100 p-2">
                  {positions.map((pos) => (
                    <div key={pos.id} id={`umbrella-${pos.id}`}>
                      <UmbrellaCell
                        position={pos}
                        selected={selectedId === pos.id}
                        searchHighlighted={searchHighlightId === pos.id}
                        onClick={() => onSelect(pos)}
                        compact
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="hidden gap-3 md:grid md:grid-cols-4 lg:grid-cols-8">
        {rows.map((row) => {
          const positions = state.positions.filter((p) => p.row === row);
          return (
            <div key={row} className="rounded-xl border border-sky-200 bg-white/80 p-2 shadow-sm">
              <h3 className="mb-2 text-center text-[10px] font-bold uppercase text-sky-700">
                {ROW_LABELS[row]}
              </h3>
              <div className="flex flex-col gap-1">
                {positions.map((pos) => (
                  <div key={pos.id} id={`umbrella-${pos.id}`}>
                    <UmbrellaCell
                      position={pos}
                      selected={selectedId === pos.id}
                      searchHighlighted={searchHighlightId === pos.id}
                      onClick={() => onSelect(pos)}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
