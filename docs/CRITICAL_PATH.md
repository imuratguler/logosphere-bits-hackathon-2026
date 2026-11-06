# Logosphere BITS — Critical Path Record

- Date: 2026-11-05 (finalized 2026-11-06; prior record 2026-11-03)
- Source: 4 Edge Functions + 43 migrations + Baseten official
  audio/vision docs + real-device evidence; the camera/voice front
  end was preserved.

## Verified gaps (all closed)

1. The `bits-analysis-run` transcribe stage was skipped as
   `engine-undecided` (`supabase/functions/bits-analysis-run/index.ts`,
   old line 360). CLOSED: real transcription through the provider
   chain (D19); no audio means no call (`no-voice`); chain
   exhaustion is fail-open (a `failed` row, the photo flow
   continues).
2. The catalog stage only did ISBN normalization. CLOSED: local
   `catalog_records` matching + multi-source waterfall (Open
   Library, Google Books, Amazon markets, Kitapyurdu, NadirKitap,
   AbeBooks) with detail-page parsing, edition matching, and a
   per-field evidence table; the record joins the visual evidence.
3. Multi merge gave no AI duplicate decision. CLOSED: a separate
   duplicate decision after prices + server guards (currency,
   edition) + same-physical-copy rule + `needs_review` flags; the
   stage does not run for single-item runs.
4. The release configuration signed with the debug key
   (`android/app/build.gradle`, old
   `signingConfig signingConfigs.debug`). CLOSED (commit
   `ae0f3f2`): release signs from an environment-provided
   keystore and fails loudly when it is missing; the signed
   release APK was installed over wireless ADB, cold-opened and
   exercised without Metro. A debug APK is never delivered.

## Shipped (voice-first input through the provider chain)

- Chain per stage, first schema-valid win stops the chain:
  DeepSeek vision fast → DeepSeek vision →
  `meta-models/muse-spark-open-1026` on Baseten →
  `muse-spark-1.3` on the Meta API. Audio uses the two Muse
  legs (Baseten 1026, then `muse-spark-1.2`).
- Keys live only in Supabase server secrets, never in the
  client or logs; each provider has its own request converter.
- Order: in single mode all voices run BEFORE the first visual
  query; in multi mode each voice runs before its own photo's
  first query (transcribe stage before pre-read + event times).
- Matching: stable image UUID + audio versioning (v1);
  transcription is stored as a user statement; an empty
  recording is null, nothing is invented.
- Technical counters per attempt (provider, model, result,
  error class, latency) are written into the stage payload.
  This is not a billing dashboard.
- Live calls WERE made: DeepSeek x2, Baseten 1026 and Meta
  1.3/1.2 verified live; Gemini returned 402 (empty
  prepayment) and was dropped from the chain.
