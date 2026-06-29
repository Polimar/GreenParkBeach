"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getInitialState } from "@/lib/seed-data";
import {
  AppState,
  BookingPeriod,
  UmbrellaPosition,
  ViciniGroup,
  codeToPosition,
  formatRoomCode,
  getStatusFromCode,
  migratePosition,
  normalizeRoomCode,
} from "@/lib/types";

const STORAGE_KEY = "greenpark-beach-state";
const STORAGE_VERSION = 2;

interface BulkAssignment {
  positionId: number;
  roomCode: string | null;
}

interface BeachContextValue {
  state: AppState;
  activePeriod: BookingPeriod | undefined;
  assignUmbrella: (id: number, data: Partial<UmbrellaPosition>) => void;
  clearUmbrella: (id: number) => void;
  blockUmbrella: (id: number) => void;
  updatePosition: (id: number, data: Partial<UmbrellaPosition>) => void;
  applyBulkAssignments: (assignments: BulkAssignment[], referenceImage?: string) => void;
  addViciniGroup: (positionIds: number[], label?: string) => void;
  removeViciniGroup: (groupId: string) => void;
  setActivePeriod: (periodId: string) => void;
  addPeriod: (period: Omit<BookingPeriod, "id">) => void;
  resetToSeed: () => void;
  exportData: () => string;
  importData: (json: string) => boolean;
  searchPositions: (query: string) => UmbrellaPosition[];
  getViciniForPosition: (id: number) => ViciniGroup | undefined;
  stats: {
    total: number;
    assigned: number;
    available: number;
    blocked: number;
    occupancyRate: number;
  };
}

const BeachContext = createContext<BeachContextValue | null>(null);

function migrateState(parsed: AppState): AppState {
  return {
    ...parsed,
    positions: parsed.positions.map(migratePosition),
  };
}

function loadState(): AppState {
  if (typeof window === "undefined") return getInitialState();
  try {
    const version = localStorage.getItem(`${STORAGE_KEY}-version`);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as AppState;
      if (parsed.positions?.length === 107) {
        if (version !== String(STORAGE_VERSION)) {
          return migrateState(parsed);
        }
        return migrateState(parsed);
      }
    }
  } catch {
    // ignore
  }
  return getInitialState();
}

export function BeachProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(getInitialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, lastUpdated: new Date().toISOString() }));
      localStorage.setItem(`${STORAGE_KEY}-version`, String(STORAGE_VERSION));
    }
  }, [state, hydrated]);

  const activePeriod = useMemo(
    () => state.periods.find((p) => p.isActive) ?? state.periods[0],
    [state.periods]
  );

  const stats = useMemo(() => {
    const assigned = state.positions.filter((p) => p.status === "assigned").length;
    const blocked = state.positions.filter((p) => p.status === "blocked").length;
    const available = state.positions.filter((p) => p.status === "available").length;
    return {
      total: state.positions.length,
      assigned,
      available,
      blocked,
      occupancyRate: Math.round((assigned / state.positions.length) * 100),
    };
  }, [state.positions]);

  const updatePosition = useCallback((id: number, data: Partial<UmbrellaPosition>) => {
    setState((prev) => ({
      ...prev,
      positions: prev.positions.map((p) => (p.id === id ? { ...p, ...data } : p)),
    }));
  }, []);

  const assignUmbrella = useCallback(
    (id: number, data: Partial<UmbrellaPosition>) => {
      const roomCode = data.roomCode
        ? normalizeRoomCode(data.roomCode)
        : data.code
          ? normalizeRoomCode(data.code)
          : undefined;
      if (!roomCode) return;
      const parsed = codeToPosition(roomCode);
      updatePosition(id, {
        ...parsed,
        guestName: data.guestName,
        startDate: data.startDate ?? activePeriod?.startDate,
        endDate: data.endDate ?? activePeriod?.endDate,
        notes: data.notes,
      });
    },
    [updatePosition, activePeriod]
  );

  const clearUmbrella = useCallback(
    (id: number) => {
      updatePosition(id, {
        code: null,
        status: "available",
        roomCode: undefined,
        guestName: undefined,
        startDate: undefined,
        endDate: undefined,
        notes: undefined,
      });
    },
    [updatePosition]
  );

  const blockUmbrella = useCallback(
    (id: number) => {
      updatePosition(id, {
        code: "XX",
        status: "blocked",
        roomCode: undefined,
        guestName: undefined,
      });
    },
    [updatePosition]
  );

  const applyBulkAssignments = useCallback(
    (assignments: BulkAssignment[], referenceImage?: string) => {
      setState((prev) => {
        const map = new Map(assignments.map((a) => [a.positionId, a.roomCode]));
        return {
          ...prev,
          referenceImage: referenceImage ?? prev.referenceImage,
          positions: prev.positions.map((p) => {
            if (!map.has(p.id)) return p;
            const roomCode = map.get(p.id);
            if (!roomCode) {
              return {
                ...p,
                code: null,
                status: "available" as const,
                roomCode: undefined,
                guestName: undefined,
                startDate: undefined,
                endDate: undefined,
              };
            }
            if (roomCode === "XX") {
              return { ...p, code: "XX", status: "blocked" as const, roomCode: undefined };
            }
            const normalized = normalizeRoomCode(roomCode);
            return {
              ...p,
              code: normalized,
              roomCode: normalized,
              status: "assigned" as const,
              startDate: activePeriod?.startDate,
              endDate: activePeriod?.endDate,
            };
          }),
        };
      });
    },
    [activePeriod]
  );

  const addViciniGroup = useCallback((positionIds: number[], label?: string) => {
    setState((prev) => ({
      ...prev,
      viciniGroups: [
        ...prev.viciniGroups,
        { id: `v-${Date.now()}`, positionIds, label },
      ],
    }));
  }, []);

  const removeViciniGroup = useCallback((groupId: string) => {
    setState((prev) => ({
      ...prev,
      viciniGroups: prev.viciniGroups.filter((g) => g.id !== groupId),
    }));
  }, []);

  const setActivePeriod = useCallback((periodId: string) => {
    setState((prev) => ({
      ...prev,
      periods: prev.periods.map((p) => ({ ...p, isActive: p.id === periodId })),
    }));
  }, []);

  const addPeriod = useCallback((period: Omit<BookingPeriod, "id">) => {
    setState((prev) => ({
      ...prev,
      periods: [...prev.periods.map((p) => ({ ...p, isActive: false })), { ...period, id: `p-${Date.now()}` }],
    }));
  }, []);

  const resetToSeed = useCallback(() => {
    setState(getInitialState());
  }, []);

  const exportData = useCallback(() => {
    const { referenceImage, ...exportable } = state;
    void referenceImage;
    return JSON.stringify(exportable, null, 2);
  }, [state]);

  const importData = useCallback((json: string) => {
    try {
      const parsed = migrateState(JSON.parse(json) as AppState);
      if (!parsed.positions?.length) return false;
      setState(parsed);
      return true;
    } catch {
      return false;
    }
  }, []);

  const searchPositions = useCallback(
    (query: string) => {
      const q = query.trim().toLowerCase();
      if (!q) return [];
      return state.positions.filter(
        (p) =>
          String(p.id).includes(q) ||
          p.code?.toLowerCase().includes(q) ||
          p.roomCode?.toLowerCase().includes(q) ||
          p.guestName?.toLowerCase().includes(q)
      );
    },
    [state.positions]
  );

  const getViciniForPosition = useCallback(
    (id: number) => state.viciniGroups.find((g) => g.positionIds.includes(id)),
    [state.viciniGroups]
  );

  const value: BeachContextValue = {
    state,
    activePeriod,
    assignUmbrella,
    clearUmbrella,
    blockUmbrella,
    updatePosition,
    applyBulkAssignments,
    addViciniGroup,
    removeViciniGroup,
    setActivePeriod,
    addPeriod,
    resetToSeed,
    exportData,
    importData,
    searchPositions,
    getViciniForPosition,
    stats,
  };

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sky-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600" />
      </div>
    );
  }

  return <BeachContext.Provider value={value}>{children}</BeachContext.Provider>;
}

export function useBeach() {
  const ctx = useContext(BeachContext);
  if (!ctx) throw new Error("useBeach must be used within BeachProvider");
  return ctx;
}

export { getStatusFromCode, formatRoomCode };
