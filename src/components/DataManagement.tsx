"use client";

import { useBeach } from "@/lib/beach-context";
import { Download, Upload, RotateCcw } from "lucide-react";
import { useRef } from "react";

export function DataManagement() {
  const { exportData, importData, resetToSeed } = useBeach();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const blob = new Blob([exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `greenpark-beach-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (importData(text)) {
        alert("Dati importati con successo!");
      } else {
        alert("Errore nell'importazione. Verifica il file JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleReset = () => {
    if (confirm("Ripristinare i dati iniziali dal foglio Luglio 2026? Tutte le modifiche andranno perse.")) {
      resetToSeed();
    }
  };

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <h3 className="mb-3 font-semibold text-gray-800">Gestione Dati</h3>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          <Download className="h-4 w-4" /> Esporta JSON
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          <Upload className="h-4 w-4" /> Importa JSON
        </button>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
        >
          <RotateCcw className="h-4 w-4" /> Ripristina dati iniziali
        </button>
        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
      </div>
    </div>
  );
}
