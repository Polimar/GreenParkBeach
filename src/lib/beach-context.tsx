"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch, canEditAssignments, canWrite } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { createEmptyPositions } from "@/lib/seed-data";
import {
  AppState,
  BookingPeriod,
  PeriodInput,
  UmbrellaPosition,
  ViciniGroup,
  normalizeRoomCode,
} from "@/lib/types";
import { findPeriodForDate, todayIso } from "@/lib/utils";

interface BulkAssignment {
  positionId: number;
  roomCode: string | null;
}

export interface BulkImportOptions {
  period: PeriodInput;
  referenceImage?: string;
}

interface ServerStateResponse {
  periods: BookingPeriod[];
  activePeriod: BookingPeriod | undefined;
  positions: UmbrellaPosition[];
  viciniGroups: ViciniGroup[];
  lastUpdated: string;
}

interface AssignmentUpdateResponse {
  period: BookingPeriod;
  positions: UmbrellaPosition[];
  viciniGroups: ViciniGroup[];
  periods: BookingPeriod[];
  lastUpdated: string;
}

interface BeachContextValue {
  state: AppState;
  activePeriod: BookingPeriod | undefined;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  canEditAssignments: boolean;
  /** @deprecated usa canEditAssignments */
  isReadOnly: boolean;
  refresh: () => Promise<void>;
  assignUmbrella: (id: number, data: Partial<UmbrellaPosition>) => Promise<void>;
  clearUmbrella: (id: number) => Promise<void>;
  blockUmbrella: (id: number) => Promise<void>;
  applyBulkAssignments: (assignments: BulkAssignment[], options: BulkImportOptions) => Promise<void>;
  setActivePeriod: (periodId: string) => Promise<void>;
  addPeriod: (period: Omit<BookingPeriod, "id">) => Promise<void>;
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

const POLL_MS = 20_000;

function mergeAssignmentUpdate(_prev: AppState, data: AssignmentUpdateResponse): AppState {
  return {
    positions: data.positions,
    viciniGroups: data.viciniGroups,
    periods: data.periods.map((p) => ({ ...p, isActive: p.id === data.period.id })),
    lastUpdated: data.lastUpdated,
  };
}

function toAppState(data: ServerStateResponse): AppState {
  return {
    positions: data.positions,
    periods: data.periods,
    viciniGroups: data.viciniGroups,
    lastUpdated: data.lastUpdated,
  };
}

export function BeachProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, role, logout } = useAuth();
  const [state, setState] = useState<AppState>({
    positions: createEmptyPositions(),
    periods: [],
    viciniGroups: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const periodLandingDone = useRef(false);
  const userPickedPeriod = useRef(false);
  const viewedPeriodIdRef = useRef<string | null>(null);

  const isAdmin = canWrite(role);
  const canEdit = canEditAssignments(role);
  const isReadOnly = !canEdit;

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await apiFetch<ServerStateResponse>("/api/state");
      const viewedId = viewedPeriodIdRef.current;

      if (!isAdmin && viewedId) {
        const map = await apiFetch<{
          period: BookingPeriod;
          positions: UmbrellaPosition[];
          viciniGroups: ViciniGroup[];
        }>(`/api/periods/${viewedId}`);
        setState({
          positions: map.positions,
          viciniGroups: map.viciniGroups,
          periods: data.periods.map((p) => ({ ...p, isActive: p.id === viewedId })),
          lastUpdated: data.lastUpdated,
        });
      } else {
        setState(toAppState(data));
      }
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Errore di connessione";
      setError(message);
      if (message.includes("autorizzato") || message.includes("401")) {
        await logout();
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isAdmin, logout]);

  useEffect(() => {
    if (!isAuthenticated) {
      periodLandingDone.current = false;
      userPickedPeriod.current = false;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    refresh();
    const interval = setInterval(refresh, POLL_MS);
    return () => clearInterval(interval);
  }, [isAuthenticated, refresh]);

  const activePeriod = useMemo(
    () => state.periods.find((p) => p.isActive) ?? state.periods[0],
    [state.periods]
  );

  useEffect(() => {
    if (activePeriod) viewedPeriodIdRef.current = activePeriod.id;
  }, [activePeriod?.id]);

  const activatePeriodOnServer = useCallback(
    async (periodId: string) => {
      viewedPeriodIdRef.current = periodId;
      if (!isAdmin) {
        const map = await apiFetch<{
          period: BookingPeriod;
          positions: UmbrellaPosition[];
          viciniGroups: ViciniGroup[];
        }>(`/api/periods/${periodId}`);
        setState((prev) => ({
          ...prev,
          positions: map.positions,
          viciniGroups: map.viciniGroups,
          periods: prev.periods.map((p) => ({ ...p, isActive: p.id === periodId })),
        }));
        return;
      }
      const updated = await apiFetch<ServerStateResponse>(`/api/periods/${periodId}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "activate" }),
      });
      setState(toAppState(updated));
    },
    [isAdmin]
  );

  useEffect(() => {
    if (!isAuthenticated || loading || periodLandingDone.current || state.periods.length === 0) return;

    periodLandingDone.current = true;
    const todayPeriod = findPeriodForDate(state.periods, todayIso());
    if (!todayPeriod || todayPeriod.isActive || userPickedPeriod.current) return;

    void activatePeriodOnServer(todayPeriod.id);
  }, [isAuthenticated, loading, state.periods, activatePeriodOnServer]);

  const stats = useMemo(() => {
    const assigned = state.positions.filter((p) => p.status === "assigned").length;
    const blocked = state.positions.filter((p) => p.status === "blocked").length;
    const available = state.positions.filter((p) => p.status === "available").length;
    return {
      total: state.positions.length,
      assigned,
      available,
      blocked,
      occupancyRate: state.positions.length ? Math.round((assigned / state.positions.length) * 100) : 0,
    };
  }, [state.positions]);

  const assignUmbrella = useCallback(
    async (id: number, data: Partial<UmbrellaPosition>) => {
      if (!activePeriod || !canEdit) return;
      const roomCode = data.roomCode ? normalizeRoomCode(data.roomCode) : undefined;
      if (!roomCode) return;
      const updated = await apiFetch<AssignmentUpdateResponse>(
        `/api/periods/${activePeriod.id}/assignments`,
        {
          method: "PUT",
          body: JSON.stringify({
            positionId: id,
            roomCode,
            status: "assigned",
            guestName: data.guestName,
            notes: data.notes,
          }),
        }
      );
      setState((prev) => mergeAssignmentUpdate(prev, updated));
    },
    [activePeriod, canEdit]
  );

  const clearUmbrella = useCallback(
    async (id: number) => {
      if (!activePeriod || !canEdit) return;
      const updated = await apiFetch<AssignmentUpdateResponse>(
        `/api/periods/${activePeriod.id}/assignments`,
        { method: "PUT", body: JSON.stringify({ positionId: id, action: "clear" }) }
      );
      setState((prev) => mergeAssignmentUpdate(prev, updated));
    },
    [activePeriod, canEdit]
  );

  const blockUmbrella = useCallback(
    async (id: number) => {
      if (!activePeriod || !canEdit) return;
      const updated = await apiFetch<AssignmentUpdateResponse>(
        `/api/periods/${activePeriod.id}/assignments`,
        { method: "PUT", body: JSON.stringify({ positionId: id, action: "block" }) }
      );
      setState((prev) => mergeAssignmentUpdate(prev, updated));
    },
    [activePeriod, canEdit]
  );

  const applyBulkAssignments = useCallback(
    async (assignments: BulkAssignment[], options: BulkImportOptions) => {
      if (!isAdmin) return;
      const updated = await apiFetch<ServerStateResponse>("/api/periods/import", {
        method: "PUT",
        body: JSON.stringify({
          name: options.period.name,
          startDate: options.period.startDate,
          endDate: options.period.endDate,
          assignments,
        }),
      });
      setState(toAppState(updated));
    },
    [isAdmin]
  );

  const setActivePeriod = useCallback(
    async (periodId: string) => {
      userPickedPeriod.current = true;
      await activatePeriodOnServer(periodId);
    },
    [activatePeriodOnServer]
  );

  const addPeriod = useCallback(
    async (period: Omit<BookingPeriod, "id">) => {
      if (!isAdmin) return;
      const res = await apiFetch<{ period: BookingPeriod; state: ServerStateResponse }>("/api/periods", {
        method: "POST",
        body: JSON.stringify(period),
      });
      setState(toAppState(res.state));
    },
    [isAdmin]
  );

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
    loading,
    error,
    isAdmin,
    canEditAssignments: canEdit,
    isReadOnly,
    refresh,
    assignUmbrella,
    clearUmbrella,
    blockUmbrella,
    applyBulkAssignments,
    setActivePeriod,
    addPeriod,
    searchPositions,
    getViciniForPosition,
    stats,
  };

  if (loading && isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-sky-50 p-6">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600" />
        <p className="mt-4 text-sm text-gray-500">Caricamento dati dal server...</p>
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
