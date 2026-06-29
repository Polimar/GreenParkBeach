"use client";

import { useCallback, useRef, useState } from "react";
import { Camera, Upload, Loader2, CheckCircle, AlertTriangle, Eye, X } from "lucide-react";
import { useBeach } from "@/lib/beach-context";
import { ParsedAssignment, mergeParseResults, parseSheetText, parseSheetWords } from "@/lib/sheet-parser";

type Step = "idle" | "processing" | "preview" | "done";

export function PhotoImport() {
  const { applyBulkAssignments, activePeriod } = useBeach();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("idle");
  const [progress, setProgress] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<ParsedAssignment[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [rawText, setRawText] = useState("");
  const [showRaw, setShowRaw] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);

  const processImage = useCallback(async (file: File) => {
    setStep("processing");
    setProgress("Caricamento immagine...");

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

  const handleApply = () => {
    applyBulkAssignments(
      assignments.map((a) => ({
        positionId: a.positionId,
        roomCode: a.roomCode,
      })),
      imageData ?? undefined
    );
    setStep("done");
  };

  const handleReset = () => {
    setStep("idle");
    setAssignments([]);
    setWarnings([]);
    setPreviewUrl(null);
    setImageData(null);
    setRawText("");
  };

  const confidenceColor = (c: ParsedAssignment["confidence"]) =>
    c === "high" ? "text-emerald-600" : c === "medium" ? "text-amber-600" : "text-red-500";

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Camera className="h-5 w-5 text-sky-600" />
        <h3 className="font-semibold text-gray-800">Importa da Foto Foglio</h3>
      </div>

      <p className="mb-4 text-sm text-gray-500">
        Carica la foto del foglio booking (come quello cartaceo) per importare automaticamente
        le assegnazioni camera → ombrellone. Il nome camera include numero e suffisso
        (es. <code className="rounded bg-gray-100 px-1">127D</code>,{" "}
        <code className="rounded bg-gray-100 px-1">351GR</code>).
      </p>

      {step === "idle" && (
        <div
          onClick={() => fileRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-sky-300 bg-sky-50/50 px-6 py-10 transition hover:border-sky-500 hover:bg-sky-50"
        >
          <Upload className="mb-3 h-10 w-10 text-sky-400" />
          <p className="font-medium text-sky-700">Clicca o trascina la foto del foglio</p>
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
                {assignments.length} assegnazioni importate con successo!
              </span>
            </div>
          )}

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
                {activePeriod && (
                  <span className="ml-2 text-gray-400">
                    (periodo: {activePeriod.name})
                  </span>
                )}
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
                  disabled={assignments.length === 0}
                  className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  Applica {assignments.length} assegnazioni
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
                Carica un&apos;altra foto
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
