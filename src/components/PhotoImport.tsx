"use client";

import { useCallback, useRef, useState } from "react";
import { Camera, Upload, Loader2, CheckCircle, AlertTriangle, Eye, X, Calendar, Plus } from "lucide-react";
import { useBeach } from "@/lib/beach-context";
import { isValidPeriod } from "@/lib/types";
import {
  ParsedAssignment,
  mergeParseResults,
  parsePeriodFromText,
  parseSheetText,
  parseSheetWords,
} from "@/lib/sheet-parser";

type Step = "idle" | "processing" | "preview" | "done";

export function PhotoImport() {
  const { applyBulkAssignments, addPeriod } = useBeach();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("idle");
  const [progress, setProgress] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<ParsedAssignment[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [rawText, setRawText] = useState("");
  const [showRaw, setShowRaw] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);
  const [periodName, setPeriodName] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [applying, setApplying] = useState(false);
  const [creatingEmpty, setCreatingEmpty] = useState(false);

  const periodValid = isValidPeriod({ name: periodName, startDate: periodStart, endDate: periodEnd });

  const resetPeriodFields = () => {
    setPeriodName("");
    setPeriodStart("");
    setPeriodEnd("");
  };

  const processImage = useCallback(async (file: File) => {
    setStep("processing");
    setProgress("Caricamento immagine...");
    setWarnings([]);

    const reader = new FileReader();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    setPreviewUrl(dataUrl);
    setImageData(dataUrl);

    try {
      setProgress("Avvio OCR (può richiedere 30-60 secondi)...");

      const Tesseract = await import("tesseract.js");
      const worker = await Tesseract.createWorker("ita+eng", 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(`OCR in corso... ${Math.round((m.progress ?? 0) * 100)}%`);
          }
        },
      });

      await worker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
      } as Record<string, string>);

      setProgress("Analisi testo in corso...");
      const result = await worker.recognize(dataUrl, {}, { blocks: true });
      await worker.terminate();

      const words: { text: string; bbox: { x0: number; y0: number; x1: number; y1: number } }[] = [];
      for (const block of result.data.blocks ?? []) {
        for (const para of block.paragraphs) {
          for (const line of para.lines) {
            for (const word of line.words) {
              if (word.text.trim()) {
                words.push({ text: word.text, bbox: word.bbox });
              }
            }
          }
        }
      }

      const textResult = parseSheetText(result.data.text);
      const spatialResult = parseSheetWords(words);
      const merged = mergeParseResults(textResult, spatialResult);

      // Auto-compila periodo dal titolo del foglio se riconosciuto
      const detectedPeriod = parsePeriodFromText(result.data.text);
      if (detectedPeriod) {
        setPeriodName(detectedPeriod.name);
        setPeriodStart(detectedPeriod.startDate);
        setPeriodEnd(detectedPeriod.endDate);
      }

      setAssignments(merged.assignments);
      setWarnings(merged.warnings);
      setRawText(merged.rawText);
      setStep("preview");
    } catch (err) {
      console.error(err);
      setWarnings(["Errore durante l'OCR. Riprova con una foto più nitida e ben illuminata."]);
      setStep("idle");
    }
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
    e.target.value = "";
  };

  const handleCreateEmpty = async () => {
    if (!periodValid) return;
    setCreatingEmpty(true);
    setWarnings([]);
    try {
      await addPeriod({
        name: periodName.trim(),
        startDate: periodStart,
        endDate: periodEnd,
        isActive: true,
      });
      setAssignments([]);
      setStep("done");
    } catch {
      setWarnings(["Errore nella creazione del periodo. Riprova."]);
    } finally {
      setCreatingEmpty(false);
    }
  };

  const handleApply = async () => {
    if (!periodValid) return;
    setApplying(true);
    try {
      await applyBulkAssignments(
        assignments.map((a) => ({ positionId: a.positionId, roomCode: a.roomCode })),
        {
          period: { name: periodName.trim(), startDate: periodStart, endDate: periodEnd },
          referenceImage: imageData ?? undefined,
        }
      );
      setStep("done");
    } catch {
      setWarnings(["Errore nel salvataggio sul server. Riprova."]);
    } finally {
      setApplying(false);
    }
  };

  const handleReset = () => {
    setStep("idle");
    setAssignments([]);
    setWarnings([]);
    setPreviewUrl(null);
    setImageData(null);
    setRawText("");
    resetPeriodFields();
  };

  const confidenceColor = (c: ParsedAssignment["confidence"]) =>
    c === "high" ? "text-emerald-600" : c === "medium" ? "text-amber-600" : "text-red-500";

  const PeriodFields = (
    <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50/50 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-sky-800">
        <Calendar className="h-4 w-4" />
        Periodo del foglio
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="md:col-span-3">
          <label className="mb-1 block text-xs text-gray-600">Nome periodo</label>
          <input
            value={periodName}
            onChange={(e) => setPeriodName(e.target.value)}
            placeholder="es. Luglio 2026 — 27/06 al 04/07"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-600">Data inizio</label>
          <input
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-600">Data fine</label>
          <input
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>
      </div>
      {!periodValid && (periodName || periodStart || periodEnd) && (
        <p className="mt-2 text-xs text-red-500">Inserisci nome e date valide (fine ≥ inizio)</p>
      )}
      <p className="mt-2 text-xs text-gray-500">
        Il periodo viene salvato sul server e condiviso con il bagnino in spiaggia.
      </p>
    </div>
  );

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Calendar className="h-5 w-5 text-sky-600" />
        <h3 className="font-semibold text-gray-800">Nuovo periodo</h3>
      </div>

      <p className="mb-4 text-sm text-gray-500">
        Crea un periodo vuoto e compila le assegnazioni a mano sulla mappa, oppure carica
        una foto del foglio booking per importarle automaticamente.
      </p>

      {PeriodFields}

      {step === "idle" && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleCreateEmpty}
            disabled={!periodValid || creatingEmpty}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {creatingEmpty ? "Creazione..." : "Crea periodo vuoto"}
          </button>

          <div
            onClick={() => fileRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-sky-300 bg-sky-50/50 px-6 py-8 transition hover:border-sky-500 hover:bg-sky-50"
          >
            <Camera className="mb-2 h-8 w-8 text-sky-400" />
            <Upload className="mb-2 h-6 w-6 text-sky-400" />
            <p className="font-medium text-sky-700">Oppure importa da foto del foglio</p>
            <p className="mt-1 text-xs text-gray-400">JPG, PNG — foto nitida, vista dall&apos;alto</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFile}
            />
          </div>
        </div>
      )}

      {warnings.length > 0 && step === "idle" && (
        <div className="mt-3 space-y-1">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs text-amber-600">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {w}
            </div>
          ))}
        </div>
      )}

      {step === "processing" && (
        <div className="flex flex-col items-center py-10">
          <Loader2 className="mb-4 h-10 w-10 animate-spin text-sky-600" />
          <p className="font-medium text-gray-700">{progress}</p>
          <p className="mt-2 text-xs text-gray-400">Non chiudere la pagina</p>
        </div>
      )}

      {(step === "preview" || step === "done") && (
        <div className="space-y-4">
          {step === "done" && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-emerald-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">
                Periodo &quot;{periodName}&quot; creato
                {assignments.length > 0 ? ` con ${assignments.length} assegnazioni` : " (vuoto, compila dalla mappa)"}
                {" "}— salvato permanentemente.
              </span>
            </div>
          )}

          {step === "preview" && PeriodFields}

          <div className="grid gap-4 md:grid-cols-2">
            {previewUrl && (
              <div className="overflow-hidden rounded-lg border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Foglio caricato" className="max-h-64 w-full object-contain bg-gray-50" />
              </div>
            )}

            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">
                {assignments.length} assegnazioni riconosciute
              </p>

              {warnings.length > 0 && (
                <div className="mb-3 space-y-1">
                  {warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-amber-600">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {w}
                    </div>
                  ))}
                </div>
              )}

              <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-50">
                    <tr>
                      <th className="px-2 py-1.5 text-left font-medium text-gray-500">Pos.</th>
                      <th className="px-2 py-1.5 text-left font-medium text-gray-500">Camera</th>
                      <th className="px-2 py-1.5 text-left font-medium text-gray-500">Affid.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {assignments.map((a) => (
                      <tr key={a.positionId} className="hover:bg-sky-50">
                        <td className="px-2 py-1 font-medium">#{a.positionId}</td>
                        <td className="px-2 py-1">{a.roomCode ?? "—"}</td>
                        <td className={`px-2 py-1 ${confidenceColor(a.confidence)}`}>
                          {a.confidence === "high" ? "●" : a.confidence === "medium" ? "◐" : "○"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {rawText && (
            <div>
              <button
                onClick={() => setShowRaw(!showRaw)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
              >
                <Eye className="h-3.5 w-3.5" />
                {showRaw ? "Nascondi" : "Mostra"} testo OCR grezzo
              </button>
              {showRaw && (
                <pre className="mt-2 max-h-32 overflow-auto rounded bg-gray-50 p-3 text-[10px] text-gray-600">
                  {rawText}
                </pre>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {step === "preview" && (
              <>
                <button
                  onClick={handleApply}
                  disabled={assignments.length === 0 || !periodValid || applying}
                  className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  {applying ? "Salvataggio..." : `Crea periodo e applica ${assignments.length} assegnazioni`}
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  <X className="h-4 w-4" /> Annulla
                </button>
              </>
            )}
            {step === "done" && (
              <button
                onClick={handleReset}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Crea un altro periodo
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
