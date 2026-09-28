# AG Expenses

A mobile/tablet PWA for House of Holland Tattoo Emporium: snap a photo of a slip or
invoice, the app reads the vendor, date and amount off it automatically, and it's
added to the current month's credit card expense report for review and approval —
matching the paper "Credit Card Expense Report" and "Missing Receipt Affidavit"
workflow.

## Stack

- Vite + React + TypeScript
- Tailwind CSS v4 (dark, mobile-first UI)
- Tesseract.js — on-device OCR, no server, no API key, no per-scan cost
- Three.js — ambient scan effect on the processing screen
- GSAP — list/transition animations
- IndexedDB (via `idb`) — all data stays on the device, no account needed
- jsPDF — exports a report or affidavit as a print-ready PDF
- vite-plugin-pwa — installable to the home screen, works offline

## Running it

```bash
npm install
npm run dev
```

Open the printed URL on a phone/tablet (or use the browser's device toolbar).
`npm run build` produces a static `dist/` folder — host it anywhere that serves
static files over HTTPS (required for camera access and PWA install).

> This project folder lives on a mapped network drive, so `vite.config.ts` sets
> `server.watch.usePolling = true` — Windows' native file-watch API doesn't work
> reliably over network paths and otherwise crashes the dev server.

## How it works

1. **Home** — current month's total, recent scans, a big scan button.
2. **Scan Receipt** — take a photo or pick one from the library. Tesseract.js runs
   OCR on-device, and `src/lib/parseReceipt.ts` applies heuristics (keyword-scored
   totals, date-format detection, first-plausible-line vendor guess) to pre-fill
   date/amount/vendor. Nothing is ever sent off the device.
3. **Review** — the extracted fields are editable before saving; low-confidence
   scans show the raw OCR text for a sanity check.
4. **No receipt?** — "enter manually" skips straight to a digital **Missing Receipt
   Affidavit** (matches the paper form, including the two signatures), so nothing
   falls through the cracks.
5. **Report** — the full monthly table (numbered, vendor, purpose, amount,
   attached/sent), a running total, on-screen signature pads for Requester and
   Authorized Approver, and **Export PDF / Export CSV** to send it on.
6. **History** — every past month's report, one tap away.
7. **Settings** — business name, staff name, supervisor, who to submit to, default
   card user, currency symbol.

## Data & privacy

Everything (expense entries, receipt photos, affidavits, signatures) is stored
locally in the browser's IndexedDB — nothing leaves the device, no account, no
recurring cost. Export PDF/CSV any time to hand a report off.

## Going to the cloud later

All storage goes through the `Repository` interface in `src/lib/repository.ts`.
`src/lib/indexedDbRepository.ts` is the only implementation today. If you later
want reports synced across devices, a `SupabaseRepository` implementing the same
interface (backed by a `reports` / `items` / `affidavits` table + a `receipts`
storage bucket) can be dropped in at `src/lib/db.ts` without changing any page or
component — the UI never talks to storage directly.

## Notes on the OCR

This uses free, on-device OCR (Tesseract.js) rather than a paid vision API, so
accuracy on crumpled or handwritten receipts will sometimes need a manual fix in
the Review step — the app is built around that (every field stays editable, and a
confidence score is shown). If receipt volume grows and better first-pass accuracy
becomes worth a small per-scan cost, swapping in an AI vision model behind a small
backend function is a contained change limited to `src/lib/ocr.ts`.
