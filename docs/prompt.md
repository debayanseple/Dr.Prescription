# Build Prompt — Prescription Form-to-PDF Generator

## Context

Build a single-page React web app that lets a clinician fill a patient case form, see it live-rendered into a fixed prescription template, and download that template as a PDF. No backend, no database, no auth — everything runs client-side in the browser. Optimize the entire UI for mobile screens first (most usage will be on a phone).

Full requirements are in `prd-prescription-form.md` in this repo/folder — read it before starting. This prompt is the actionable build spec; the PRD is the reference for intent and scope.

## Tech stack (keep minimal)

- React (Vite + React, plain JS or TS, your choice) — no additional UI framework, no CSS framework required (plain CSS or CSS modules is fine).
- One client-side PDF generation approach — pick a single library (e.g. `html2canvas` + `jsPDF`, or `react-to-pdf`) and use it consistently. Do not add a second PDF/rendering library.
- No backend, no database, no server calls of any kind. No auth.
- No routing library needed — this is a single screen.

## Fields (exact list and order)

1. Patient's Name — text, required
2. Age — number
3. Gender — select (Male / Female / Other)
4. Date — date picker, defaults to today, required
5. Weight — number, fixed unit label "kg"
6. Height — number, fixed unit label "cm"
7. C/O (Chief Complaint) — multi-line text
8. HOPI (History of Present Illness) — multi-line text
9. O/E (On Examination) — multi-line text
10. ADV (Advice) — multi-line text
11. W/D (Working Diagnosis) — multi-line text
12. RX (Prescription) — multi-line text

Only Patient's Name and Date are required to enable PDF download. Every other field is optional.

## Layout / UX

- Single page, split into two states on mobile: a **Form view** and a **Preview view**, switchable with a tab or toggle at the top (since form + full-page preview won't both fit comfortably on a small screen at once). On wider/desktop screens, show form and preview side-by-side.
- Form view: all 12 fields in the order above, full-width inputs, minimum 44px touch targets, numeric keyboard for Age/Weight/Height on mobile (`inputmode="numeric"`).
- Preview view: renders the current form data into a clean, simple prescription template — clinic-style header (placeholder text like "Prescription" is fine, no logo needed for v1), patient info row (Name / Age / Gender / Date / Weight / Height), then the C/O, HOPI, O/E, ADV, W/D, RX sections stacked in that order, each clearly labeled. Keep the template design simple and legible — this is v1, not a branded document.
- Preview updates live as the user types — no manual "generate" step.
- A "Download PDF" button (visible from the Preview view, or persistent in the header) exports the exact preview layout as a PDF sized A4.
- Filename pattern: `Prescription_<PatientName>_<YYYY-MM-DD>.pdf`, spaces in the name stripped.
- A "Clear Form" / "New Patient" button resets all fields.

## Defaults chosen for you (documented assumptions — flag if you'd choose differently)

- PDF page size: A4.
- Weight/Height units: fixed kg/cm, not user-toggleable, in v1.
- No clinic name/logo/header customization in v1 — static placeholder header text is fine.
- Gender is a fixed 3-option select, not free text.

## Acceptance criteria

- [ ] All 12 fields present, in the specified order, with correct input types.
- [ ] Preview re-renders on every change with no visible lag.
- [ ] Download PDF is disabled until Name + Date are filled.
- [ ] Downloaded PDF visually matches the on-screen preview.
- [ ] Filename follows the `Prescription_<Name>_<Date>.pdf` pattern.
- [ ] Clear/New Patient resets all fields.
- [ ] No layout breakage or horizontal scroll at 360px viewport width.
- [ ] No network calls are made anywhere in the app (verify in devtools network tab).
- [ ] No backend, database, or auth code exists anywhere in the codebase.

## Out of scope (do not build)

- Patient history, storage, or search.
- Multi-user accounts, roles, or login.
- Editable/configurable templates.
- E-prescribing or pharmacy integration.
