"use client";

import { useState } from "react";
import { Lock, Umbrella, Shield, Waves, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function LoginScreen() {
  const { login } = useAuth();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const ok = await login(pin);
    if (!ok) {
      setError(true);
      setPin("");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center p-4 safe-bottom">
      <div className="w-full max-w-md animate-fade-in rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sky-100">
            <Umbrella className="h-8 w-8 text-sky-600" />
          </div>
          <h1 className="text-2xl font-bold text-sky-900">Green Park Beach</h1>
          <p className="mt-1 text-sm text-gray-500">Gestione Ombrelloni</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="pin" className="mb-1 block text-sm font-medium text-gray-700">
              PIN di accesso
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="pin"
                type="password"
                inputMode="text"
                autoComplete="current-password"
                value={pin}
                onChange={(e) => { setPin(e.target.value); setError(false); }}
                placeholder="Inserisci il PIN"
                className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 text-base focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                autoFocus
                disabled={loading}
              />
            </div>
            {error && (
              <p className="mt-1 text-sm text-red-500">PIN non valido. Usa greenpark o bagnino.</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !pin.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-3 text-base font-medium text-white transition active:scale-[0.98] hover:bg-sky-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            {loading ? "Accesso..." : "Accedi"}
          </button>
        </form>

        <div className="mt-6 space-y-2 rounded-xl bg-gray-50 p-4 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 shrink-0 text-sky-600" />
            <span><strong>Amministrativa:</strong> <code className="rounded bg-white px-1">greenpark</code></span>
          </div>
          <div className="flex items-center gap-2">
            <Waves className="h-4 w-4 shrink-0 text-emerald-600" />
            <span><strong>Bagnino:</strong> <code className="rounded bg-white px-1">bagnino</code> — modifica camere su tutti i periodi</span>
          </div>
        </div>
      </div>
    </div>
  );
}
