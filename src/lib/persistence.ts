import { AppState, PeriodSnapshot } from "./types";

const STORAGE_KEY = "greenpark-beach-state";
const IMAGES_KEY = "greenpark-beach-images";
const VERSION_KEY = "greenpark-beach-version";

export const STORAGE_VERSION = 3;

export function loadImages(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(IMAGES_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function saveAppState(state: AppState): void {
  if (typeof window === "undefined") return;

  const images: Record<string, string> = { ...loadImages() };
  const snapshotsClean: Record<string, PeriodSnapshot> = {};

  for (const [id, snap] of Object.entries(state.periodSnapshots ?? {})) {
    snapshotsClean[id] = { positions: snap.positions };
    if (snap.referenceImage) {
      images[id] = snap.referenceImage;
    }
  }

  const payload: AppState = {
    ...state,
    referenceImage: undefined,
    periodSnapshots: snapshotsClean,
    lastUpdated: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    localStorage.setItem(VERSION_KEY, String(STORAGE_VERSION));
    localStorage.setItem(IMAGES_KEY, JSON.stringify(images));
  } catch {
    // Quota superata: salva senza immagini
    try {
      localStorage.setItem(IMAGES_KEY, JSON.stringify({}));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      localStorage.setItem(VERSION_KEY, String(STORAGE_VERSION));
    } catch {
      // ultimo tentativo
    }
  }
}

export function loadAppState(fallback: AppState): AppState {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return fallback;
    const parsed = JSON.parse(stored) as AppState;
    if (!parsed.positions?.length || parsed.positions.length !== 107) return fallback;

    const images = loadImages();
    const snapshots: Record<string, PeriodSnapshot> = {};

    for (const [id, snap] of Object.entries(parsed.periodSnapshots ?? {})) {
      snapshots[id] = {
        positions: snap.positions,
        referenceImage: images[id],
      };
    }

    // Migrazione v2: crea snapshot dal periodo attivo se assente
    const activeId = parsed.periods?.find((p) => p.isActive)?.id ?? parsed.periods?.[0]?.id;
    if (activeId && !snapshots[activeId]) {
      snapshots[activeId] = {
        positions: parsed.positions.map((p) => ({ ...p })),
        referenceImage: parsed.referenceImage ?? images[activeId],
      };
    }

    return {
      ...parsed,
      periodSnapshots: snapshots,
      referenceImage: undefined,
    };
  } catch {
    return fallback;
  }
}

export { STORAGE_KEY, VERSION_KEY };
