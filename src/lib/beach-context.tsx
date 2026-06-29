"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createEmptyPositions, getInitialState } from "@/lib/seed-data";
import { loadAppState, saveAppState } from "@/lib/persistence";
import {
  AppState,
  BookingPeriod,
  PeriodInput,
  UmbrellaPosition,
  ViciniGroup,
  codeToPosition,
  formatRoomCode,
  getStatusFromCode,
  migratePosition,
  normalizeRoomCode,
} from "@/lib/types";

interface BulkAssignment {
  positionId: number;
  roomCode: string | null;
}

export interface BulkImportOptions {
  period: PeriodInput;
  referenceImage?: string;
}

interface BeachContextValue {
  state: AppState;
  activePeriod: BookingPeriod | undefined;
  assignUmbrella: (id: number, data: Partial<UmbrellaPosition>) => void;
  clearUmbrella: (id: number) => void;
  blockUmbrella: (id: number) => void;
  updatePosition: (id: number, data: Partial<UmbrellaPosition>) => void;
  applyBulkAssignments: (assignments: BulkAssignment[], options: BulkImportOptions) => void;
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
  const positions = parsed.positions.map(migratePosition);
  const snapshots = { ...parsed.periodSnapshots };

  for (const [id, snap] of Object.entries(snapshots)) {
    snapshots[id] = { ...snap, positions: snap.positions.map(migratePosition) };
  }

  const activeId = parsed.periods?.find((p) => p.isActive)?.id ?? parsed.periods?.[0]?.id;
  if (activeId && !snapshots[activeId]) {
    snapshots[activeId] = { positions };
  }

  return { ...parsed, positions, periodSnapshots: snapshots };
}

function withActiveSnapshot(state: AppState, positions: UmbrellaPosition[]): AppState {
  const activeId = state.periods.find((p) => p.isActive)?.id;
  if (!activeId) return { ...state, positions };

  return {
    ...state,
    positions,
    periodSnapshots: {
      ...state.periodSnapshots,
      [activeId]: {
        ...state.periodSnapshots?.[activeId],
        positions,
      },
    },
  };
}

function applyAssignmentsToPositions(
  base: UmbrellaPosition[],
  assignments: BulkAssignment[],
  startDate: string,
  endDate: string
): UmbrellaPosition[] {
  const map = new Map(assignments.map((a) => [a.positionId, a.roomCode]));

  return base.map((p) => {
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
      startDate,
      endDate,
    };
  });
}

function loadState(): AppState {
  const initial = getInitialState();
  if (typeof window === "undefined") return initial;
  return migrateState(loadAppState(initial));
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
      saveAppState(state);
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
    setState((prev) =>
      withActiveSnapshot(prev, prev.positions.map((p) => (p.id === id ? { ...p, ...data } : p)))
    );
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
      setState((prev) =>
        withActiveSnapshot(
          prev,
          prev.positions.map((p) =>
            p.id === id
              ? {
                  ...p,
                  ...parsed,
                  guestName: data.guestName,
                  startDate: data.startDate ?? activePeriod?.startDate,
                  endDate: data.endDate ?? activePeriod?.endDate,
                  notes: data.notes,
                }
              : p
          )
        )
      );
    },
    [activePeriod]
  );

  const clearUmbrella = useCallback((id: number) => {
    setState((prev) =>
      withActiveSnapshot(
        prev,
        prev.positions.map((p) =>
          p.id === id
            ? {
                ...p,
                code: null,
                status: "available" as const,
                roomCode: undefined,
                guestName: undefined,
                startDate: undefined,
                endDate: undefined,
                notes: undefined,
              }
            : p
        )
      )
    );
  }, []);

  const blockUmbrella = useCallback((id: number) => {
    setState((prev) =>
      withActiveSnapshot(
        prev,
        prev.positions.map((p) =>
          p.id === id
            ? { ...p, code: "XX", status: "blocked" as const, roomCode: undefined, guestName: undefined }
            : p
        )
      )
    );
  }, []);

  const applyBulkAssignments = useCallback((assignments: BulkAssignment[], options: BulkImportOptions) => {
    setState((prev) => {
      const activeId = prev.periods.find((p) => p.isActive)?.id;
      const snapshots = { ...prev.periodSnapshots };

      if (activeId) {
        snapshots[activeId] = {
          ...snapshots[activeId],
          positions: prev.positions,
        };
      }

      const newPeriodId = `p-${Date.now()}`;
      const newPeriod: BookingPeriod = {
        id: newPeriodId,
        name: options.period.name.trim(),
        startDate: options.period.startDate,
        endDate: options.period.endDate,
        isActive: true,
      };

      const newPositions = applyAssignmentsToPositions(
        createEmptyPositions(),
        assignments,
        options.period.startDate,
        options.period.endDate
      );

      snapshots[newPeriodId] = {
        positions: newPositions,
        referenceImage: options.referenceImage,
      };

      return {
        ...prev,
        periods: [...prev.periods.map((p) => ({ ...p, isActive: false })), newPeriod],
        positions: newPositions,
        periodSnapshots: snapshots,
      };
    });
  }, []);

  const addViciniGroup = useCallback((positionIds: number[], label?: string) => {
    setState((prev) => ({
      ...prev,
      viciniGroups: [...prev.viciniGroups, { id: `v-${Date.now()}`, positionIds, label }],
    }));
  }, []);

  const removeViciniGroup = useCallback((groupId: string) => {
    setState((prev) => ({
      ...prev,
      viciniGroups: prev.viciniGroups.filter((g) => g.id !== groupId),
    }));
  }, []);

  const setActivePeriod = useCallback((periodId: string) => {
    setState((prev) => {
      const currentActiveId = prev.periods.find((p) => p.isActive)?.id;
      const snapshots = { ...prev.periodSnapshots };

      if (currentActiveId && currentActiveId !== periodId) {
        snapshots[currentActiveId] = {
          ...snapshots[currentActiveId],
          positions: prev.positions,
        };
      }

      const loaded =
        snapshots[periodId]?.positions?.map((p) => ({ ...p })) ?? createEmptyPositions();

      return {
        ...prev,
        periods: prev.periods.map((p) => ({ ...p, isActive: p.id === periodId })),
        positions: loaded,
        periodSnapshots: snapshots,
      };
    });
  }, []);

  const addPeriod = useCallback((period: Omit<BookingPeriod, "id">) => {
    setState((prev) => {
      const currentActiveId = prev.periods.find((p) => p.isActive)?.id;
      const snapshots = { ...prev.periodSnapshots };

      if (currentActiveId) {
        snapshots[currentActiveId] = { ...snapshots[currentActiveId], positions: prev.positions };
      }

      const newId = `p-${Date.now()}`;
      const empty = createEmptyPositions();

      snapshots[newId] = { positions: empty };

      return {
        ...prev,
        periods: [...prev.periods.map((p) => ({ ...p, isActive: false })), { ...period, id: newId, isActive: true }],
        positions: empty,
        periodSnapshots: snapshots,
      };
    });
  }, []);

  const resetToSeed = useCallback(() => {
    const initial = getInitialState();
    setState(initial);
    saveAppState(initial);
  }, []);

  const exportData = useCallback(() => {
    const exportable = { ...state };
    delete exportable.referenceImage;
    return JSON.stringify(exportable, null, 2);
  }, [state]);

  const importData = useCallback((json: string) => {
    try {
      const parsed = migrateState(JSON.parse(json) as AppState);
      if (!parsed.positions?.length) return false;
      setState(parsed);
      saveAppState(parsed);
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
