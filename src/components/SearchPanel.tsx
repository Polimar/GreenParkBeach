"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { useBeach } from "@/lib/beach-context";
import { UmbrellaPosition } from "@/lib/types";

interface SearchPanelProps {
  onSelect: (position: UmbrellaPosition) => void;
}

export function SearchPanel({ onSelect }: SearchPanelProps) {
  const { searchPositions } = useBeach();
  const [query, setQuery] = useState("");
  const results = query.length >= 1 ? searchPositions(query) : [];

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <h3 className="mb-3 font-semibold text-gray-800">Cerca Ombrellone</h3>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="N° posizione, camera, blocco, ospite..."
          className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-10 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {results.length > 0 && (
        <ul className="mt-3 max-h-60 overflow-y-auto divide-y divide-gray-100">
          {results.map((pos) => (
            <li key={pos.id}>
              <button
                onClick={() => { onSelect(pos); setQuery(""); }}
                className="flex w-full items-center justify-between px-2 py-2.5 text-left text-sm hover:bg-sky-50"
              >
                <span>
                  <strong>#{pos.id}</strong> — {pos.code || "Libero"}
                  {pos.guestName && <span className="text-gray-500"> ({pos.guestName})</span>}
                </span>
                <span className="text-xs text-gray-400">{pos.row}° fila</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {query.length >= 1 && results.length === 0 && (
        <p className="mt-3 text-sm text-gray-400">Nessun risultato per &quot;{query}&quot;</p>
      )}
    </div>
  );
}
