# Plan — Prescription History with Supabase

## Goal

Store every completed prescription in Supabase and add a **History** page that
lists past prescriptions searchable by **patient name**. PDF generation stays
exactly as-is (client-side, exact-A4).

## Non-goals (this upgrade)

- No multi-doctor / multi-clinic support (single doctor: Dr. Suranjana Roy)
- No online PDF storage (PDFs keep generating on-device; only form data is stored)
- No changes to the A4 export, signature block, or auto-numbered RX

## Decisions

| # | Decision | Choice |
|---|----------|--------|
| 1 | Project | **New** Supabase project (e.g. `dr-prescription`), ap-south-1 (Mumbai, closest to clinic). Existing `StockLine` project stays untouched. |
| 2 | Auth | Supabase **email + password**, one doctor account. Required so RLS can lock rows to the owner. A simple login screen gates the app. |
| 3 | When to save | Explicit **Save** on download: after `pdf.save()` succeeds, upsert the record. Plus a manual **Save** button for records without PDF. One row per save (history is append-only; re-saving creates a new version row). |
| 4 | History UX | Third view-tab **History** (Form | Preview | History on mobile; a nav entry on desktop). Search box filters by patient name; each row shows name, date, age/gender; tap to **reload into the form** (edit → save = new row), **re-download PDF**, or **delete**. |
| 5 | Offline | Form + PDF keep working offline. Save/History show a friendly error when offline (no background sync queue in v1). |

## Database schema

Table `prescriptions` (new project, `public` schema):

```sql
create table public.prescriptions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  created_at    timestamptz not null default now(),
  patient_name  text not null,
  age           text not null,
  gender        text not null,
  visit_date    date not null,
  weight        text,
  height        text,
  admitted_on   date,
  surgery_on    date,
  co            text,
  hopi          text,
  oe            text,
  adv           text,
  wd            text,
  plan          text,
  rx            text
);

create index prescriptions_user_name_idx
  on public.prescriptions (user_id, patient_name);
```

Extension for typo-tolerant name search (optional, turn on if `ilike` feels weak):

```sql
create extension if not exists pg_trgm;
create index prescriptions_name_trgm_idx
  on public.prescriptions using gin (patient_name gin_trgm_ops);
```

Row Level Security (deny-by-default, owner-only):

```sql
alter table public.prescriptions enable row level security;

create policy "owner full access"
  on public.prescriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

## App changes

1. **Deps**: `npm i @supabase/supabase-js`
2. **`src/lib/supabaseClient.js`** (new): `createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)`
3. **Env**: `.env.local` (gitignored) with `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`;
   same two vars added in the Vercel dashboard for deploys
4. **Auth gate** (`src/components/Login.jsx`, new): email/password sign-in via
   `supabase.auth`; session persisted by the client; "Sign out" in the header
5. **Save flow** (`App.jsx`): after `pdf.save(fileName)` → `insert()` the form
   mapped to columns (`date`→`visit_date`, `doa`→`admitted_on`, `dos`→`surgery_on`);
   toast/success state; failures surface an alert, PDF still saved
6. **History page** (`src/components/History.jsx`, new):
   - `select()` ordered `created_at desc`, search input → `.ilike('patient_name', '%q%')`
   - Row actions: **Open** (loads record back into form state), **PDF** (open + trigger download), **Delete** (confirm → `delete().eq('id', …)`)
   - Empty/loading/error states; pagination or cap (e.g. latest 200, search narrows)
7. **Nav**: extend the mobile `view` toggle to Form | Preview | **History**; desktop shows History as a third panel/route section
8. **Route guard**: History + Save require session; form stays editable offline

## File map (after)

```
src/
  lib/supabaseClient.js      # NEW
  components/
    Login.jsx                # NEW
    History.jsx              # NEW
    PrescriptionForm.jsx     # + Save button hookup (via App)
    PrescriptionPreview.jsx  # unchanged
  App.jsx                    # auth gate, view tabs, save-on-download
```

## Rollout steps

1. Create Supabase project `dr-prescription` (ap-south-1), copy URL + anon key
2. SQL editor → run schema + RLS above; create doctor user (Auth → Add user)
3. Local `.env.local`, `npm i @supabase/supabase-js`, implement 2–8
4. Test: login → fill → download (row appears) → History search by name →
   open → edit → save (new row) → delete
5. Vercel dashboard → add the two env vars → redeploy
6. `git push` (note: `.env.local` never committed — `.gitignore` already covers `.env*`)

## QA / acceptance

- [ ] History lists newest-first; search by partial patient name works
- [ ] Reloading a record reproduces the exact PDF (incl. DOA/DOS, My Plan, RX numbering)
- [ ] RLS: logged-out requests return nothing (verify in a second browser/incognito)
- [ ] Offline: form + PDF work; Save shows a clear error, no crash
- [ ] No anon key or URL committed to git; Vercel env vars set
- [ ] StockLine project untouched

## Rough effort

Small: ~1–2 sessions. Schema + auth gate (~30%), History UI (~40%),
save-flow wiring + QA (~30%).
