"use client";

import { useState, useEffect } from "react";
import { X, Save, Trash2, Ban, Users } from "lucide-react";
import { UmbrellaPosition } from "@/lib/types";
import { useBeach } from "@/lib/beach-context";

interface AssignmentModalProps {
  position: UmbrellaPosition | null;
  onClose: () => void;
}

export function AssignmentModal({ position, onClose }: AssignmentModalProps) {
  const { assignUmbrella, clearUmbrella, blockUmbrella, activePeriod, getViciniForPosition, state } = useBeach();
  const [room, setRoom] = useState("");
  const [block, setBlock] = useState("");
  const [isGrande, setIsGrande] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (position) {
      setRoom(position.room ?? "");
      setBlock(position.block ?? "");
      setIsGrande(position.isGrande ?? false);
      setGuestName(position.guestName ?? "");
      setStartDate(position.startDate ?? activePeriod?.startDate ?? "");
      setEndDate(position.endDate ?? activePeriod?.endDate ?? "");
      setNotes(position.notes ?? "");
    }
  }, [position, activePeriod]);

  if (!position) return null;

  const vicini = getViciniForPosition(position.id);

  const handleSave = () => {
    if (!room.trim()) return;
    assignUmbrella(position.id, {
      room: room.trim(),
      block: isGrande ? undefined : block.trim() || undefined,
      isGrande,
      guestName: guestName.trim() || undefined,
      startDate,
      endDate,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  const handleClear = () => {
    clearUmbrella(position.id);
    onClose();
  };

  const handleBlock = () => {
    blockUmbrella(position.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md animate-fade-in rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Posizione #{position.id}
            </h2>
            <p className="text-sm text-gray-500">{position.row}° Fila — posto {position.positionInRow}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {vicini && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-purple-50 px-3 py-2 text-sm text-purple-700">
            <Users className="h-4 w-4" />
            <span>
              Gruppo Vicini: posizioni {vicini.positionIds.join(", ")}
              {vicini.label && ` (${vicini.label})`}
            </span>
          </div>
        )}

        {position.status === "blocked" ? (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-center text-red-700">
            <Ban className="mx-auto mb-2 h-8 w-8" />
            <p className="font-medium">Posizione bloccata (XX)</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">N° Camera</label>
                <input
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="es. 116"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Blocco</label>
                <input
                  value={block}
                  onChange={(e) => setBlock(e.target.value.toUpperCase())}
                  disabled={isGrande}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:bg-gray-100"
                  placeholder="es. V, B, A"
                  maxLength={2}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isGrande}
                onChange={(e) => setIsGrande(e.target.checked)}
                className="rounded border-gray-300"
              />
              Ombrellone Grande (GR)
            </label>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Nome Ospite (opzionale)</label>
              <input
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="Cognome ospite"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Dal</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Al</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Note</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="Note aggiuntive..."
              />
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          {position.status !== "blocked" && (
            <button
              onClick={handleSave}
              disabled={!room.trim()}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-sky-600 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> Salva
            </button>
          )}
          {position.status === "assigned" && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              <Trash2 className="h-4 w-4" /> Libera
            </button>
          )}
          {position.status !== "blocked" ? (
            <button
              onClick={handleBlock}
              className="flex items-center gap-1 rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Ban className="h-4 w-4" /> Blocca
            </button>
          ) : (
            <button
              onClick={handleClear}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Sblocca
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
