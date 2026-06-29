"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Grid3X3,
  Calendar,
  Users,
  LogOut,
  Umbrella,
  Bell,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useBeach } from "@/lib/beach-context";
import { Dashboard } from "./Dashboard";
import { BeachGrid } from "./BeachGrid";
import { AssignmentModal } from "./AssignmentModal";
import { SearchPanel } from "./SearchPanel";
import { CalendarView } from "./CalendarView";
import { ViciniPanel } from "./ViciniPanel";
import { DataManagement } from "./DataManagement";
import { PhotoImport } from "./PhotoImport";
import { UmbrellaPosition } from "@/lib/types";

type Tab = "dashboard" | "grid" | "calendar" | "vicini" | "settings";

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "grid", label: "Mappa", icon: Grid3X3 },
  { id: "calendar", label: "Calendario", icon: Calendar },
  { id: "vicini", label: "Vicini", icon: Users },
  { id: "settings", label: "Impostazioni", icon: Bell },
];

export function AppShell() {
  const { logout } = useAuth();
  const { stats } = useBeach();
  const [tab, setTab] = useState<Tab>("grid");
  const [selected, setSelected] = useState<UmbrellaPosition | null>(null);
  const [highlightedIds, setHighlightedIds] = useState<number[]>([]);

  const handleSelect = (pos: UmbrellaPosition) => {
    setSelected(pos);
    setHighlightedIds([pos.id]);
  };

  const handleSearchSelect = (pos: UmbrellaPosition) => {
    setTab("grid");
    handleSelect(pos);
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-sky-200/60 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-600">
              <Umbrella className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-sky-900">Green Park Beach</h1>
              <p className="text-xs text-gray-500">
                {stats.assigned}/{stats.total} assegnati — {stats.occupancyRate}% occupazione
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100"
          >
            <LogOut className="h-4 w-4" /> Esci
          </button>
        </div>

        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
                tab === t.id
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-sky-50"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {tab === "dashboard" && <Dashboard />}
        {tab === "grid" && (
          <div className="space-y-4">
            <SearchPanel onSelect={handleSearchSelect} />
            <BeachGrid
              selectedId={selected?.id}
              highlightedIds={highlightedIds}
              onSelect={handleSelect}
            />
          </div>
        )}
        {tab === "calendar" && <CalendarView />}
        {tab === "vicini" && <ViciniPanel />}
        {tab === "settings" && (
          <div className="space-y-4">
            <PhotoImport />
            <DataManagement />
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <h3 className="mb-2 font-semibold text-gray-800">Informazioni</h3>
              <p className="text-sm text-gray-500">
                Green Park Beach — Umbrella Management System v1.0
              </p>
              <p className="mt-2 text-sm text-gray-500">
                PIN di accesso staff: <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">greenpark</code>
              </p>
              <p className="mt-2 text-sm text-gray-500">
                I dati vengono salvati automaticamente nel browser. Usa Esporta/Importa JSON per condividere i dati tra dispositivi.
              </p>
            </div>
          </div>
        )}
      </main>

      <AssignmentModal position={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
