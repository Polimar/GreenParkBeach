# Green Park Beach — Umbrella Management System

Web app per la gestione degli ombrelloni con **database server-side** (Vercel Postgres).

## Accesso

| Ruolo | PIN | Permessi |
|-------|-----|----------|
| **Amministrativa** | `greenpark` | Inserisce dati, import foto, crea periodi |
| **Bagnino** | `bagnino` | Consulta mappa e cerca camere in spiaggia |

## Setup Database (Vercel)

1. Vai su [Vercel Dashboard](https://vercel.com) → progetto `greenpark-beach`
2. **Storage** → **Create Database** → **Postgres**
3. Collega al progetto (variabili `POSTGRES_URL` vengono aggiunte automaticamente)
4. Rideploya l'app
5. Chiama `POST /api/init` per inizializzare i dati seed (o avviene automaticamente al primo accesso)

## Sviluppo locale

```bash
npm install
# Imposta POSTGRES_URL nel file .env.local
npm run dev
```

## Architettura

- **Frontend**: Next.js 15, mobile-first con bottom navigation
- **API**: `/api/state`, `/api/periods`, `/api/periods/import`
- **Database**: Vercel Postgres (periodi + assegnazioni)
- **Sync**: aggiornamento automatico ogni 20 secondi

## Deploy

https://greenpark-beach-valerios-projects-07f3aa00.vercel.app

## PWA (installazione su telefono)

L'app è installabile come PWA da Chrome (Android) e Safari (iOS):

- **Android**: menu Chrome → "Aggiungi a schermata Home"
- **iOS**: Safari → Condividi → "Aggiungi a Home"

Icone generate dal logo Green Park Village (`logo-gpv1~2_x16.png`). Per rigenerarle:

```bash
npm run generate-icons
```
