import { AppState, BookingPeriod, UmbrellaPosition, ViciniGroup, codeToPosition } from "./types";

const DEFAULT_PERIOD: BookingPeriod = {
  id: "luglio-2026-w1",
  name: "Luglio 2026 — 27/06 al 04/07",
  startDate: "2026-06-27",
  endDate: "2026-07-04",
  isActive: true,
};

// Dati dal foglio "BOOKING SPIAGGIA LUGLIO 2026 DAL 27/06 AL 04/07"
const ROW_DATA: Record<number, (string | null)[]> = {
  1: ["116 V", "117 V", "104 B", "XX", "217 C", "133 E", null, null, null, null, null, null, null, null, null],
  2: ["123 D", "124 D", "235 F", "236 F", "226 D", "109 B", "122 D", "243 G", "108 B", "134 F", "202 A", "309GR", "204 B", null, null],
  3: ["230 E", "305GR", "241 G", "240 G", "301GR", "105 B", "306GR", "239 G", "126 D", "129 E", "244 G", "145 G", "118GR", "205 B", "207 B"],
  4: ["228 E", "234 F", "123 D", "312GR", "210 C", "107 B", "321GR", "335GR", "139 G", "308GR", "209 B", "127 D", "142 G", "334GR", "135 F"],
  5: ["138 G", "102 A", "103 A", "212 C", "137 G", "302GR", "213 C", "119GR", "131 E", "144 G", "143 G", "215 C", "132 E", "314GR", "336GR"],
  6: ["237 G", "106 B", "110 C", "238 G", "141 G", "140 G", "101 A", "242 G", "130 E", "231 E", "216 C", "128 E"],
  7: ["208 B", "112 C", "111 C", "221 D", "220 D", "115 C", "337GR", "201 A", "303GR", "313GR"],
  8: ["229 E", "113 C", "304GR", "214 C", "206 B", "232 E", "120 D", "233 E", "203 A", null],
};

function buildPositions(): UmbrellaPosition[] {
  const positions: UmbrellaPosition[] = [];
  let globalId = 1;

  for (let row = 1; row <= 8; row++) {
    const codes = ROW_DATA[row];
    codes.forEach((code, idx) => {
      const base = codeToPosition(code);
      positions.push({
        id: globalId,
        row,
        positionInRow: idx + 1,
        code: base.code ?? null,
        status: base.status ?? "available",
        room: base.room,
        block: base.block,
        isGrande: base.isGrande,
        startDate: code && code !== "XX" ? DEFAULT_PERIOD.startDate : undefined,
        endDate: code && code !== "XX" ? DEFAULT_PERIOD.endDate : undefined,
      });
      globalId++;
    });
  }

  return positions;
}

// Gruppi VICINI ricostruiti dal foglio (coppie/gruppi adiacenti)
const VICINI_GROUPS: ViciniGroup[] = [
  { id: "v1", positionIds: [1, 2], label: "116-117" },
  { id: "v2", positionIds: [16, 17], label: "123-124" },
  { id: "v3", positionIds: [18, 19], label: "235-236" },
  { id: "v4", positionIds: [31, 32], label: "230-305GR" },
  { id: "v5", positionIds: [33, 34], label: "241-240" },
  { id: "v6", positionIds: [35, 36], label: "301GR-105" },
  { id: "v7", positionIds: [46, 47], label: "228-234" },
  { id: "v8", positionIds: [61, 62, 63], label: "138-102-103" },
  { id: "v9", positionIds: [76, 77], label: "237-106" },
  { id: "v10", positionIds: [88, 89, 90], label: "208-112-111" },
  { id: "v11", positionIds: [91, 92], label: "221-220" },
];

export function getInitialState(): AppState {
  return {
    positions: buildPositions(),
    viciniGroups: VICINI_GROUPS,
    periods: [DEFAULT_PERIOD],
    lastUpdated: new Date().toISOString(),
  };
}

export const ROW_LABELS: Record<number, string> = {
  1: "1° FILA",
  2: "2° FILA",
  3: "3° FILA",
  4: "4° FILA",
  5: "5° FILA",
  6: "6° FILA",
  7: "7° FILA",
  8: "8° FILA",
};

export const TOTAL_POSITIONS = 107;
