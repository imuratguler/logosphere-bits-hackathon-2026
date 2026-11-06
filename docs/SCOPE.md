# Logosphere BITS — Scope Document

- Document version: 1.0 (final)
- Date: 2026-11-06 (first draft 2026-10-28)
- Status: Final
- Principle: this document defines **what is built**, not **how**
  (stack, file layout, code). No code was written at this stage.
- Shipped-vs-deferred: everything below shipped except the two
  points marked DEFERRED in §6 (set completeness tracking, full
  version's demo profiles).

## 1. Purpose

Logosphere BITS is an Android app managing publication
collections. The user manages their library, nested collections,
sets and publication inventory in one place; recognizes
publications via camera/gallery visuals; attaches a voice note to
visuals; and runs Muse-assisted diagnosis, automatic pricing and
sale status tracking.

## 2. Terms

- **Publication:** a single item entering the inventory (e.g. book,
  periodical, comic — shipped with the 20-type reference list, D19/P1).
- **Collection:** groups publications; may be **nested** (tree).
- **Set:** a publication group meaningful together (e.g. series,
  boxed set); member list is visible.
- **Inventory record:** a publication's ownership/quantity/status data.
- **Visual:** a camera or gallery photo of a publication.
- **Voice note:** an audio recording attached to a visual; **at most
  one** voice note per visual.
- **Demo profile:** one of 10 ready profiles, selected without
  opening an account.
- **Shared data:** the same dataset every demo profile sees.

## 3. Functional Scope (all shipped)

### F1 — Library management

- The user adds, views, edits, deletes (or archives) publications.
- Each publication can link to collections and sets.

### F2 — Nested collections

- Collections form a tree (collection inside collection).
- The user creates, moves, renames, deletes collections.
- Shipped rules: a collection with content cannot be deleted
  (childless-only delete, rejected while referenced); moves are
  supported; deletes run as atomic server RPCs with media cleanup.

### F3 — Set management

- The user defines sets; adds/removes publications to/from a set.
- Set member lists ship with hierarchical numbering
  (e.g. `2.1.`); expected-parts completeness tracking did not
  ship (no expected-count field) — DEFERRED, see §6.5.

### F4 — Publication inventory

- Inventory fields (quantity, ownership, physical location/shelf)
  are kept as implemented in the product, bibliography, price
  and sale tables.

### F5 — Visual publication recognition

- The user shoots with the camera or picks from the gallery; the
  app attempts to recognize the publication.
- The result is presented for user approval; a wrong match can be
  corrected.
- An unrecognized visual can still join the record (manual match).

### F6 — One voice note per visual

- At most **one** voice note can attach to each visual.
- The user listens, re-records (overwrites) or deletes the note.
- Rule: a second note cannot join before the current note is
  deleted/overwritten.

### F7 — Muse diagnosis

- Shipped: voice-first chain — transcribe audio first, pre-read
  each photo (no guessed ISBNs), run the deterministic source
  waterfall, then final diagnosis with confidence and short
  rationale plus Dewey verification and duplicate review.

### F8 — Automatic pricing

- The app suggests an estimated price per publication.
- The price can be manually overridden; the suggestion source
  stays visible (observed market price vs AI estimate).
- Source: real market observations (minor units + dated FX
  rate) with a deterministic median; the AI estimate is kept
  separate and never mixed into observed money.

### F9 — Sale status

- Shipped: a per-copy active flag (`sale_transactions`) plus a
  collection-level derived tri-state (none / some / all).
- Status changes stay traceable in the record.

### F10 — Demo profiles and shared data

- The user enters by picking one of 10 demo profiles **without
  opening an account**.
- All profiles access **the same data as everyone else**; no
  data split between profiles.
- Profile choice may personalize look/experience but never
  splits data.

### F11 — Identity and authorization infrastructure (hidden in demo)

- Login, membership, user types and authorization checks are
  designed as **separate modules**.
- These modules stay **hidden** in the demo experience; no
  login/signup screen is shown.
- Rule: authorization checks gather inside their modules; they
  are not scattered into business logic.

### F12 — Language

- The app's **default language is English**; Turkish strings
  ship alongside (EN+TR parity).

## 4. Demo / Full-Version Visibility Matrix

| Area | In demo | In full version |
|---|---|---|
| Library, collections, sets, inventory | Visible | Visible |
| Visual recognition, voice notes | Visible | Visible |
| Muse diagnosis, automatic pricing, sale status | Visible | Visible |
| 10 demo profiles, shared data | Visible | Removable/changeable (open decision) |
| Login, membership, user types, authorization | **Hidden** (modules stand apart) | Visible |

## 5. Out of Scope

- Real payment/order infrastructure (sale status is status
  tracking only).
- Per-user data split in demo (shared data applies).
- Visible login/signup flow in demo.
- Every feature not written in this document (subject to a
  later scope revision).

## 6. Open Decisions and Assumptions (outcomes)

1. Stack — decided: React Native + TypeScript, bare native
   Android project; see DECISIONS.md D2 (Final).
2. Shared-data mechanism — decided: shared backend (Supabase)
   + server-issued demo session (RPC; no Auth account, no
   anonymous sign-in); see DECISIONS.md D1 (Final).
3. Publication types and required/optional field list —
   decided: 20 publication types + code dictionaries
   (migration `20261104164000`), coded labels on result
   cards; unknown stays null.
4. Collection delete/move rules — decided: childless-only
   delete (referenced deletes rejected), moves supported,
   atomic server RPCs with media cleanup.
5. Set integrity rules — partial: member lists with
   hierarchical numbering shipped; expected-parts
   completeness tracking DEFERRED (no expected-count field
   in `sets`).
6. Muse integration method and full diagnosis content —
   decided: fixed 4-leg provider chain (D19) + voice-first
   waterfall contract (§01–§11 + chain v1–v4 + 12-item audit).
7. Price data source, currency, update frequency — decided:
   observed market prices in minor units with dated FX +
   deterministic median; AI estimate kept separate.
8. Sale status value set — decided: per-copy active flag
   plus derived collection tri-state (D17/D18).
9. Fate of demo profiles in the full version — still open
   (no full version exists).
10. Target Android versions — decided: minSdk 24 / targetSdk
    36 (template pins), NDK 30 (user decision); see
    DECISIONS.md D3 (Final).

Assumption: the user keeps giving requirements in stages; each
stage does only its own job.

## 7. Acceptance Criteria (document level)

- Every F item in this document converted to singly verifiable
  shipped work, except the §6.5 completeness tracker
  (explicitly deferred).
- The hidden-module boundaries of the demo (§4) are not violated.
- The default language verifies as English.

## 8. Change History

| Version | Date | Description |
|---|---|---|
| 0.1 | 2026-10-28 | First draft: F1–F12, visibility matrix, open decisions |
| 0.2 | 2026-10-28 | D1 recorded: demo identity decision (A); §6 item 2 updated |
| 0.3 | 2026-10-28 | D2 recorded: stack decision (A); §6 item 1 updated |
| 0.4 | 2026-10-28 | D3 recorded: version set; §6 item 10 updated |
| 0.5 | 2026-10-28 | D3 corrected: NDK 30 + android-37.2-beta3; §6 item 10 updated |
| 0.6 | 2026-10-30 | Demo profile count raised from 8 to 10 (§2, F10, §4) |
| 0.7 | 2026-10-31 | D1 correction: anonymous Auth assumption dropped, RPC demo session model (§6 item 2) |
| 1.0 | 2026-11-06 | Final: English; shipped rules recorded; §6 outcomes (§6.5 and §6.9 deferred/open) |
