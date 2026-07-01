"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Grid3X3,
  Calendar,
  Settings,
  LogOut,
  Umbrella,
  RefreshCw,
  Shield,
  Waves,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useBeach } from "@/lib/beach-context";
import { Dashboard } from "./Dashboard";
import { BeachGrid } from "./BeachGrid";
import { AssignmentModal } from "./AssignmentModal";
import { CalendarView } from "./CalendarView";
import { PhotoImport } from "./PhotoImport";
import { UmbrellaPosition } from "@/lib/types";

type Tab = "dashboard" | "grid" | "calendar" | "settings";

const MOBILE_TABS: { id: Tab; label: string; icon: typeof Grid3X3 }[] = [
  { id: "grid", label: "Mappa", icon: Grid3X3 },
  { id: "dashboard", label: "Stats", icon: LayoutDashboard },
  { id: "calendar", label: "Periodi", icon: Calendar },
];

export function AppShell() {
  const { logout } = useAuth();
  const { stats, activePeriod, refresh, error, isAdmin, canEditAssignments, loading } = useBeach();
  const [tab, setTab] = useState<Tab>("grid");
  const [selected, setSelected] = useState<UmbrellaPosition | null>(null);
  const [searchHighlightId, setSearchHighlightId] = useState<number | undefined>();
  const [refreshing, setRefreshing] = useState(false);

  const handleSelect = (pos: UmbrellaPosition) => {
    setSelected(pos);
  };

  const handleSearchSelect = (pos: UmbrellaPosition) => {
    setSearchHighlightId(pos.id);
    setSelected(null);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const tabs = isAdmin
    ? [...MOBILE_TABS, { id: "settings" as Tab, label: "Admin", icon: Settings }]
    : MOBILE_TABS;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-gradient-to-b from-sky-50 to-amber-50/30">
      <header className="sticky top-0 z-40 border-b border-sky-200/60 bg-white/95 backdrop-blur-md safe-top">
        <div className="flex items-center justify-between gap-2 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-600">
              <Umbrella className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold text-sky-900">Green Park Beach</h1>
              <p className="truncate text-[11px] text-gray-500">
                {stats.assigned}/{stats.total} · {stats.occupancyRate}%
                {activePeriod && ` · ${activePeriod.name}`}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <span className={`hidden items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium sm:flex ${
              isAdmin ? "bg-sky-100 text-sky-700" : "bg-emerald-100 text-emerald-700"
            }`}>
              {isAdmin ? <Shield className="h-3 w-3" /> : <Waves className="h-3 w-3" />}
              {isAdmin ? "Admin" : "Bagnino"}
            </span>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="rounded-lg p-2 text-gray-500 active:bg-gray-100"
              aria-label="Aggiorna"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg p-2 text-gray-500 active:bg-gray-100"
              aria-label="Esci"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
        {error && (
          <div className="bg-red-50 px-3 py-1.5 text-center text-xs text-red-600">{error}</div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto px-3 py-3 pb-20">
        {tab === "dashboard" && <Dashboard />}
        {tab === "grid" && (
          <BeachGrid
            selectedId={selected?.id}
            searchHighlightId={searchHighlightId}
            onSelect={handleSelect}
            onSearchSelect={handleSearchSelect}
          />
        )}
        {tab === "calendar" && <CalendarView />}
        {tab === "settings" && isAdmin && (
          <div className="space-y-4">
            <PhotoImport />
            <div className="rounded-xl bg-white p-4 text-sm text-gray-500 shadow-sm">
              <p>I dati sono salvati sul server e condivisi tra ufficio e spiaggia.</p>
              <p className="mt-2">Si aggiornano automaticamente ogni 20 secondi.</p>
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-md safe-bottom">
        <div className="flex items-stretch justify-around">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition active:scale-95 ${
                tab === t.id ? "text-sky-600" : "text-gray-400"
              }`}
            >
              <t.icon className={`h-5 w-5 ${tab === t.id ? "text-sky-600" : ""}`} />
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <AssignmentModal position={selected} onClose={() => setSelected(null)} readOnly={!canEditAssignments} />
    </div>
  );
}
