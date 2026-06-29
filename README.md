# 🏖️ Green Park Beach - Umbrella Management System

Una web app moderna per la gestione intelligente dell'assegnazione degli ombrelloni alle camere di una struttura alberghiera.

## 📋 Descrizione

**Green Park Beach** è una soluzione completa per semplificare e automatizzare il processo di assegnazione degli ombrelloni ai clienti di hotel e resort. Permette al personale di gestire l'inventario, tracciare le assegnazioni e ottimizzare l'utilizzo delle risorse.

## ✨ Funzionalità Principali

- 🎯 **Assegnazione Ombrelloni** - Assegna ombrelloni alle camere in modo rapido e intuitivo
- 📊 **Dashboard** - Visualizza lo stato in tempo reale delle assegnazioni
- 👥 **Gestione Ospiti** - Traccia quali ospiti hanno ombrelloni assegnati
- 📅 **Calendario** - Gestisci disponibilità e periodi di occupazione
- 🔗 **Gruppi Vicini** - Collega ombrelloni per ospiti che vogliono stare vicini
- 🔍 **Ricerca** - Cerca per posizione, camera, blocco o nome ospite
- 📤 **Export/Import** - Condividi i dati tra dispositivi via JSON
- 🔐 **Autenticazione** - Accesso sicuro per il personale autorizzato (PIN)

## 🚀 Quick Start

### Prerequisiti

- Node.js (v18+)
- npm

### Installazione

```bash
git clone https://github.com/polimar/greenparkbeach.git
cd greenparkbeach
npm install
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) — PIN di accesso: `greenpark`

## 📁 Struttura del Progetto

```
greenparkbeach/
├── src/
│   ├── app/           # Next.js App Router
│   ├── components/    # Componenti React UI
│   └── lib/           # Tipi, contesto, dati seed
├── public/
├── package.json
└── README.md
```

## 🛠️ Stack Tecnologico

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Icone**: Lucide React
- **Persistenza**: localStorage (browser) + export/import JSON
- **Deployment**: Vercel

## 🗺️ Layout Spiaggia

La mappa replica il foglio cartaceo con **8 file** (1°–8° FILA) e **107 posizioni** totali. Ogni ombrellone può essere:

| Stato | Descrizione |
|-------|-------------|
| Libero | Posizione disponibile |
| Assegnato | Camera + blocco (es. `116 V`, `305GR`) |
| Bloccato | Marcato come `XX` |

I dati iniziali corrispondono al periodo **27/06 – 04/07/2026**.

## 📄 Licenza

Vedi [LICENSE.md](LICENSE.md)

---

**Green Park Beach** - Gestisci gli ombrelloni, offri il meglio ai tuoi ospiti 🌊
