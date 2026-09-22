# TODO — Prescription Form-to-PDF Generator

## Setup
- [ ] Scaffold React app (Vite)
- [ ] Pick and install PDF generation library (e.g. html2canvas + jsPDF, or react-to-pdf)
- [ ] Set up base CSS / mobile-first layout shell

## Form
- [ ] Build form component with all 12 fields, correct input types and order
- [ ] Add required-field validation (Patient's Name, Date)
- [ ] Set numeric keyboard (`inputmode="numeric"`) for Age, Weight, Height
- [ ] Default Date field to today

## Template / Preview
- [ ] Design fixed prescription template layout (header, patient info row, C/O–RX sections)
- [ ] Wire form state to live preview (re-render on every change)
- [ ] Build Form/Preview toggle for mobile; side-by-side layout for wider screens

## PDF Export
- [ ] Implement "Download PDF" action rendering the preview to PDF (A4)
- [ ] Auto-generate filename: `Prescription_<Name>_<Date>.pdf`, spaces stripped
- [ ] Disable download until Name + Date are filled

## Reset
- [ ] Implement "Clear Form" / "New Patient" action

## QA / Acceptance
- [ ] Test at 360px viewport width — no horizontal scroll
- [ ] Confirm PDF visually matches on-screen preview
- [ ] Confirm zero network calls (devtools check)
- [ ] Confirm no backend/db/auth code anywhere
- [ ] Test on an actual mobile device, not just devtools emulation

## Open decisions (from PRD, resolve if they matter to you)
- [ ] Confirm A4 vs Letter page size
- [ ] Confirm fixed kg/cm units are fine, or add toggle
- [ ] Decide if a clinic name/logo header is needed later
