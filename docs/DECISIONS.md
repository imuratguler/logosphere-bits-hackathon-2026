# Logosphere BITS — Decision Records

Finalized 2026-11-06 (first records 2026-10-28). Implemented
decisions are marked **Final**; superseded ones are marked as
such. Deferred operating topics are noted, never blocking.

## D1 — Demo identity model: server-issued demo session (RPC)

- Status: **Final**
- Date: 2026-10-28 (corrected 2026-10-31)
- Context: SCOPE.md F10 (accountless demo, 10 profiles, shared
  data) and F11 (identity/authorization in separate modules,
  hidden in demo).

### Options

- **A) Invisible anonymous Supabase session in the background,
  no login screen.** The app opens an invisible session at
  launch with `signInAnonymously()`; the user never registers.
- **B) Fully open database for all writes.** Identityless,
  RLS-less shared writing.
- **C) Login to ten real accounts with embedded passwords.**
  Profiles bind to real Supabase users; passwords embed in the app.

### Decision

**A was selected.** No concrete technical blocker was found
(verification below).

### Grounds

- A meets two requirements at once: **registrationless demo
  use** and **traceable writing** (each write can link to the
  anonymous user's `auth.uid()`).
- Profile choice is not identity: 10 profiles are only a local
  UX preference; they open no account, grant no right, change
  no session.
- Fits the F11 boundary: the anonymous session stays inside
  the identity module; no login/signup screen shows in demo.
- The path to membership stays open: an anonymous user can
  later convert to a permanent user by linking an identity.
- B was rejected: writes are untraceable (misses the user's
  explicit requirement), anyone can delete/change anything,
  fully open to abuse.
- C was rejected: an embedded password is a client-strippable
  secret (no real security); writes trace only at profile
  level (10 people = 1 identity); password rotation breaks
  old versions; account sharing cannot move to a membership
  model.

### Verification (concrete blocker scan)

Per the official Supabase docs ([Anonymous
Sign-Ins](https://supabase.com/docs/guides/auth/auth-anonymous?queryGroups=language&language=js)):

- `signInAnonymously()` exists in the JavaScript, Flutter,
  Swift, **Kotlin**, Python and C# clients — supported
  whichever stack decision (§6 item 1) lands.
- Anonymous users behave like permanent users, use the
  `authenticated` Postgres role; the `is_anonymous` JWT claim
  can be used in RLS policies.
- An anonymous user can convert to a permanent user by
  identity linking (with manual linking enabled).
- The documented caution is not a blocker but a design note:
  anonymous users use the `authenticated` role, so RLS
  policies must carry the `is_anonymous` distinction.

### Results and constraints

- "Anonymous sign-ins" must be enabled in the Supabase
  project (at implementation stage).
- Shared data reads are open to all anonymous sessions;
  write policies require an `auth.uid()` link.
- The session is device/policy bound: on logout, data wipe
  or reinstall the anonymous identity is lost; traceability
  is accepted **at install-session level**.
- Deferred operating topics (not blockers, later stages'
  jobs): orphan anonymous user cleanup, write quota/rate
  limit, abuse policy.
- Network dependence is not specific to A; the shared-data
  requirement wants a backend for B and C too.

### Verification plan (deferred to implementation stage)

- The app opens with no login screen and the invisible
  session is established.
- Writes link to the anonymous `auth.uid()`.
- Profile change neither changes the session nor grants
  further rights.

### Correction (2026-10-31): no anonymous Auth, an RPC demo session exists

Option A of the first draft (`signInAnonymously()` invisible
Auth session, traceability via `auth.uid()`, `is_anonymous`
RLS distinction, the "anonymous sign-ins must be enabled"
condition and the invisible-session items of the verification
plan) is INVALID and was never implemented: the demo path
opens no Auth account, never calls `signInAnonymously()`,
creates no `auth.users` row, uses no `auth.uid()`.

The valid model (migration `20261030080608_demo_write_policy`):

- Demo identity = a `demo_sessions` row:
  `start_demo_session(p_persona_id)` (SECURITY DEFINER,
  `anon`/`authenticated` EXECUTE) validates the persona id
  against `demo_personas`, mints a random session id + a
  24-hour expiry; revocation is a server-side `revoked_at`
  update.
- The client runs sessionless under the `anon` role: reads
  go through sessionless anon SELECT policies; writes go
  only through SECURITY DEFINER RPCs taking `p_session_id`
  (`demo_authorize`: invalid / revoked / expired checks +
  `demo_permissions` cell check).
- Traceability is at session-row level (persona + time);
  persona choice stays client-side, never splits data.
- The real-account design stays apart: `profiles`→`auth.users`,
  `organization_memberships`, `role_permissions` matrix; the
  demo path never consults this table/matrix (demo_authorize
  rule 2). Moving to membership is a separate decision.
- Old "D1 anonymous demo" phrases in migration comments are
  historical text; behavior is as above.
- Deferred operating topics: cleanup of expired demo
  session rows, write quota/rate limit, abuse policy.

### Open points

- None (for this decision). Stack choice and operating
  policies are handled at their own stages.

---

## D2 — App stack: React Native + TypeScript, bare native Android project

- Status: **Final**
- Date: 2026-10-28
- Context: SCOPE.md F5 (visual recognition, camera/gallery),
  F6 (one voice note per visual), §6 item 1 (stack choice).
  No assumption about previous projects or other folders was
  used; only the toolchain verified in this workspace and
  the official docs named below applied.

### Options

- **A) React Native + TypeScript, bare native Android
  project.** The `android/` tree is ours; Gradle/Manifest
  control is direct.
- **B) Expo development build.** Native code supported;
  `android/`/`ios/` trees are generated by prebuild.
- **C) Running a web app inside an Android shell.** No
  owned `android/` project and no native module layer.

### Decision

**A was selected.** No concrete technical blocker was found
(verification below).

### Grounds

- The user's explicit requirement (custom camera, audio
  recording, direct control over the Android build) is met
  structurally in A: the native project, permissions and
  build are ours.
- Camera: per the official VisionCamera setup guide, the
  library uses CameraX on Android, installs via npm and
  directly supports the **bare React Native** flow
  (permissions join `AndroidManifest.xml`, then a native
  rebuild) — [setup
  guide](https://visioncamera.margelo.com/docs/guides/installation).
- Audio: per the official Expo Audio docs, `expo-audio`
  supports recording and playback on Android and can join an
  existing React Native app by installing Expo modules
  ("If you are installing this in an existing React Native
  app...") — [Expo
  Audio](https://docs.expo.dev/versions/latest/sdk/audio/).
  Community recording libraries also work directly in A;
  the exact package choice belongs to implementation stage.
- Toolchain ready: verified in this area — Node v24.15.0,
  npm 11.12.1, JDK 17.0.12 (build test passed), Android SDK
  (platforms/build-tools 35–37), ADB working.
- B was not eliminated but ranked second: development builds
  support native-code libraries, but native trees are
  generated by prebuild (CNG) and native dependency/config
  changes need `prebuild --clean` + rebuild — [development
  builds](https://docs.expo.dev/develop/development-builds/introduction/).
  This meets the "direct build control" requirement less
  than A; it also brings SDK-match dependence and (for
  cloud builds) an Expo account. Camera/audio feasibility
  does not eliminate B; control level does.
- C was rejected: with no owned native project layer, the
  custom camera and direct build control requirements
  cannot structurally be met.
- Compatible with D1: the Supabase JS client is used in A;
  the anonymous session decision does not change.

### Results and constraints

- Maintaining the `android/` project (Gradle, Manifest,
  permissions, version targets) is our responsibility.
- Every add/change of a library holding native code wants a
  native rebuild (similar cost to B, but the production
  mechanism is direct ownership, not prebuild).
- Exact camera/audio packages are not approved by this
  decision; candidates (VisionCamera; expo-audio or a
  community recorder) are selected and verified at
  implementation stage. Shipped: VisionCamera 5.2.3 +
  expo-audio 58.0.11.
- TypeScript was decided as part of A (possible in B too;
  not distinguishing).

### Verification (done)

- Android builds were taken with the local toolchain
  (debug + signed release).
- Camera shots were taken on a real device; one voice note
  per visual was recorded and played (F5–F6 acceptance).

### Open points

- None (for this decision). Exact package and version
  choices were implementation stage's job — done.

---

## D3 — Compatible version set (official template pins apply)

- Status: **Final**
- Date: 2026-10-28
- Context: D2 (bare RN + TypeScript). Principle: **no
  unconditional "latest"** — versions come from the
  official stable release's template pins; `^` ranges are
  resolved by npm at install and pinned into the lock file.
  This decision includes no install.

### Selected versions

**JavaScript side** (source: official template `0.88.1`,
[template/package.json](https://raw.githubusercontent.com/react-native-community/template/0.88.1/template/package.json)):

| Package | Version | Note |
|---|---|---|
| `react-native` | `0.88.1` (exact) | Last stable patch ([releases](https://github.com/react/react-native/releases/tag/v0.88.1), 2026-10-27) |
| `react` / `react-test-renderer` | `19.3.0` (exact) | Template pin; RN 0.88.1's matching React |
| `typescript` | `^6.0.3` (range) | Template range taken as-is; exact version goes to the lock |
| `@react-native/*` (babel-preset, eslint-config, jest-preset, metro-config, typescript-config, new-app-screen) | `0.88.1` (exact) | Template pin |
| `@react-native-community/cli` (+ android/ios platforms) | `20.2.0` (exact) | Template pin |
| `@types/react` | `^19.2.0` | Template range |
| `jest` / `@types/jest` | `^29.6.3` / `^29.5.13` | Template range |
| `eslint` / `prettier` | `^8.19.0` / `2.8.8` | Template pin |
| `react-native-safe-area-context` | `^5.5.2` | Template's default dependency |

Note: `@react-native/new-app-screen` and
`react-native-safe-area-context` were removed after verifying
the scaffold does not use them; re-added on need at the
navigation stage (safe-area-context 5.10.1 shipped).

**Working tools** (source: RN 0.88 official setup doc,
[Windows + Android](https://raw.githubusercontent.com/react/react-native-website/main/website/versioned_docs/version-0.88/_getting-started-windows-android.md) + template `engines`):

| Tool | Required | Local state |
|---|---|---|
| Node | `>= 22.11.0` (LTS advised) | v24.15.0 ✓ |
| npm | Ships with Node (11.12.1 verified) | ✓ selected as package manager |
| JDK | 17 advised (higher may break) | 17.0.12 ✓ (verified before D2; no upgrade) |

**Android side** (source: template
[android/build.gradle](https://raw.githubusercontent.com/react-native-community/template/0.88.1/template/android/build.gradle),
[gradle-wrapper.properties](https://raw.githubusercontent.com/react-native-community/template/0.88.1/template/android/gradle/wrapper/gradle-wrapper.properties),
gradle-plugin
[libs.versions.toml](https://raw.githubusercontent.com/react/react-native/v0.88.1/packages/gradle-plugin/gradle/libs.versions.toml)):

| Component | Version | Local state |
|---|---|---|
| Gradle | `9.4.1` (wrapper downloads it) | ⏳ arrives at first build, no install needed |
| AGP (`com.android.tools.build:gradle`) | `9.2.1` | ⏳ resolves from catalog at build |
| Kotlin (`kotlin-gradle-plugin`) | `2.2.0` | ⏳ resolves at build |
| Build platform | `platforms;android-37.2-beta3` (API 37.1, DEV, beta 3) | ✓ installed (user decision) |
| Stable spare platform | `platforms;android-37.0` (API 37.0, stable) | ✓ installed |
| `targetSdkVersion` / `minSdkVersion` | `36` / `24` (template pin) | ✓ `android-36` installed |
| `buildToolsVersion` | `37.0.0` | ✓ installed |
| `ndkVersion` | `30.0.16248370` (r30) | ✓ installed (user decision; template pin `27.1.12297006` void) |
| Platform `android-36` | API 36 | ✓ installed |
| CMake | template pins nothing | ✓ 3.22.1 and 4.1.2 installed |
| cmdline-tools (latest) | latest | ✓ installed |
| Emulator system image | needed for AVD | ⚠ `system-images` empty → at setup stage (or physical device) |

### Grounds and principles

- RN `0.88.1`: official last stable patch; the React match
  and all `@react-native/*` pins come exactly from the
  template, upgraded no further.
- TypeScript `^6.0.3`: the template range is unchanged; the
  exact version npm resolves is pinned into the lock file.
- Node `>= 22.11.0`: both the doc and the template
  `engines` give the same bar; current v24.15.0 meets it,
  no Node change needed.
- JDK 17: the doc plainly advises it and warns about higher
  versions; current 17.0.12 is kept.
- Gradle/AGP/Kotlin/SDK levels are template pins; never
  changed for "a newer one exists". At two points a user
  decision overrides the template: NDK (`30.0.16248370`)
  and build platform (`android-37.2-beta3`).
- **Correction (2026-10-28):** the first version's
  "`android-37` missing" finding was wrong; it rested on
  classic naming. SDK platforms are now minor-versioned:
  `android-37.0` is the stable API 37.0 platform
  (ApiLevel=37.0, no preview), `android-37.2-beta3` is API
  37.1 DEV beta 3. Proof: local `source.properties`
  (`AndroidVersion.ApiLevel`, `AndroidVersion.CodeName`,
  `AndroidVersion.BetaVersion`) and `sdkmanager
  --list_installed` output (`platforms;android-37.0`,
  `platforms;android-37.2-beta3`).
- Doc text (Platform 35 + Build-Tools 36) conflicts with the
  template (compileSdk 37 + buildTools 37.0.0); template
  pins apply for build settings, with the two user
  exceptions above reserved.
- Beta platform build: compiles against preview (DEV) APIs;
  accepted for the demo. The exact Gradle spelling of the
  beta request is verified by the first successful build at
  setup stage; AGP 9.2 reference
  ([CompileSdkSpec](https://developer.android.com/reference/tools/gradle-api/9.2/com/android/build/api/dsl/CompileSdkSpec) /
  `CompileSdkBetaSpec`) confirms the beta specification
  model. If the build sticks, spare: installed `android-37.0`
  stable platform.
- Result: no SDK component install needed; the only open
  item is an AVD system image (or a physical device —
  shipped with the physical device).
- Native packages (camera/audio etc.) are not in this
  decision; when needed they join after verifying
  compatibility with this set's RN/React.

### package-lock.json rule

- Package manager: **npm** (ships with Node; v11.12.1
  verified in this area).
- `package-lock.json` is **only produced and updated by
  npm; never edited by hand.**
- When the project enters version control, the lock file
  joins too; dependency changes go through
  `npm install/uninstall`.

### Verification (done)

- No SDK install was needed (no missing component after
  the correction); the physical device covered the AVD image.
- The template installed on this set; `npm ls` closes
  conflict-free (40/40 exact at finalization).
- Android builds were taken with NDK 30; verified builds
  resolved compileSdk 37 to the installed stable platform
  (see DEPENDENCIES.md); the beta platform stays installed.

### Open points

- None (for this decision). Setup was the next stage's
  job — done.

---

## D4 — Brand assets: logo roles and typeface

- Status: **Final**
- Date: 2026-10-29
- Context: visual identity was not yet added (deliberately
  left out in K27). This decision only records source roles
  and the typeface plan; it includes no production/install.

### Source files (verified)

| File | Size (bytes) | SHA256 |
|---|---|---|
| `D:\Downloads\logo_docs_BITS.png` | 536167 | `6ABC8C4877995E4C3BEDF647BCDF8E1483269AC83240DCBDD48EB3CAA4D207B6` |
| `D:\Downloads\logo_bigcanvas_BITS.png` | 197643 | `797F9DA197F1ECE62802A76388E132E762F986B235809AF8C3C0BEC8DB4F00D6` |

Verification: size + SHA256 were read in this area
(2026-10-29); hashes are kept to compare future
copy/production steps.

### Roles

- `logo_docs_BITS.png`: used in future Word documents and in
  the app's written brand areas.
- `logo_bigcanvas_BITS.png`: used in the Android home,
  apps and drawer launcher icon.

### Selection approval and review (K37, 2026-10-29)

- Logo selection was given by the user: roles as above;
  files are never used in each other's place.
- `logo_docs_BITS.png`: 1920x2480, 536167 bytes; transparent
  ground (19% fully transparent + edge-smoothing pixels);
  badge + "Logosphere" text. Text unreadable on small
  screens → never used as launcher.
- `logo_bigcanvas_BITS.png`: 2048x2048, 197643 bytes; fully
  opaque (no transparent pixel); textless L + library glyph.
  The L silhouette reads on small screens, book details
  soften; fit as icon source.
- Bans: no spontaneous role for other logo variants;
  visuals are never redrawn; color/book ratios never
  changed; old logos in other folders never count as source.
- No Android resource changed in this round.

### Repository copies (K38, 2026-10-29)

- `D:\Downloads\logo_docs_BITS.png` →
  `assets/brand/logo-docs-bits.png` (written document +
  in-app logo; hash matched).
- `D:\Downloads\logo_bigcanvas_BITS.png` →
  `assets/brand/logo-launcher-source.png` (launcher's sole
  source; hash matched).
- Existence + dimensions + hash were verified against the
  D4 record before copying; sources unchanged.
- Derivative rule: needed derivatives are produced only
  from these approved PNGs; no stretching, no redesigning
  books, no cropping the written logo for launcher.
  Variants never spread outside their use places.
- Android icon binding was not done yet. (K38 note;
  produced in K39.)

### Launcher production (K39, 2026-10-29)

- Source: only `assets/brand/logo-launcher-source.png`
  (hash verified); `logo-docs-bits.png` was not used for
  launcher.
- Measurement: ground `#4A90D9` (exact at 4 corners; same
  as theme `colAccentBlue`); glyph box 29–71% x, 25–75% y;
  farthest point from center 31.6% → inside the 66dp safe
  circle (33%); no clipping in any mask.
- Outputs: 5 densities × legacy (square + circle-cropped
  round) + 5 adaptive foregrounds + `mipmap-anydpi-v26`
  XMLs + `colors.xml`. Square-to-square LANCZOS; no
  stretch/draw; re-merge difference 0.22.
- Device proof (K39/K40): the blue L + BITS icon seen
  unclipped in drawer + home "AI & Apps" folder (squircle
  mask, screenshots).

### Logo replacement (Command 14, 2026-11-04)

- New sources (dimensions exactly the old ones; ratios
  untouched, pixel-copy, no transform):
  - `D:\Downloads\Logosphere_BITS_L.png` (2048x2048, 333693
    bytes, SHA256 `40D6408C…F6A1F3`) →
    `assets/brand/logo-launcher-source.png` (hash matched).
  - `D:\Downloads\Logosphere_BITS_Logo.png` (1920x2480,
    542795 bytes, SHA256 `C2E311F1…68465`) →
    `assets/brand/logo-docs-bits.png` (hash matched; 19.6%
    transparent).
- L measurement: ground `#4A90D9` (4 corners; opaque, no
  transparent pixel); glyph box 29.9–77.4% x, 28.9–70.8% y;
  farthest art pixel from center 687px (33.5%). Old art was
  647px (31.6%); the D4 ruler (33% ≈ 676px) and the strict
  66dp (626px) bound both arts at/outside the limit — the
  new design sits ~11px further out; slight clipping of the
  extreme pixels is possible in strict circle masks. The
  user's design was applied as-is (shrink/grow settings
  stay with the user).
- Mipmap recipe (K39 method reverse-verified from current
  res): legacy LANCZOS (MSE 0.0 exact), round hard circle
  mask (alpha difference 0 exact), foreground
  scale-then-key tolerance 52 (bbox ±2px, no visual halo).
  5 densities × 3 files regenerated (15 PNGs); XML/color
  unchanged.
- In-app `vwLogo` picks the new docs logo up with the build.
- Note: the pre-replacement repo launcher file was 89791
  bytes; it did not match the old 197643-byte record in D4
  (single commit, clean tree) — the old record was flagged
  suspicious, the new real values are above.

### Typeface

- EB Garamond Medium; installs under `assets/fonts`; taken
  from a licensed source (Lato-like license discipline).
- Install: 6 files installed in K30, the user added 13
  spares in K31 (19 TTFs under `assets/fonts` in total, all
  verified); details and hashes are in `docs/FONTS.md`
  (single source). Binding: manually bound to Android in
  K32 (details in FONTS.md); no iOS binding.

### Results and constraints (final)

- Launcher icons were produced (K39), verified on device,
  then replaced with the approved new sources (Command 14)
  and re-verified on device (drawer icon, no squircle cut).
- Source files outside the project (`D:\Downloads`) were
  copied into the project (K38); derivatives come only
  from the approved copies.

### Open points

- None (for this decision).

---

## D5 — AI provider access: Muse Spark via Baseten

- Status: **Superseded by D19** (the single-pin rule was
  replaced by the fixed 4-leg chain; the Baseten leg stays
  as leg 3)
- Date: 2026-10-29
- Context: SCOPE.md F7 (Muse diagnosis) and §6 item 6
  (Muse integration method — not closed by this decision,
  only provider access is pinned).

### Baseten reply (from the user, recorded verbatim)

- A private key cannot link to a personal account.
- Official usage cannot be tracked in this workflow.
- The user is charged nothing.

### Interpretation rule

- This access is never interpreted as if a separately paid
  entity or a visible 100 USD balance existed.

### Accepted pins

- Only model: `meta-models/muse-spark-open-1026`.
- Only base URL: `https://inference.baseten.co/v1`.
- No other Baseten model/product is opened.

### Key discipline (this stage)

- At this decision-record stage no key is asked, seen, or
  live-called.
- Keys/tokens are never written into session records
  (SESSION_TODO.md §2 already bans it).

### Next provider stage

- One small live test + a local technical counter are used.
- The Meta account's cost stays apart.

### Open points

- Test content and timing belong to the next provider
  stage — done (live legs verified, see D19).
- §6 item 6 was left open: integration method and
  diagnosis content were not yet decided — decided (D19).

---

## D6 — Programmer Namings (TypeScript naming)

- Status: **Final** (content is user dictation)
- Date: 2026-10-29
- Context: the project's readability, maintenance and
  error-free generation by AI. Applies to all TypeScript
  `interface`, `type`, `class`, `enum`, `const` and
  `function` definitions.

### English rule

- Field names and all in-code identifiers are written in
  English (`temporary`/`temp`, never `gecici` etc.).

### Hierarchy (mandatory, 100% conformance)

1. COLORS (root: `col`) — system, theme and UI colors.
   - Examples: `colBackground1`, `colBackground2`,
     `colSuccess1`, `colDanger`, `colNavy`, `colSilver`
2. VIEWS AND COMPONENTS (root: `vw`) — pages, modules,
   cards, layouts, buttons, all UI components.
   - Examples: `vwItemCard`, `vwNavbar`, `vwDashboardLayout`,
     `vwMainList`, `vwSubmitBtn`
3. LABELS (root: `lab`) — text labels, headings,
   description/placeholder/tooltip texts.
   - Examples: `labItemTitle`, `labFormErrorHeader`,
     `labInputPlaceholder`, `labWelcomeMessage`
4. FIELDS AND DATA MODELS (root: `fld`) — object
   properties, DB fields, form input data shapes. `fld` +
   3-letter type split:
   - A) Date (`fldDat`): `fldDatPublishDate`, `fldDatUpdatedTime`
   - B) Text (`fldStr`): `fldStrItemName`, `fldStrDescription`,
     `fldStrUserEmail`
   - C) Numeric (`fldNum`): `fldNumPrice`, `fldNumStockCount`,
     `fldNumDiscountRate`
   - D) Boolean (`fldBoo`): `fldBooIsActive`,
     `fldBooHasDiscount`, `fldBooIsDeleted`
   - E) Object/Array (`fldObj`/`fldArr`): `fldObjMetaData`,
     `fldArrTags`
5. SERVICES AND API LAYER (root: `srv`) — API requests,
   HTTP clients, integrations, routers, service
   classes/functions. Never `svc`, always `srv`.
   - A) Data fetch/write (`srvApi`): `srvApiGetProduct`,
     `srvApiUpdateUser`
   - B) Storage (`srvStor`): `srvStorSetToken`, `srvStorGetTheme`
   - C) Auth (`srvAuth`): `srvAuthLogin`, `srvAuthLogout`
   - D) Navigator (`srvNav`): `srvNavToDashboard`, `srvNavGoBack`
6. ACTIONS AND EVENTS (root: `act`) — user interactions,
   triggers, state changes, event handlers.
   - A) Handler (`actHand`): `actHandOnClick`,
     `actHandOnSubmit`, `actHandOnChange`
   - B) Redux management (`actSet`/`actRdx`):
     `actSetLoadingState`, `actRdxCartReducer`
7. FUNCTIONS AND BUSINESS LOGIC (root: `fnc`) — pure
   business logic, computations, data manipulation.
   - A) Compute (`fncCalc`): `fncCalcTotalPrice`,
     `fncCalcTaxAmount`, `fncCalcDiscount`
   - B) Conv (`fncConv`): `fncConvJsonToXml`,
     `fncConvStringToNumber`, `fncConvArrayToMap`
   - C) Business logic/flow (`fncRun`): `fncRunOrderPipeline`,
     `fncRunUserActivation`
8. VALIDATION AND RULES (root: `vld`) — form validations,
   business rule checks, schema validations.
   - A) Logical check (`vldChg`): `vldChgIsEmailValid`,
     `vldChgIsPasswordStrong`
   - B) Complex schemas (`vldSch`): `vldSchProductSchema`,
     `vldSchUserFormSchema`
9. HELPERS (root: `utl`) — domain-free pure helpers.
   - A) Date (`utlDat`): `utlDatFormatToDays`, `utlDatGetTimeAgo`
   - B) Text (`utlStr`): `utlStrConvertToSlug`, `utlStrTruncateText`
   - C) Number/finance (`utlNum`): `utlNumFormatCurrency`,
     `utlNumAddLeadingZeros`
   - D) Object/array (`utlObj`/`utlArr`): `utlObjDeepClone`,
     `utlArrRemoveDuplicates`

### AI code generation and audit rules

- When a naming violating the hierarchy is seen (e.g.
  `fetchData`, `validateEmail`, `formatDate`, `setIsActive`,
  `onButtonClick`, `CnvJson`), the user is warned before
  code is written and the correct form is used.
- Operating the rule is also recorded in
  `SESSION_TODO.md` §3 (this D6 record is the single source).

### Exceptions (framework obligation, K35)

- Component definitions are written D6-pure lowercase
  (`vwText`); JSX forces uppercase, so an uppercase alias is
  used at the use site (`import { vwText as VwText }`).
  The alias is the JSX obligation's exception.
- Third party / framework API names are outside D6 and are
  never renamed: React (`children`, `createElement`), React
  Native (`Text`, `StyleSheet`, style props), jest (`test`,
  `describe`), package import names.

### Open points

- None (for this decision).

---

## D7 — Set model: separate collection-bound sets table + set_id on publications

- Status: **Final**
- Date: 2026-10-29
- Context: SCOPE.md F1 (publications can link to sets), F3
  (set definition, member add/remove, integrity visibility).
  "Publication" is the SCOPE term (same item as "product"
  in requests).

### Options

- **A) Separate `sets` table (collection-bound) + `set_id`
  on publications.** A set is a first-class record; name,
  members and total price are managed separately at set
  level. Membership is FK-integral; renaming is one row;
  RLS is written per table (fits the D1 pattern). Cost: one
  table + one FK; member list wants a join; one publication
  can join one set at a time (1:N).
- **B) Storing a set like a special product.** Fewer parts
  with one table, but mixed semantics: set rows leak into
  product lists in every query forgetting the type flag;
  the total is either computed or kept in a meaning-drifted
  column; "separate management" is hurt.
- **C) Grouping with text labels only.** Schemaless and
  flexible, but integrityless: a typo breeds a separate
  group; renaming is a bulk write; name/total/integrity
  needs an off-label mechanism; F3's "defines a set" action
  stays undefined.

### Decision

**A was selected** (user preference; evaluation agrees).

### Grounds

- F3 wants a first-class set: definition, member
  add/remove and integrity view cannot stand without
  set-level fields.
- Name, members and total price are managed separately:
  name is a `sets` column; members are queried/counted via
  `set_id`; the total is handled at set level.
- Integrity (missing parts) can compute from membership; C
  has no such ground, B buries it in a type condition.
- B's silent-error class (forgotten flag) and C's
  integritylessness were eliminated.

### Results and constraints

- `sets` binds to a collection; a publication joins one set
  via `set_id` (1:N).
- Table and screen creation are outside this decision;
  done at their own steps. Outcome: no stored total column
  (`sets` holds id, collection, name, order, timestamps);
  totals derive at read time.

### Open points

- F1's plural "sets" reading: if one publication must join
  several sets at once, A extends with a junction table;
  that is a separate decision, and no such requirement is
  currently in scope.
- SCOPE §6 item 5 (set integrity rules) stays partly open:
  member lists shipped, expected-parts completeness
  deferred (see SCOPE.md 1.0).

---

## D8 — File Namings: folder prefixes

- Status: **Final** (content is user dictation)
- Date: 2026-10-30
- Context: D6 covers in-code identifiers; this record
  covers file names. Together they are the whole naming
  system.

### Rules

Every folder's files start with its own prefix. When a
folder does not exist yet, new files take the same order
when it opens.

| Folder | Prefix | Examples |
|---|---|---|
| `assets` | `ast` | `astBanner.jpg`, `astLogo.png` |
| `components` | `vw` | `vwButton.tsx`, `vwCard.tsx`, `vwEmptyState.tsx`, `vwLoading.tsx`, `vwLogo.tsx`, `vwSplash.tsx`, `vwText.tsx`, `vwTextInput.tsx` |
| `config` | `cfg` | `cfgFlags.ts`, `cfgSupabase.ts` |
| `constants` | `con` | `conAppLimits.ts`, `conRegexPatterns.ts` |
| `contexts` | `ctx` | `ctxAuth.tsx`, `ctxThemeMode.tsx` |
| `hooks` | `hok` | `hokAuth.ts`, `hokDebounce.ts`, `hokFetchData.ts` |
| `i18n` | `int` | `intLocale.ts`, `intTranslations.ts` |
| `navigation` | `nav` | `navApplication.tsx` |
| `screens` | `scr` | `scrSearchItem.tsx`, `scrLogin.tsx` |
| `services` | `srv` | `srvMembership.ts`, `srvPayment.ts`, `srvUser.ts` |
| `types` | `typ` | `typModels.ts` |
| `utils` | `utl` | `utlTheme.ts` |
| `validation` | `vld` | `vldDetails.ts`, `vldHierarchy.ts`, `vldMembership.ts` |

### Scope notes

- File name and in-code identifier are separate planes: the
  prefix rule binds the file name, exports inside the file
  follow D6.
- Applied in K70: `config`, `i18n`, `types`, `utils`,
  `validation` were renamed; `components` already fit.
- `navigation`, `screens`, `services` and later folders
  opened afterwards use these prefixes.
- `__tests__` file names are outside this decision.

### Open points

- None (for this decision).

---

## D9 — Reference tables opened to anonymous reads; data responsibility with the user

- Status: **Final** (content is a user decision)
- Date: 2026-10-30
- Context: the K75 closed posture was relaxed by this
  decision; the K84 gates (B1/B2 transfer blockers) stand
  as-is because no project-side transfer ran; the B3/B4
  access decisions close with this record.

### Decision

- `public.dewey_nodes` and `public.geo_nodes` are readable
  by logged-out clients: only a SELECT grant to the `anon`
  role + one `FOR SELECT TO anon USING (true)` policy per
  table (`dewey_nodes_anon_read`, `geo_nodes_anon_read`).
- RLS stays on in both tables. No INSERT/UPDATE/DELETE or
  other right opens for `anon`; no grant to the
  `authenticated` role in this round (no auth flow runs in
  the app; re-evaluated when it arrives).
- Other tables' permissions, reference rows and
  `geo_nodes.postal_code` values do not change.

### Data responsibility

- The remote tables' 35,293 Dewey + 233,001 Geo rows were
  copied. (Read-only SELECT source, atomic verified
  2,000-row batches, deterministic UUID mapping; separate
  session record `docs/sessions/Logosphere BITS,
  20261030_153216_TST.MD`). The file-based transfer scripts
  (`supabase/transfers/dewey/`, the combined Geo SQL) and
  `Geo_Load_for_BITS.sql` were never run.
- The loaded data's source and accuracy are the user's
  responsibility. Rights statements are not treated as
  resolved for public distribution. The K73/K74 file gates
  stand as records because no file-based transfer ran;
  K84's "Geo-global only" limit was exceeded by this load
  (full data loaded under user direction).
- The transfer scripts (`supabase/transfers/dewey/`, the
  combined Geo SQL) are kept for future verified loads;
  they never ran with this data.

### service_role rotation (deferred)

- Rotation advice for the legacy `service_role` JWT
  fragment that fell into the K86 session transcript was
  DEFERRED by user decision; not treated as resolved.
- No key was asked, seen, or shown in this round.

### Re-evaluation (2026-10-31): the auth flow arrived

- The hidden real-account flow (login/signup) entered the
  client at this date; the `authenticated` grants deferred
  above were recognized with migration
  `20261031191911_account_core_and_demo_rejection`:
  policy-bound SELECT/INSERT/UPDATE on `profiles` (own row
  only), policy-bound SELECT on
  `organizations`/`organization_memberships` (membered
  only), EXECUTE on `account_upsert_profile`/
  `account_create_organization`/`account_assign_role`. No
  grant to the `anon` role in this round either; the demo
  path did not change.

### Open points

- At load time the transfer script verified
  uniqueness/orphan/root counts (dewey 10 roots, geo 250
  roots, 0 orphans); a parent id below its child id in the
  source rules cycles out structurally. Leftover note: the
  audited SQL file holds 35,292 tuples while the source DB
  holds 35,293 rows (the file trails by 1 row).
- `authenticated`-role read grants are decided together
  with the first auth flow — done (see re-evaluation above).

---

## D10 — Product add mode: Single Item + Bulk Items (option A)

- Status: **Final**
- Date: 2026-10-31
- Evaluation: A) Single Item is several photos of the same
  physical publication; Bulk Items breeds one candidate per
  visual and matches merge later through duplicate control.
  B) counts every photo unconditionally as a separate
  product. B breeds fake product inflation when one
  publication is shot from several angles and dumps the
  merge load on the user; A keeps the physical reality
  (one publication, N photos) and leaves the excess to
  server-side duplicate control. A was selected.
- Rules: the shoot entry stands only in a fitting leaf
  collection (a collection with no child collection); no
  product-add button exists at the library root. Single
  Item and Bulk Items open the same camera with a different
  `fldStrCaptureMode` (`single` | `bulk`); the mode is
  picked once at entry, never asked a second time before
  analysis starts. Until the camera is ready, buttons stay
  disabled-but-visible; never touchable-but-dead.

## D11 — Camera shoot approval: a mid-question at every publication shoot

- Status: **Final**
- Date: 2026-10-31
- Rule: whenever the camera needs to shoot a publication
  (book, periodical etc.), approval is taken with a
  mid-question specific to that job before the shoot; no
  one-time general approval is banked. No shoot runs
  without approval, and no shoot is reported as if tested.

---

## D12 — BASE PLAN reference is read-only; BITS decisions take priority

- Status: **Final**
- Date: 2026-11-01
- Context: BASE PLAN is studied as operating logic.

### Rules

- A design/flow read from BASE is adapted to the BITS
  naming (D6/D8), data model, API operation, shared demo
  area and safe server-call order.
- Current BITS product and flow decisions (SCOPE, D1–D11
  and later) take priority wherever BASE behaves
  differently.

---

## D13 — Test files: never at the root, `__tests__/output` is the only address

- Status: **Final**
- Date: 2026-11-02
- Context: user dictation; test evidence is banned from
  dirtying the app root.

### Rules

- Screenshots, UI dumps and throwaway test scripts
  (including `bits-*`) are never written to the app root;
  they are created only under `__tests__/output/`.
- New test files are also created under `__tests__/output/`
  (jest default discovery covers this subfolder; current
  suites stay in place).
- `__tests__/output/` stays out of commits: selective
  adding via `git status` before push, evidence files
  never join a commit.
- On 2026-11-02 the 184 `bits-*` files at the root
  (66 png + 117 xml + 1 jpg) moved conflict-free under
  `__tests__/output/`; no `bits-*` is left at the root.

---

## D14 — Pinned bar labels: text (glyph discussion closed by ruling)

- Status: **Withdrawn** (changed with Command 15 / D16:
  'New Item' → 'New Set', the bottom 'New set' removed)
- Old status: Draft
- Date: 2026-11-04
- Context: in Command 13 a glyph suggestion was asked for
  Export/For Sale (1st question asked, no answer came); in
  Command 14 the user decided text labels. The glyph
  discussion closed by ruling.

### Rules (historical)

- The pinned bar is three equal-width text buttons:
  'Export CSV', 'For Sale', 'New Item' (TR: "CSV'ye aktar",
  'Satılık', 'Yeni öğe'). No glyph/symbol is used.
- 'New Item' opens the item-add flow (same as +Add Item(s)
  in the bottom bar; 'New set' stays at the bottom). At a
  collection-holding level the 3rd button hides (Command 6
  policy), the bar runs with 2 buttons.
- The narrow-label slip ('Expo/rt' etc.) is known to the
  user; the fix was left to a later command.

---

## D15 — Export: CSV + Downloads save + user notice

- Status: **Final**
- Date: 2026-11-04
- Context: Command 14; xlsx + share sheet were removed.
  Verified on device (Round 6: Alert + real CSV in Downloads).

### Rules

- Format: RFC 4180 CSV (BOM + CRLF), same 15 columns;
  extension `.csv`, MIME `text/csv`.
- Save: write to cache + copy to the public Downloads
  collection through the blob-util media layer (Android
  10+ MediaStore, legacy path below). No share sheet opens.
- Notice: Alert in the browser (heading + file name; empty
  reads 'Nothing to export'; error reads heading +
  message), 2-line heading text in MarketPrice. The `xlsx`
  + `react-native-share` dependencies were removed (only
  export used them).

---

## D16 — List numbers + row tones + pinned New Set + weight bump

- Status: **Final**
- Date: 2026-11-04
- Context: Command 15; changes D14's 3rd-button rule.
- Note (Command 16/D17): the pinned 'For Sale' item changed
  (moved below as tri-state); number/tone/media/weight
  rules continue.

### Rules

- Numbering: sets + direct items in one collection share
  one dot-suffixed 1..N counter ('1.', '3.'); in-set items
  read `<setNo>.<seq>.` ('2.1.', '2.2.'). SetDetail
  applies the same rule through a nav parameter
  (`fldStrSetNumber`, carried dotless).
- Number typeface one step up: regular → Lato-Medium.
- Media: no cover/icon on set rows; cover/'no thumbnail'
  glyph on the right of item rows (toggle height). Number
  on the left.
- Row grounds: direct item unchanged (slim); set dark
  matte teal `colRowSet #1D4F4A` (light text); in-set item
  its distinct light tone `colRowMember #C2DAD4` (dark
  text `colTextOnAccent`).
- Pinned: 'Export CSV' / 'For Sale' / 'New Set' equal
  width, the bar wider via padding 16→8 + gap 8→4.
  'New Set' (EN 'New Set', TR 'Yeni Set') opens the
  set modal, also visible at collection-holding levels; in
  an empty collection the bar runs full-width with 'New
  Set' alone. The bottom 'New Set' was removed.
- Buttons: on all screens button labels go regular →
  medium, medium → bold (Lato + bold = `Lato_bold.ttf`).
  Card/row/field/dropdown-field/picker-row contents do not
  count as button labels; the camera 'Clear' text-button
  went bold.

---

## D17 — 3-state For Sale switch in the bottom bar

- Status: **Final**
- Date: 2026-11-04
- Context: Command 16; changes D16's pinned 'For Sale' item
  (top keeps 'Export CSV' + 'New Set').
- Note (Command 17/D18): the right ● dot was removed, a
  pre-switch state glyph arrived; color/position rules
  continue.

### Rules

- Placement: at a non-empty leaf level the bottom bar is
  two equal halves: For Sale control left, + Add Item(s)
  right. Empty leaf (+ Collection / + Add) and
  branch/root are unchanged; branch levels keep no
  collection-sale entry (product-based MarketPrice
  continues).
- Control: 'For Sale' label (14/20 regular, colored) +
  3-detent switch (track 56x30, thumb 24, touch 64x48) +
  a 12 dot on its right. Label + track + dot share one
  color: none pale red `#DC8F98` (left), some pale orange
  `#E0B26A` (middle), all pale green `#8FD0A0` (right).
- Derivation: units = sets with member count > 0 (marked
  when all members are marked) + all products; a product
  with no record counts unmarked (last `sale_transactions`
  row `is_active`, read with the side chain).
- Interaction: tap (half-half) + drag; the user pulls only
  to the ends (left = unmark all, right = mark all);
  middle is data-state only, takes no commit. The thumb
  always rests on the data detent.
- Apply: the collection `srvApiApplySale` (tagMinor null)
  runs directly + the list reloads; errors come as
  Alert('Sale', message); passive + spinner while saving;
  passive grey when flags are unreadable; spinner while
  loading.
- The collection-wide sale modal path was removed from the
  browser; the modal continues in MarketPrice with product
  scope.

---

## D18 — Pre-switch sale state glyph

- Status: **Final**
- Date: 2026-11-04
- Context: Command 17; changes D17's right-dot item.

### Rules

- Order: 'For Sale' label + state glyph + 3-detent switch
  (the spinner after the switch continues while saving).
- Glyph: none '✗', some '?' (only this character in Lato
  Black, `fldStrFontFamilyUiBlack`), all '✓'. Glyph
  16/20, takes the state color (passive grey included).
- '✗'/'✓' draw in the platform default face (no font
  pinned).

---

## D19 — AI provider chain: 4 steps, fixed order (audio: 2 steps)

- Status: **Final**
- Date: 2026-11-04
- Context: the main query pipe was chained to stop
  single-provider blowups in demo (changes D5's
  single-pin rule).

### Order (fixed, user's given order)

1. DeepSeek `deepseek-flash-vision-fast` (reads visuals)
2. DeepSeek `deepseek-flash-vision`
3. Muse `meta-models/muse-spark-open-1026` (Baseten)
4. Muse `muse-spark-1.3` (Meta API)

The audio chain runs only 2 legs: Baseten 1026, then Meta
`muse-spark-1.2` (1.3 rejects audio input). Gemini legs
were dropped on 2026-11-04, flagged "unavailable" (402:
empty prepayment balance); the flow never stalls.
`deepseek-v4-pro` left the flow on 2026-11-05.

### Rules

- Every step is called directly; on any step's error
  (missing key, transport, HTTP error, empty reply,
  unparsable JSON) the chain moves to the next. When the
  last step falls too, the last error rises.
- The transcribe chain has no DeepSeek leg; only 1026 +
  spark-1.2 run. Every text/vision/final stage retries the
  same 4 legs from the top; the winning leg stops the
  chain at once, never re-tested on another leg.
- When the transcribe chain exhausts, the run does not die
  (§05): the audio row writes `failed`, the photo flow
  continues.
- Every attempt joins the stage payload (provider, model,
  result, error type, duration); no secret value is
  written.
- Keys live only in Supabase secrets:
  `LOGOSPHERE_BITS_DEEPSEEK_API_KEY`,
  `LOGOSPHERE_BITS_BASETEN_API_KEY`,
  `LOGOSPHERE_BITS_MUSE_API_KEY` (Meta API key),
  `LOGOSPHERE_BITS_GEMINI_API_KEY`. Gemini is called
  with the `x-goog-api-key` header.
- The Meta API base URL arrives via
  `LOGOSPHERE_BITS_META_API_BASE_URL`.

### Open points

- None. The Meta API base URL arrived from the user; the
  Meta legs verified live (spark-1.3 text/vision,
  spark-1.2 short audio); production audio winners
  observed on Baseten 1026.
