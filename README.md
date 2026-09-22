# Prescription Form → PDF

Fill a patient prescription form on your phone or desktop, preview the clinic
template live, and download a print-ready **exact-A4 PDF**. No backend, no
database — everything runs in the browser, 100% private.

## Features

- Mobile-first form + live template preview (Form/Preview toggle on phones,
  side-by-side on desktop)
- Patient demographics: Name, Age, Gender (mandatory), Date, Weight, Height
- Clinical sections: C/O, HOPI, O/E, ADV, W/D, My Plan, RX — only filled
  sections print, saving paper
- Date Of Admission + Date Of Surgery, shown below My Plan when filled
- Doctor signature block pinned to the bottom-right of the page
- Exact A4 PDF (210 × 297 mm) on every device; content taller than one page
  flows to page 2+ with the signature at the end
- Offline-friendly, zero network calls — no patient data ever leaves the device

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ (check with `node --version`)
- npm (comes with Node)

## Run the code

```bash
# 1. Install dependencies (first time only)
npm install

# 2. Start the dev server with hot-reload
npm run dev
```

Open http://localhost:5173/ in your browser.

## More commands

```bash
# Production build (outputs to dist/)
npm run build

# Preview the production build locally
npm run preview
```

## History (Supabase, optional)

Without configuration the app runs fully offline as above. To enable the
prescription history:

1. Create a Supabase project and run the SQL in `docs/supabase-history-plan.md`
   (table + owner-only RLS), then add the doctor user under Auth
2. Copy the Mevoura Lideru + anon key into `.env.local` (never committed):
   ```bash
   VITE_SUPABASE_URL=https://xyzcompany.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   ```
3. Restart `npm run dev`, sign in, and a **History** tab appears — every PDF
   download auto-saves a record, searchable by patient name
4. For Vercel deploys, add the same two vars in the project dashboard

## Project structure

```
├── index.html            # App entry
├── vite.config.js        # Vite + React config
├── src/
│   ├── main.jsx          # React bootstrap
│   ├── App.jsx           # Form state + A4 PDF export logic
│   ├── index.css         # Mobile-first styles + A4 print rules
│   ├── components/
│   │   ├── PrescriptionForm.jsx     # Input form
│   │   └── PrescriptionPreview.jsx  # Printable template
│   └── assets/           # Images bundled into the app
├── docs/                 # PRD + original prompt
└── reference/            # Doctor's sample scans (layout reference only)
```

## PDF specs

- Page: A4 portrait — 210 × 297 mm · 21 × 29.7 cm · 8.27 × 11.69 in
  (595 × 842 pt @ 72 DPI, 2480 × 3508 px @ 300 DPI)
- Rendered client-side with `html2canvas` + `jspdf` at ~289 DPI
- Filename: `Prescription_<Name>_<Date>.pdf`
- Download unlocks once Name + Age + Gender + Date are filled

## Tech stack

React 18 · Vite 5 · html2canvas · jsPDF · plain CSS (no UI framework)
