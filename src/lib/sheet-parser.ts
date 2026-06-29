import { normalizeRoomCode } from "./types";

export interface ParsedAssignment {
  positionId: number;
  roomCode: string | null;
  confidence: "high" | "medium" | "low";
}

export interface ParseResult {
  assignments: ParsedAssignment[];
  rawText: string;
  warnings: string[];
}

export interface OCRWord {
  text: string;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}

const ROW_SIZES = [15, 15, 15, 15, 15, 12, 10, 10];
const TOTAL = 107;

const NOISE_WORDS = new Set([
  "BOOKING", "SPIAGGIA", "LUGLIO", "DAL", "AL", "FILA", "VICINI",
  "GREENPARK", "BEACH", "GREEN", "PARK", "DAL", "AL",
]);

const ROOM_PATTERN = /^(\d{2,3})([A-Z]{1,2})?$/;
const ROOM_WITH_SPACE = /^(\d{2,3})\s+([A-Z])$/;

function isRoomCode(text: string): boolean {
  const t = text.trim().toUpperCase().replace(/\s+/g, " ");
  if (t === "XX") return true;
  if (ROOM_PATTERN.test(t.replace(/\s/g, ""))) return true;
  if (ROOM_WITH_SPACE.test(t)) return true;
  const normalized = t.replace(/(\d+)\s*([A-Z]{1,2})/, "$1$2");
  return ROOM_PATTERN.test(normalized);
}

function normalizeOCRCode(text: string): string {
  const t = text.trim().toUpperCase();
  if (t === "XX") return "XX";
  // Corregge OCR comuni: "3O5GR" -> "305GR", "1l6" -> "116"
  const cleaned = t
    .replace(/O/g, "0")
    .replace(/l/g, "1")
    .replace(/I/g, "1")
    .replace(/\s+/g, " ");
  return normalizeRoomCode(cleaned);
}

function isPositionNumber(text: string): number | null {
  const n = parseInt(text.trim(), 10);
  if (isNaN(n) || n < 1 || n > TOTAL) return null;
  return n;
}

function wordCenter(w: OCRWord) {
  return { x: (w.bbox.x0 + w.bbox.x1) / 2, y: (w.bbox.y0 + w.bbox.y1) / 2 };
}

function clusterIntoRows(words: OCRWord[], numRows = 8): OCRWord[][] {
  if (words.length === 0) return [];
  const sorted = [...words].sort((a, b) => wordCenter(a).y - wordCenter(b).y);
  const minY = wordCenter(sorted[0]).y;
  const maxY = wordCenter(sorted[sorted.length - 1]).y;
  const bandHeight = (maxY - minY) / numRows;

  const rows: OCRWord[][] = Array.from({ length: numRows }, () => []);

  for (const w of sorted) {
    const y = wordCenter(w).y;
    let rowIdx = Math.floor((y - minY) / bandHeight);
    if (rowIdx >= numRows) rowIdx = numRows - 1;
    if (rowIdx < 0) rowIdx = 0;
    rows[rowIdx].push(w);
  }

  return rows.map((row) => row.sort((a, b) => wordCenter(a).x - wordCenter(b).x));
}

/** Parsa testo OCR grezzo cercando coppie posizione → camera */
export function parseSheetText(rawText: string): ParseResult {
  const warnings: string[] = [];
  const assignments: ParsedAssignment[] = [];
  const lines = rawText.split(/\n/).map((l) => l.trim()).filter(Boolean);

  const found = new Map<number, string>();

  for (const line of lines) {
    // Pattern: "116 V  1" o "1 116 V" o "305GR 32"
    const tokens = line.split(/\s+/);

    for (let i = 0; i < tokens.length; i++) {
      const posNum = isPositionNumber(tokens[i]);
      if (posNum !== null) {
        // Cerca codice camera vicino
        const neighbors = [tokens[i - 1], tokens[i - 2], tokens[i + 1], tokens[i + 2]].filter(Boolean);
        for (const n of neighbors) {
          if (isRoomCode(n)) {
            found.set(posNum, normalizeOCRCode(n));
            break;
          }
          // Due token: "116" + "V"
          const combined = `${n} ${tokens[i + 1] || ""}`.trim();
          if (isRoomCode(combined)) {
            found.set(posNum, normalizeOCRCode(combined));
            break;
          }
        }
      }

      if (isRoomCode(tokens[i]) && tokens[i] !== "XX") {
        const code = normalizeOCRCode(tokens[i]);
        // Due-token: "116" "V"
        if (/^\d{2,3}$/.test(tokens[i]) && tokens[i + 1] && /^[A-Z]$/.test(tokens[i + 1])) {
          const combined = normalizeOCRCode(`${tokens[i]} ${tokens[i + 1]}`);
          const nearbyPos = [tokens[i - 1], tokens[i + 2], tokens[i + 3]]
            .map(isPositionNumber)
            .find((p) => p !== null);
          if (nearbyPos) found.set(nearbyPos, combined);
        }
      }

      if (tokens[i] === "XX") {
        const nearbyPos = [tokens[i - 1], tokens[i + 1]].map(isPositionNumber).find((p) => p !== null);
        if (nearbyPos) found.set(nearbyPos, "XX");
      }
    }
  }

  for (const [id, code] of found) {
    assignments.push({ positionId: id, roomCode: code, confidence: "high" });
  }

  if (assignments.length < 20) {
    warnings.push("Poche assegnazioni trovate nel testo. Prova con un'immagine più nitida o usa il mapping spaziale.");
  }

  return { assignments, rawText, warnings };
}

/** Parsa parole OCR con coordinate per mapping spaziale sulla griglia 8 file */
export function parseSheetWords(words: OCRWord[]): ParseResult {
  const warnings: string[] = [];
  const rawText = words.map((w) => w.text).join(" ");

  // Filtra rumore
  const filtered = words.filter((w) => {
    const t = w.text.trim().toUpperCase();
    if (!t || t.length === 0) return false;
    if (NOISE_WORDS.has(t)) return false;
    if (/^\d{1,2}\/\d{2}/.test(t)) return false;
    if (/^20\d{2}$/.test(t)) return false;
    if (/^FILA$/.test(t)) return false;
    if (/^°$/.test(t)) return false;
    return true;
  });

  const positionWords: { id: number; word: OCRWord }[] = [];
  const roomWords: OCRWord[] = [];

  for (let i = 0; i < filtered.length; i++) {
    const t = filtered[i].text.trim();
    const pos = isPositionNumber(t);
    if (pos !== null) {
      positionWords.push({ id: pos, word: filtered[i] });
      continue;
    }
    if (t.toUpperCase() === "XX") {
      roomWords.push({ ...filtered[i], text: "XX" });
      continue;
    }
    if (isRoomCode(t)) {
      roomWords.push(filtered[i]);
      continue;
    }
    // Combina "116" + "V"
    if (/^\d{2,3}$/.test(t) && filtered[i + 1] && /^[A-Za-z]$/.test(filtered[i + 1].text.trim())) {
      roomWords.push({
        text: `${t} ${filtered[i + 1].text.trim()}`,
        bbox: {
          x0: filtered[i].bbox.x0,
          y0: filtered[i].bbox.y0,
          x1: filtered[i + 1].bbox.x1,
          y1: Math.max(filtered[i].bbox.y1, filtered[i + 1].bbox.y1),
        },
      });
      i++;
    }
  }

  const found = new Map<number, { code: string; confidence: "high" | "medium" | "low" }>();

  // Abbina per prossimità spaziale
  for (const { id, word: posWord } of positionWords) {
    const pc = wordCenter(posWord);
    let best: { code: string; dist: number } | null = null;

    for (const rw of roomWords) {
      const rc = wordCenter(rw);
      const dist = Math.hypot(pc.x - rc.x, pc.y - rc.y);
      // La camera è tipicamente a sinistra del numero posizione
      if (rc.x < pc.x + 50 && dist < 200) {
        if (!best || dist < best.dist) {
          best = { code: normalizeOCRCode(rw.text), dist };
        }
      }
    }

    if (best) {
      found.set(id, { code: best.code, confidence: best.dist < 100 ? "high" : "medium" });
    }
  }

  // Fallback: mapping sequenziale per riga
  if (found.size < 30) {
    warnings.push("Mapping spaziale parziale: completamento sequenziale per fila.");
    const rows = clusterIntoRows(roomWords.filter((w) => w.text !== "XX" || true));
    let globalOffset = 0;

    for (let r = 0; r < rows.length && r < ROW_SIZES.length; r++) {
      const rowCodes = rows[r]
        .map((w) => normalizeOCRCode(w.text))
        .filter((c) => c && c !== "XX");

      let codeIdx = 0;
      for (let p = 0; p < ROW_SIZES[r]; p++) {
        const posId = globalOffset + p + 1;
        if (!found.has(posId) && codeIdx < rowCodes.length) {
          // Assegna solo se non già occupato da high confidence
          const code = rowCodes[codeIdx];
          if (code) {
            found.set(posId, { code, confidence: "low" });
            codeIdx++;
          }
        } else if (found.has(posId)) {
          codeIdx++;
        }
      }
      globalOffset += ROW_SIZES[r];
    }
  }

  const assignments: ParsedAssignment[] = [];
  for (const [positionId, { code, confidence }] of found) {
    assignments.push({
      positionId,
      roomCode: code === "XX" ? "XX" : code,
      confidence,
    });
  }

  assignments.sort((a, b) => a.positionId - b.positionId);

  if (assignments.length === 0) {
    warnings.push("Nessuna assegnazione riconosciuta. Verifica che la foto sia il foglio booking standard.");
  }

  return { assignments, rawText, warnings };
}

export function mergeParseResults(...results: ParseResult[]): ParseResult {
  const merged = new Map<number, ParsedAssignment>();
  const warnings: string[] = [];
  let rawText = "";

  const confidenceRank = { high: 3, medium: 2, low: 1 };

  for (const r of results) {
    rawText += r.rawText + "\n";
    warnings.push(...r.warnings);
    for (const a of r.assignments) {
      const existing = merged.get(a.positionId);
      if (!existing || confidenceRank[a.confidence] > confidenceRank[existing.confidence]) {
        merged.set(a.positionId, a);
      }
    }
  }

  return {
    assignments: Array.from(merged.values()).sort((a, b) => a.positionId - b.positionId),
    rawText,
    warnings: [...new Set(warnings)],
  };
}
