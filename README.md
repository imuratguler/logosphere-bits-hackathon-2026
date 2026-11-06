# Logosphere BITS

Android app for cataloguing physical books and periodicals: photograph a copy,
attach a voice note per photo, get an AI identification with catalog evidence
and market pricing, then save it into nested collections and sets.

- Scope: [docs/SCOPE.md](docs/SCOPE.md)
- Decisions: [docs/DECISIONS.md](docs/DECISIONS.md)
- Setup (database + functions): [docs/SETUP.md](docs/SETUP.md)
- Dependencies: [docs/DEPENDENCIES.md](docs/DEPENDENCIES.md)
- Session logs: [docs/sessions](docs/sessions)
- Turkish copy: [README_TR.md](README_TR.md)

## Status (2026-11-05)

- Release APK signed with a dedicated release key, installed over wireless ADB,
  cold-opened and exercised without Metro.
- App id `com.logosphere.bits`, version 1.0 (code 1).
- Default app language: English (Turkish strings kept alongside).

## Architecture

- Client: React Native 0.88.1 + TypeScript, bare workflow, Hermes.
  Camera/gallery capture, per-photo voice notes, demo persona login,
  folder hierarchy, stage tracking, review cards, sale status, CSV export.
- Server: Supabase Postgres + four Edge Functions
  (`bits-pipeline-create`, `bits-analysis-run`, `bits-analysis-save`,
  `bits-price-research`). All provider keys stay server-side; the APK
  carries only the public project URL and anon key.
- AI chain per stage (first schema-valid win stops the chain):
  DeepSeek vision fast → DeepSeek vision →
  `meta-models/muse-spark-open-1026` on Baseten →
  `muse-spark-1.3` on the Meta API. Audio uses the two Muse legs.
  Each provider has its own request converter; per-leg model id,
  HTTP status, error class and latency are recorded.
- Voice-first waterfall: transcribe attached audio first, pre-read what
  is visible in each photo (no guessed ISBNs), run a deterministic
  source waterfall (Open Library, Google Books, Amazon markets,
  Kitapyurdu, NadirKitap, AbeBooks) with detail-page parsing and edition
  matching,
  then final diagnosis, Dewey verification against the local
  `dewey_nodes` table, real market-price observations, and duplicate
  review before the user approves and saves.

## Built with

- Developed with Muse Code, powered by Meta Muse Spark.
- Baseten hosts the `muse-spark-open-1026` leg used for vision reads,
  transcription, final diagnosis and price commentary.

## Demo login and install

1. Install the signed release APK on the device (wireless `adb install`).
2. Open the app with no Metro running; pick a demo persona on the login
   screen to enter the shared catalog.
3. Capture path: collection → camera/gallery + voice → AI result →
   approve → Add to Collection → sale status → CSV export/share.

## Checks

- `npm run typecheck`, `npm run lint`, `npm run format`, `npm test`
- `deno test --allow-env --allow-net` under `supabase/functions/`

## License

MIT — see [LICENSE](LICENSE).
