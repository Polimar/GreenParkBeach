"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { useBeach } from "@/lib/beach-context";
import { UmbrellaPosition } from "@/lib/types";

interface SearchPanelProps {
  onSelect: (position: UmbrellaPosition) => void;
  /** inline = barra compatta senza card, per la pagina mappa */
  variant?: "card" | "inline";
  placeholder?: string;
}

export function SearchPanel({
  onSelect,
  variant = "card",
  placeholder = "Cerca camera, posizione, ospite...",
}: SearchPanelProps) {
  const { searchPositions } = useBeach();
  const [query, setQuery] = useState("");
  const results = query.length >= 1 ? searchPositions(query) : [];

  const handlePick = (pos: UmbrellaPosition) => {
    onSelect(pos);
    setQuery("");
  };

  const input = (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-10 text-base shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 active:text-gray-600"
          aria-label="Cancella ricerca"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  const resultsList = results.length > 0 && (
    <ul className="mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg divide-y divide-gray-100">
      {results.map((pos) => (
        <li key={pos.id}>
          <button
            type="button"
            onClick={() => handlePick(pos)}
            className="flex w-full items-center justify-between px-3 py-3 text-left text-sm active:bg-emerald-50"
          >
            <span>
              <strong className="text-emerald-700">{pos.code || "Libero"}</strong>
              <span className="ml-2 text-gray-500">#{pos.id}</span>
              {pos.guestName && <span className="text-gray-400"> · {pos.guestName}</span>}
            </span>
            <span className="shrink-0 text-xs text-gray-400">{pos.row}° fila</span>
          </button>
        </li>
      ))}
    </ul>
  );

  const empty = query.length >= 1 && results.length === 0 && (
    <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-400">
      Nessun risultato per &quot;{query}&quot;
    </p>
  );

  if (variant === "inline") {
    return (
      <div className="mb-3">
        {input}
        {resultsList}
        {empty}
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <h3 className="mb-3 font-semibold text-gray-800">Cerca Ombrellone</h3>
      {input}
      {resultsList}
      {empty}
    </div>
  );
}
