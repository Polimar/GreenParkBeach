"use client";

import { useState } from "react";
import { Lock, Umbrella } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function LoginScreen() {
  const { login } = useAuth();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!login(pin)) {
      setError(true);
      setPin("");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sky-100">
            <Umbrella className="h-8 w-8 text-sky-600" />
          </div>
          <h1 className="text-2xl font-bold text-sky-900">Green Park Beach</h1>
          <p className="mt-1 text-sm text-gray-500">Gestione Ombrelloni — Accesso Staff</p>
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
                value={pin}
                onChange={(e) => { setPin(e.target.value); setError(false); }}
                placeholder="Inserisci il PIN"
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                autoFocus
              />
            </div>
            {error && (
              <p className="mt-1 text-sm text-red-500">PIN non valido. Riprova.</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-sky-600 py-2.5 font-medium text-white transition hover:bg-sky-700"
          >
            Accedi
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          Green Park Beach — Umbrella Management System
        </p>
      </div>
    </div>
  );
}
