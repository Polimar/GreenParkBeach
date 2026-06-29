"use client";

import { useBeach } from "@/lib/beach-context";
import { Users, Trash2 } from "lucide-react";

export function ViciniPanel() {
  const { state, removeViciniGroup } = useBeach();

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-lg font-semibold text-sky-900">Gruppi Vicini</h2>
      <p className="text-sm text-gray-500">
        I gruppi VICINI collegano ombrelloni assegnati a ospiti che desiderano stare vicini.
      </p>

      {state.viciniGroups.length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-center text-gray-400 shadow-sm">
          Nessun gruppo vicini definito
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {state.viciniGroups.map((group) => {
            const positions = state.positions.filter((p) => group.positionIds.includes(p.id));
            return (
              <div key={group.id} className="rounded-xl border border-purple-200 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-700">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">{group.label || `Gruppo ${group.id}`}</span>
                  </div>
                  <button
                    onClick={() => removeViciniGroup(group.id)}
                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {positions.map((p) => (
                    <span
                      key={p.id}
                      className="rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-800"
                    >
                      #{p.id} {p.code || "—"}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
