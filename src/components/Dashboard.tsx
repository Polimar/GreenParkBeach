"use client";

import { useBeach } from "@/lib/beach-context";
import { Umbrella, CheckCircle, Circle, Ban, TrendingUp, Users } from "lucide-react";

export function Dashboard() {
  const { stats, state, activePeriod } = useBeach();

  const cards = [
    { label: "Totale Ombrelloni", value: stats.total, icon: Umbrella, color: "text-sky-600 bg-sky-50" },
    { label: "Assegnati", value: stats.assigned, icon: CheckCircle, color: "text-amber-600 bg-amber-50" },
    { label: "Liberi", value: stats.available, icon: Circle, color: "text-emerald-600 bg-emerald-50" },
    { label: "Bloccati", value: stats.blocked, icon: Ban, color: "text-red-600 bg-red-50" },
    { label: "Occupazione", value: `${stats.occupancyRate}%`, icon: TrendingUp, color: "text-purple-600 bg-purple-50" },
    { label: "Gruppi Vicini", value: state.viciniGroups.length, icon: Users, color: "text-indigo-600 bg-indigo-50" },
  ];

  const byBlock = state.positions
    .filter((p) => p.status === "assigned" && p.block)
    .reduce<Record<string, number>>((acc, p) => {
      const b = p.block!;
      acc[b] = (acc[b] || 0) + 1;
      return acc;
    }, {});

  const grandeCount = state.positions.filter((p) => p.isGrande && p.status === "assigned").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {activePeriod && (
        <div className="rounded-xl bg-sky-600 px-5 py-4 text-white shadow-lg">
          <p className="text-sm opacity-80">Periodo attivo</p>
          <p className="text-xl font-bold">{activePeriod.name}</p>
          <p className="text-sm opacity-80">
            {new Date(activePeriod.startDate).toLocaleDateString("it-IT")} —{" "}
            {new Date(activePeriod.endDate).toLocaleDateString("it-IT")}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl bg-white p-4 shadow-sm">
            <div className={`mb-2 inline-flex rounded-lg p-2 ${card.color}`}>
              <card.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-semibold text-gray-800">Distribuzione per Blocco</h3>
          {Object.keys(byBlock).length === 0 ? (
            <p className="text-sm text-gray-400">Nessun dato</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(byBlock)
                .sort(([, a], [, b]) => b - a)
                .map(([block, count]) => (
                  <div key={block} className="flex items-center gap-2">
                    <span className="w-8 text-sm font-medium text-gray-600">{block}</span>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-sky-500"
                        style={{ width: `${(count / stats.assigned) * 100}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-sm text-gray-500">{count}</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-semibold text-gray-800">Riepilogo</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>Ombrelloni Grandi (GR): <strong>{grandeCount}</strong></li>
            <li>Posti liberi: <strong>{stats.available}</strong></li>
            <li>Ultimo aggiornamento:{" "}
              <strong>
                {state.lastUpdated
                  ? new Date(state.lastUpdated).toLocaleString("it-IT")
                  : "—"}
              </strong>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
