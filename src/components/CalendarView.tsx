"use client";

import { useBeach } from "@/lib/beach-context";
import { Calendar, Plus } from "lucide-react";
import { useState } from "react";

export function CalendarView() {
  const { state, activePeriod, setActivePeriod, addPeriod, isAdmin } = useBeach();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newName || !newStart || !newEnd) return;
    setLoading("add");
    try {
      await addPeriod({ name: newName, startDate: newStart, endDate: newEnd, isActive: true });
      setShowAdd(false);
      setNewName("");
      setNewStart("");
      setNewEnd("");
    } finally {
      setLoading(null);
    }
  };

  const handleSelect = async (periodId: string) => {
    setLoading(periodId);
    try {
      await setActivePeriod(periodId);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-sky-900">Periodi</h2>
        {isAdmin && (
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1 rounded-lg bg-sky-600 px-3 py-1.5 text-sm text-white active:scale-95"
          >
            <Plus className="h-4 w-4" /> Nuovo
          </button>
        )}
      </div>

      {showAdd && isAdmin && (
        <div className="rounded-xl border border-sky-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome periodo"
              className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <input type="date" value={newStart} onChange={(e) => setNewStart(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
              <input type="date" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
            </div>
          </div>
          <button
            onClick={handleAdd}
            disabled={loading === "add"}
            className="mt-3 w-full rounded-lg bg-sky-600 py-2.5 text-sm text-white disabled:opacity-50"
          >
            {loading === "add" ? "Creazione..." : "Crea periodo"}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {state.periods.map((period) => {
          const assignedCount =
            period.id === activePeriod?.id
              ? state.positions.filter((p) => p.status !== "available").length
              : null;

          return (
            <button
              key={period.id}
              onClick={() => handleSelect(period.id)}
              disabled={loading === period.id}
              className={`w-full rounded-xl border-2 p-4 text-left transition active:scale-[0.99] ${
                period.isActive
                  ? "border-sky-500 bg-sky-50 shadow-md"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-start gap-3">
                <Calendar className={`mt-0.5 h-5 w-5 shrink-0 ${period.isActive ? "text-sky-600" : "text-gray-400"}`} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900">{period.name}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(period.startDate).toLocaleDateString("it-IT")} —{" "}
                    {new Date(period.endDate).toLocaleDateString("it-IT")}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {assignedCount !== null
                      ? `${assignedCount} ombrelloni assegnati`
                      : "Tocca per visualizzare"}
                    {period.isActive && (
                      <span className="ml-2 rounded-full bg-sky-600 px-2 py-0.5 text-white">Attivo</span>
                    )}
                    {loading === period.id && <span className="ml-2">Caricamento...</span>}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
