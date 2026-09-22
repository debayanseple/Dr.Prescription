# Product Requirements Document — Prescription Form-to-PDF Generator

**Author:** Debayan Chakraborty
**Date:** September 22, 2026
**Status:** Draft
**Platform:** Web app (mobile-optimized)

## 1. Overview

A lightweight, single-page web application that lets a clinician fill out a patient case/prescription form and instantly preview it laid out against a predefined template. Once satisfied, the clinician downloads the filled template as a PDF. The app is built for quick, on-the-go use — most sessions will happen on a phone between patients — so the form and preview are both optimized for small screens.

## 2. Problem Statement

Clinicians who write prescriptions or case notes by hand deal with illegible handwriting, inconsistent formatting, and no digital record. Existing EMR/clinic software is often heavyweight, requires accounts, logins, and server infrastructure — overkill for a solo practitioner or small clinic that just wants a fast, consistent, printable prescription sheet. This app solves that narrow problem: fill a form, see it rendered in the clinic's standard template, download a clean PDF — nothing else.

## 3. Goals (and Non-Goals)

**Goals**
- Let a user fill a structured patient form in under a minute on a mobile screen.
- Render the filled data into a fixed, predefined visual template in real time (live preview).
- Produce a downloadable, print-ready PDF of that rendered template on demand.
- Keep the tech stack minimal — no backend, no database, no auth.

**Non-Goals**
- Not a patient records / EMR system — no storage of past prescriptions, no patient history, no search.
- Not multi-user or multi-clinic — no accounts, roles, or permissions.
- Not editable-template — the layout/template itself is fixed at build time, not user-configurable in v1.
- Not for e-prescribing to pharmacies or any regulatory-grade medical record-keeping.

## 4. Target Users

Individual doctors, physiotherapists, or small clinic staff who currently write prescriptions/case sheets by hand or in Word, and want a faster, cleaner, phone-friendly way to produce the same document digitally — typically used standing at a desk or examination table, glancing between patient and phone/tablet.

## 5. Core Features

### 5.1 Patient Case Form
A single-screen form with the following fields, in order:
- Patient's Name (text)
- Age (number)
- Gender (select: Male / Female / Other)
- Date (date picker, defaults to today)
- Weight (number, with unit label e.g. kg)
- Height (number, with unit label e.g. cm)
- C/O — Chief Complaint (multi-line text)
- HOPI — History of Present Illness (multi-line text)
- O/E — On Examination (multi-line text)
- ADV — Advice (multi-line text)
- W/D — Working Diagnosis (multi-line text)
- RX — Prescription (multi-line text)

All fields are optional except Patient's Name and Date, so a partially-filled sheet can still be previewed/downloaded if needed.

### 5.2 Live Template Preview
As the user types, the form data renders into a fixed, predefined template layout (matching a standard prescription/case-sheet format) shown on the same screen. The preview updates in real time with no separate "generate" step needed to see the layout — it's always current.

### 5.3 PDF Export
A "Download PDF" action converts the current preview into a downloadable PDF file, styled identically to the on-screen preview, sized for standard print (A4 or Letter — see Open Questions). The filename is auto-generated from the patient name and date (e.g. `Prescription_JohnDoe_2026-09-22.pdf`).

### 5.4 Form Reset
A "Clear Form" / "New Patient" action resets all fields for the next patient, since the app holds no history.

## 6. User Stories

- As a clinician, I want to fill in a patient's details and complaint on my phone so that I can quickly produce a clean prescription without handwriting it.
- As a clinician, I want to see the filled template rendered live so that I can catch mistakes before generating the final document.
- As a clinician, I want to download the finished sheet as a PDF so that I can print it or share it with the patient digitally.
- As a clinician, I want to clear the form after each patient so that I can move to the next case without leftover data.

## 7. Functional Requirements

1. The system shall render a form with the twelve specified fields (Patient's Name, Age, Gender, Date, Weight, Height, C/O, HOPI, O/E, ADV, W/D, RX).
2. The system shall update the template preview on every keystroke/change with no perceptible lag (target: under 100ms).
3. The system shall validate that Patient's Name and Date are non-empty before enabling PDF download; all other fields shall be optional.
4. The system shall generate a PDF whose visual layout matches the on-screen preview exactly (same template, same field placement).
5. The system shall name the downloaded PDF using the pattern `Prescription_<PatientName>_<Date>.pdf`, with spaces in the name stripped or replaced.
6. The system shall provide a one-tap action to clear all form fields and return to a blank state.
7. The system shall not transmit form data to any server — all rendering and PDF generation shall happen client-side in the browser.
8. The layout, on both form and preview, shall reflow correctly on screens as narrow as 360px wide with no horizontal scrolling.

## 8. Non-Functional Requirements

- **Tech stack:** React only (e.g. Create React App / Vite), client-side PDF generation library (e.g. `react-to-pdf`, `html2canvas` + `jsPDF`, or similar) — no backend, no database.
- **Performance:** Initial page load under 2 seconds on a typical mobile connection; PDF generation completes within 3 seconds of tapping download.
- **Usability:** All form fields reachable and comfortably tappable on a mobile screen (minimum 44px touch targets); numeric fields open the numeric keyboard on mobile.
- **Reliability:** No data loss on accidental screen rotation or minor navigation; form state persists in-memory for the session.
- **Privacy:** Since no backend exists, no patient data ever leaves the device — this should be stated clearly to the user as a privacy benefit.
- **Offline tolerance:** App shell should load and function without a network connection once cached (stretch goal, not a hard requirement for v1).

## 9. Success Metrics

- Time from opening the app to a downloaded PDF: under 90 seconds for a typical case (informal, self-measured).
- Zero backend errors, since there is no backend — success is measured by PDF generation success rate (target: 100% of well-formed submissions produce a valid PDF).
- Visual fidelity: preview and downloaded PDF match pixel-for-pixel (manual QA check across a few devices).

## 10. Open Questions

- What is the exact predefined template layout (header/logo, clinic name, field positions, fonts) — is there an existing paper template to match, or should Claude design one from scratch?
- Should the PDF be A4 or US Letter sized by default?
- Should Gender be a free-text field instead of a fixed select, to accommodate more options?
- Should Weight/Height units be fixed (kg/cm) or user-toggleable (kg/lb, cm/in)?
- Is a clinic name/doctor name/logo needed as static header content on the template, and if so, is it hardcoded or entered once and remembered for the session?

## 11. Future Considerations (Post-v1)

- Local (browser-only) history of recently generated prescriptions, using localStorage, without any server sync.
- Multiple selectable templates (e.g. general case sheet vs. specialty-specific layout).
- Editable/configurable template builder.
- Direct share-to-WhatsApp or share-sheet integration for the generated PDF on mobile.
