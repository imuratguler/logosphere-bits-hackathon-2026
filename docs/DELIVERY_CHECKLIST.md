# Logosphere BITS — Delivery Checklist

- Date: 2026-11-06 (finalized; prior record 2026-11-03)
- Scope: reachable delivery items; a feature that does not run is
  never written as if it runs.

## Submission form

- No accessible submission form in the workspace; the field list
  could not be verified. OPEN — fill in when the form is seen.

## Video (3 minutes)

- No demo video link in the repo. OPEN — clean clips will come from
  the device acceptance captures.

## Public open-source GitHub

- `https://github.com/imuratguler/logosphere-bits-hackathon-2026`
  returned 404 for anonymous access (repo private) on 2026-11-03.
  OPEN — re-verify at publish time.
- LICENSE: MIT license file is present in the worktree. It was
  still untracked at finalization; include it when committing.
- Rule: go public only AFTER the secret/data review; `.env`,
  keys, keystores, private media and temporary outputs never
  enter the public repo.

## App status (real)

- Camera/voice front end: verified on device.
- Transcription: runs server-side through the provider chain,
  verified live (not fixtures).
- Waterfall/diagnosis/price/duplicate: shipped and verified live.
- Result pages: shipped (shared 6-section detail card).
- Price/sale: shipped (observed prices + AI estimate kept
  separate; per-copy sale flags + derived tri-state).
- CSV export + Downloads: shipped and verified on device (Alert
  + real CSV file; share sheet removed).
- Release APK (proper signature): DONE — env-provided release
  keystore (commit `ae0f3f2`), installed over wireless ADB,
  cold-opened and exercised without Metro. A debug APK is
  never delivered.
