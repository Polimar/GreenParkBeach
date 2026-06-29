"use client";

import { useBeach } from "@/lib/beach-context";
import { Calendar, Plus } from "lucide-react";
import { useState } from "react";

export function CalendarView() {
  const { state, activePeriod, setActivePeriod, addPeriod } = useBeach();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");

  const handleAdd = () => {
    if (!newName || !newStart || !newEnd) return;
    addPeriod({ name: newName, startDate: newStart, endDate: newEnd, isActive: true });
    setShowAdd(false);
    setNewName("");
    setNewStart("");
    setNewEnd("");
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-sky-900">Calendario Periodi</h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1 rounded-lg bg-sky-600 px-3 py-1.5 text-sm text-white hover:bg-sky-700"
        >
          <Plus className="h-4 w-4" /> Nuovo periodo
        </button>
      </div>

      {showAdd && (
        <div className="rounded-xl border border-sky-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-3">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome periodo"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={newStart}
              onChange={(e) => setNewStart(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={newEnd}
              onChange={(e) => setNewEnd(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={handleAdd}
            className="mt-3 rounded-lg bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-700"
          >
            Crea periodo
          </button>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {state.periods.map((period) => {
          const assignedInPeriod = state.positions.filter(
            (p) =>
              p.status === "assigned" &&
              p.startDate === period.startDate &&
              p.endDate === period.endDate
          ).length;

          return (
            <button
              key={period.id}
              onClick={() => setActivePeriod(period.id)}
              className={`rounded-xl border-2 p-5 text-left transition ${
                period.isActive
                  ? "border-sky-500 bg-sky-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-sky-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <Calendar className={`h-5 w-5 ${period.isActive ? "text-sky-600" : "text-gray-400"}`} />
                <div>
                  <p className="font-semibold text-gray-900">{period.name}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(period.startDate).toLocaleDateString("it-IT")} —{" "}
                    {new Date(period.endDate).toLocaleDateString("it-IT")}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {assignedInPeriod} ombrelloni assegnati
                    {period.isActive && (
                      <span className="ml-2 rounded-full bg-sky-600 px-2 py-0.5 text-white">
                        Attivo
                      </span>
                    )}
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
