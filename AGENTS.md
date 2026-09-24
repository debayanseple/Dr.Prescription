# AGENTS.md — Prescription Form → PDF

Vite 5 + React 18 (JSX, no TypeScript). Plain CSS, no UI framework. No tests, no linter, no typecheck.

## Commands

- `npm install` — first time only
- `npm run dev` — dev server with hot-reload at `http://localhost:5173/`
- `npm run build` — production build to `dist/`
- `npm run preview` — serve the production build locally
- No test/lint/typecheck scripts exist. Verify with `npm run build`.

## Architecture

Entry: `index.html` → `src/main.jsx` → `src/App.jsx` (all form state + PDF export live here).

- `src/components/PrescriptionForm.jsx` — inputs. RX textarea has custom Enter-to-number behavior (`handleRxKeyDown`: Enter adds next `N. ` item, Shift+Enter plain newline, Enter on empty item ends list; focus seeds `1. `).
- `src/components/PrescriptionPreview.jsx` — `forwardRef` printable sheet. Only filled sections render (`has()` guard); weight/height and DOA/DOS rows are conditional. Template assets (`src/assets/head-neck-graphic.png`, `signature.png`) are bundled via import — keep it that way so offline/PDF capture works.
- `src/components/Login.jsx`, `History.jsx` — Supabase-only; hidden when unconfigured.
- `src/lib/supabaseClient.js` — exports `getSupabase()` (lazy-loads the SDK; `null` when unconfigured) + `isSupabaseConfigured`.

## PDF export (do not "simplify")

`handleDownload` in `src/App.jsx` normalizes rendering before capture so output is identical on every device:

- Resets preview `zoom` to 1, forces sheet to `794px` wide (`210mm @ 96dpi`) with `flex: 0 0 794px` so narrow phones can't shrink it, resets scroll, restores everything in `finally`.
- Pins the signature footer via a measured spacer in normal flow (screen uses `absolute; bottom: 0`, which html2canvas misplaces).
- `html2canvas` at scale 3 (~289 DPI), fallback to scale 2 on OOM; `jsPDF` exact `a4`. Short overflow (≤8mm) shrinks ≤2.6% onto one page; longer notes slice at `.tpl-sec` / signature boundaries, never mid-text.
- Gating: download requires Name + Age + Gender + Date (`canDownload`). Filename: `Prescription_<NameNoSpaces>_<Date>.pdf`.

## Supabase history (optional, off by default)

Without env config the app is fully offline: no login, no History tab, zero network calls. With config it becomes an auth-gated app.

- Env (Vite exposes only `VITE_`-prefixed vars): `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in `.env.local` (gitignored, never commit). Restart `npm run dev` after changing. Mirror both vars in the Vercel dashboard for deploys.
- Schema/RLS source of truth: `docs/supabase-history-plan.md` (`prescriptions` table, owner-only RLS). Column mapping: `date`→`visit_date`, `doa`→`admitted_on`, `dos`→`surgery_on`; empty strings saved as `null`.
- Save flow: `pdf.save()` first, then `insert()`; PDF success is never blocked by a history failure (alert only). Editing a history row updates in place (`editingId`); a vanished row falls back to insert.
- History search: `ilike('patient_name', …)` with `%`/`_` stripped, 300ms debounce, latest 200. Delete is two-tap arm-then-confirm (no `window.confirm` — native dialogs are unreliable on mobile).

## Conventions / gotchas

- Deploy: `vercel.json` (`framework: vite`, `outputDirectory: dist`). No CI workflows.
- Privacy: patient data stays in-browser in offline mode. Don't add telemetry, external fonts, CDNs, or network calls to the form/preview path; History saves are the only sanctioned server traffic.
- Template contains the real doctor identity (name, registration, phone, signature image). Treat as sensitive; don't swap in placeholders.
