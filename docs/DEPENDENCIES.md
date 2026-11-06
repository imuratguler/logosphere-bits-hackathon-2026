# Logosphere BITS — Dependency Record

This file is the single record of the installed/to-install
package split. Every install joins this record at its own step;
a package with no version written here is never installed.

Rules: install with exact versions (`npm install --save-exact`,
plus `--save-dev` for development); only npm updates the lock
file; `--force`, `--legacy-peer-deps`, bulk latest upgrades and
blind `audit fix` are forbidden.

Finalized 2026-11-06: 19 app + 21 development dependencies, all
exact, verified against `package.json`.

## Installed group: skeleton + dev tools (2026-10-28)

2 app + 19 development dependencies. Method: the missing/different
11 packages were aligned with `npm install --save-exact`
(1 app, 10 development); the correctly installed 10 packages were
untouched. No unpublished version, engine or peer error appeared.

dependencies:

- `react` = 19.3.1
- `react-native` = 0.88.1

devDependencies:

- `@babel/core` = 7.29.7
- `@babel/preset-env` = 7.29.7
- `@babel/runtime` = 7.29.10
- `@react-native-community/cli` = 20.2.0
- `@react-native-community/cli-platform-android` = 20.2.0
- `@react-native-community/cli-platform-ios` = 20.2.0
- `@react-native/babel-preset` = 0.88.1
- `@react-native/eslint-config` = 0.88.1
- `@react-native/jest-preset` = 0.88.1
- `@react-native/metro-config` = 0.88.1
- `@react-native/typescript-config` = 0.88.1
- `@types/jest` = 29.5.14
- `@types/react` = 19.3.0
- `@types/react-test-renderer` = 19.3.0
- `eslint` = 8.57.1
- `jest` = 29.7.0
- `prettier` = 2.8.8
- `react-test-renderer` = 19.3.1
- `typescript` = 6.0.3

Working tools: `engines.node` =
`^22.13.0 || ^24.3.0 || >=26.0.0`; actual Node v24.15.0 (range
verified with semver, `SATISFIES=true`). Scripts kept:
`android`, `ios`, `lint`, `start`, `test` as-is; added
`typecheck`, `format`, `format:write` as-is.

Verification (2026-10-28):

- `npm ls --depth=0`: 21 of 21 packages exactly on target,
  exit 0.
- All 21 packages' `engines` fields were read one by one;
  all are compatible with Node v24.15.0 (strictest
  condition `^22.13.0||^24.3.0||>=26.0.0`: react-native,
  metro-config, babel-preset, eslint-config).
- `npx react-native config`: `android/` and `ios/` roots
  visible, autolink list empty (expected: no native
  dependency).
- Android configuration identical to the RN 0.88.1 template
  (RN version unchanged); the only difference is the stable
  D3 exception `ndkVersion 30.0.16248370`; wrapper 9.4.1. No
  native compatibility change was needed.
- Checks: typecheck/lint/format exit 0, jest 1/1 passed.
- Install proof: `react@19.3.1` exit 0; 10 development
  packages in one command, exit 0 (`changed 1 package` —
  9 were already at the resolved version, spelling made exact).

## Installed group: safe area (2026-10-29)

1 app dependency. Method:
`npm install --save-exact react-native-safe-area-context@5.10.1`,
exit 0 (`added 1 package`). The existing 21 packages were
untouched; `--force`, `--legacy-peer-deps`, bulk latest
upgrades and `audit fix` were not used. No unpublished
version, engine or peer error appeared. Navigation packages
were not installed.

dependencies (added):

- `react-native-safe-area-context` = 5.10.1

Verification (2026-10-29):

- `npm ls --depth=0`: 22 of 22 packages exactly on target
  (`react-native-safe-area-context@5.10.1`; react 19.3.1,
  react-native 0.88.1 and 19 development packages unchanged).
- `package.json` dependencies: `5.10.1` bare spelling (no
  `^`/`~`).
- `npx react-native config`: dependency in the autolink list
  (`react-native-safe-area-context`); android configuration
  visible (`SafeAreaContextPackage`, `libraryName
  safeareacontext`, Fabric identifiers
  `RNCSafeAreaProvider/ViewComponentDescriptor`).
- Checks: typecheck/lint/format exit 0, jest 11/28 passed.
- No feature code was written; awaiting next instruction.

## Installed group: Supabase CLI (2026-10-29)

1 development dependency. Method:
`npm install --save-dev --save-exact supabase@2.122.0`, exit 0.
The existing 22 packages were untouched; `--force`,
`--legacy-peer-deps`, bulk latest upgrades and `audit fix`
were not used. No unpublished version, engine or peer error
appeared. The CLI is only a local development tool; mobile
runtime code never imports it, it is never installed
globally. `supabase init`, first migration, remote project
and Docker attempts are later steps' jobs; not done in this
round.

devDependencies (added):

- `supabase` = 2.122.0

Verification (2026-10-29):

- `npm ls --depth=0`: 23 of 23 packages exactly on target
  (`supabase@2.122.0`; previous 22 packages unchanged),
  exit 0.
- `package.json` devDependencies: `2.122.0` bare spelling
  (no `^`/`~`).
- `npx supabase --version`: `2.122.0`, exit 0 (no global
  install).
- Not a native group: autolink check does not apply.
- Checks: typecheck/lint/format exit 0, jest 14/43 passed.
- No feature code was written; awaiting next instruction.

## Installed group: mobile Supabase client (2026-10-31)

3 app dependencies. Method:
`npm install --save-exact @supabase/supabase-js@2.118.0
@react-native-async-storage/async-storage@3.1.1
react-native-url-polyfill@4.0.0`, exit 0
(`added 12 packages`). The existing 23 packages were
untouched; `--force`, `--legacy-peer-deps`, bulk latest
upgrades and `audit fix` were not used. No unpublished
version, engine or peer error appeared. Next step will use
client + URL polyfill + session storage together. The
Supabase CLI stays a separate development dependency;
mobile runtime code never imports that CLI package.

dependencies (added):

- `@supabase/supabase-js` = 2.118.0
- `@react-native-async-storage/async-storage` = 3.1.1
- `react-native-url-polyfill` = 4.0.0

Verification (2026-10-31):

- `npm ls --depth=0`: 26 of 26 packages exactly on target
  (3 new packages + previous 23 unchanged), exit 0.
- `package.json` dependencies: all 3 versions bare spelling
  (no `^`/`~`).
- `npx react-native config`: android + ios roots visible;
  autolink list holds `@react-native-async-storage/async-storage`
  (android configuration visible: `AsyncStoragePackage`,
  `libraryName AsyncStorageSpec`) +
  `react-native-safe-area-context`. `@supabase/supabase-js`
  and `react-native-url-polyfill` are not listed (expected:
  pure JS, no native module).
- Checks: typecheck/lint/format exit 0, jest 16/16 packages
  50/50 passed.
- No feature code was written (no client/hook/demo session);
  awaiting next instruction.

## Installed group: navigation (2026-10-31)

4 app dependencies. Method:
`npm install --save-exact @react-navigation/native@7.5.1
@react-navigation/stack@7.12.1
react-native-gesture-handler@3.4.0 react-native-screens@4.30.0`,
exit 0 (`added 18 packages`). The existing 26 packages were
untouched (`react-native-safe-area-context` 5.10.1 as-is);
`--force`, `--legacy-peer-deps`, bulk latest upgrades and
`audit fix` were not used. No unpublished version, engine or
peer error appeared; the installed peer requirement forced
no extra package. React Navigation stack will be used;
native-stack, reanimated, worklets and other navigation
packages were not added.

dependencies (added):

- `@react-navigation/native` = 7.5.1
- `@react-navigation/stack` = 7.12.1
- `react-native-gesture-handler` = 3.4.0
- `react-native-screens` = 4.30.0

Verification (2026-10-31):

- `npm ls --depth=0`: 30 of 30 packages exactly on target
  (4 new + previous 26 unchanged), exit 0.
- `package.json` dependencies: all 4 versions bare spelling
  (no `^`/`~`).
- `npx react-native config`: autolink list holds
  `react-native-gesture-handler` (android:
  `RNGestureHandlerPackage`, `libraryName
  rngesturehandler_codegen`) + `react-native-screens`
  (android: `RNScreensPackage`, `libraryName rnscreens`) +
  the previous two native packages.
  `@react-navigation/native` and `@react-navigation/stack`
  are not listed (expected: pure JS).
- Checks: typecheck/lint/format exit 0, jest 21/21 packages
  118/118 passed.
- No feature code was written; awaiting next instruction.

## Installed group: device permissions (2026-10-31)

1 app dependency. Method:
`npm install --save-exact react-native-permissions@5.6.3`,
exit 0. The existing 30 packages were untouched; `--force`,
`--legacy-peer-deps`, bulk latest upgrades and `audit fix`
were not used. No unpublished version, engine or peer error
appeared. The next step will write the camera permission flow
with this package; VisionCamera/Nitro packages were not added
in this step.

dependencies (added):

- `react-native-permissions` = 5.6.3

Verification (2026-10-31):

- `npm ls --depth=0`: 31 of 31 packages exactly on target
  (`react-native-permissions@5.6.3`; previous 30 unchanged),
  exit 0; no invalid/extra node in the tree.
- `package.json` dependencies: `5.6.3` bare spelling (no
  `^`/`~`).
- `npx react-native config`: dependency in the autolink list
  (`react-native-permissions`); android configuration
  visible (`RNPermissionsPackage`, `libraryName
  RNPermissionsSpec`).
- Later groups absent: `vision|nitro|camera|image-picker|audio|excel`
  matched nothing in the `npm ls` output.
- Checks: typecheck/lint/format exit 0.
- No feature code was written; awaiting next instruction.

## Installed group: camera/Nitro (2026-10-31)

3 app dependencies (one camera stack, installed together).
Method:
`npm install --save-exact react-native-vision-camera@5.2.3
react-native-nitro-image@0.15.2 react-native-nitro-modules@0.37.1`,
exit 0. The existing 31 packages were untouched; `--force`,
`--legacy-peer-deps`, bulk latest upgrades and `audit fix`
were not used. No unpublished version, engine or peer error
appeared; no return to the old architecture/version,
node_modules and generated CMake files were not patched.
Nitro support packages were not treated as optional. Audio
and Excel groups were not added.

dependencies (added):

- `react-native-vision-camera` = 5.2.3
- `react-native-nitro-image` = 0.15.2
- `react-native-nitro-modules` = 0.37.1

Verification (2026-10-31):

- `npm ls --depth=0`: 34 of 34 exactly (3 new + previous 31
  unchanged), exit 0; no invalid/extra/unmatched node.
- `package.json` dependencies: all 3 versions bare spelling
  (no `^`/`~`).
- `npx react-native config`: all three in the autolink list
  (android: `VisionCameraPackage`, `NitroImagePackage`,
  `NitroModulesPackage` + `RNPermissionsSpec`/`NitroModulesSpec`).
- Native compatibility (no change): `newArchEnabled=true`,
  `hermesEnabled=true`, NDK 30 exception as-is (D3).
- Installed v5 API reviewed (no code written): photo via
  `photoOutput.capturePhoto()` as in-memory `Photo`
  (`toImageAsync`/`saveToTemporaryFileAsync`/`getFileDataAsync` +
  `dispose`); the v4 `takePhoto`/`PhotoFile` pattern does not
  exist in this version. Nitro Image: `<NitroImage>`,
  `Image`/`EncodedImageData`, `loadImage`/`useImage`.
- `:app:assembleDebug` green (`BUILD SUCCESSFUL in 1m 3s`,
  exit 0); APK 191.5 MB; VisionCamera cxx modules proven in
  the build. (The first run's stderr `combine-js-to-schema-cli`
  "No modules" note is harmless codegen info; the build
  returned 0.)
- Checks: typecheck/lint/format exit 0.
- No feature code (camera screen) was written; awaiting next
  instruction.

## Installed group: gallery + local file (2026-10-31)

2 app dependencies. Method:
`npm install --save-exact react-native-image-picker@8.3.0
react-native-blob-util@0.25.1`, exit 0. The existing 34
packages were untouched (camera/Nitro versions as-is:
VisionCamera 5.2.3, Nitro Image 0.15.2, Nitro Modules
0.37.1); `--force`, `--legacy-peer-deps`, bulk latest
upgrades and `audit fix` were not used (npm's audit advice
note untouched). No unpublished version, engine or peer
error appeared. image-picker will select from the system
gallery, blob-util will prepare URI/local files; screen,
reducer and audio service were not written in this step.

dependencies (added):

- `react-native-image-picker` = 8.3.0
- `react-native-blob-util` = 0.25.1

Verification (2026-10-31):

- `npm ls --depth=0`: 36 of 36 exactly (2 new + previous 34
  unchanged), exit 0; no invalid/extra/unmatched node.
- `package.json` dependencies: both versions bare spelling
  (no `^`/`~`).
- `npx react-native config`: both in the autolink list
  (android: `ImagePickerPackage` + `RNImagePickerSpec`,
  `ReactNativeBlobUtilPackage` + `ReactNativeBlobUtilSpec`).
- Checks: typecheck/lint/format exit 0.
- No feature code was written; awaiting next instruction.
## Installed group: audio record/play (2026-11-01)

3 app + 1 development dependencies (P4 camera/gallery/audio
flow; D2's expo-audio path). Method:
`npm install --save-exact expo@58.0.22` + the official
`install-expo-modules@0.18.2 --non-interactive` installer
(native integration only; yes to the iOS version question,
no to Expo CLI integration) +
`npm install --save-exact expo-audio@58.0.11 expo-asset@58.0.19`
+ `npm install --save-dev --save-exact babel-preset-expo@58.0.23`,
exit 0. The installer wrote `~58.0.0` ranges; all were taken
back to bare constants. The existing 36 packages were
untouched (Nitro Modules 0.37.1 and the camera stack as-is);
`--force`, `--legacy-peer-deps`, bulk latest upgrades and
`audit fix` were not used (npm's audit advice notes
untouched). No unpublished version, engine or peer error
appeared. Microphone permission goes through
`react-native-permissions` (separate service; the kit's
permission helpers are not used); the Excel group was not added.

Version note: the community package failed in two attempts.
`react-native-audio-recorder-player@4.5.0` has
nitrogen-generated Kotlin expecting `nitro-modules@^0.29.2`
while installed `0.37.1` removed `updateNative`, so it cannot
compile; `5.0.0-rc.1` TurboModule spelling holds a
heterogeneous union RN 0.88 codegen rejects. Both were
removed; the camera stack's Nitro was not downgraded. Expo
SDK 58 sits on the RN 0.88 + React 19.3 line (same as the
installed stack).

dependencies (added):

- `expo` = 58.0.22
- `expo-asset` = 58.0.19
- `expo-audio` = 58.0.11

devDependencies (added):

- `babel-preset-expo` = 58.0.23

Verification (2026-11-01):

- `npm ls --depth=0`: 40 of 40 exactly (4 new + previous 36
  unchanged), exit 0; no invalid/extra/unmatched node.
- `package.json`: all 4 versions bare spelling (no `^`/`~`).
- Installer diff reviewed: `settings.gradle` +
  `build.gradle` (expo autolinking plugins),
  `app/build.gradle` (expo entry/bundle commands),
  `MainApplication`/`MainActivity` (expo wrapper),
  `babel.config.js` (`babel-preset-expo`), `metro.config.js`
  (`expo/metro-config`), iOS files (never compiled in this
  project).
- Installed expo-audio API reviewed (hookless service use):
  `new AudioModule.AudioRecorder(flattened options)` →
  `prepareToRecordAsync()` → `record()` → `stop()` (+ `uri`,
  `getStatus().durationMillis`); `createAudioPlayer({uri})`
  → `play()`/`pause()`/`remove()` + `playbackStatusUpdate`
  (`didJustFinish`); options verified one-to-one against
  the native `RecordingOptions` record (`.m4a`, 44.1 kHz,
  mono, 64 kbps, `mpeg4`/`aac`, `cache` dir).
- Holds a native module: rebuilt with P4 `run-android` and
  verified on device.

## Dropped group: Excel report (2026-11-04, final)

- The Excel report group never installed. Export shipped as
  CSV (RFC 4180 + BOM + CRLF) via the already-installed
  `react-native-blob-util` + MediaStore Downloads copy; the
  `xlsx` + `react-native-share` packages were used only by
  the old export path and were removed (D15, Command 14).
- Pending install groups at finalization: none.

No early-installed future package: none (the 2026-10-28 scan
matched no supabase/navigation/safe-area/vision-camera/nitro/audio/excel
in `package.json`).

## Verified toolchain (2026-10-28)

`:app:assembleDebug` green (`BUILD SUCCESSFUL in 10m 13s`,
60 tasks, exit 0). Incremental rebuilds also green: 58 s
(K19), 37 s (K21), 10 s (K26); exit 0, no native issue.
APK: `android/app/build/outputs/apk/debug/app-debug.apk`
(116.5 MB; minSdk 24, targetSdk 36; 4 ABIs: arm64-v8a,
armeabi-v7a, x86, x86_64).

- JDK 17.0.12 (`JAVA_HOME`; Gradle daemon JVM proven)
- Gradle 9.4.1 (wrapper)
- AGP 9.2.1 (`buildEnvironment` proven)
- Kotlin gradle plugin: requested 2.2.0, resolved 2.2.10
  (conflict resolution; build green)
- compileSdk 37 → `android-37.0` stable (aapt
  `compileSdkVersionCodename='17'`, not beta `DEV`; no
  classic `android-37` dir)
- build-tools 37.0.0; NDK 30.0.16248370 (pin + clang paths
  proven); CMake 3.22.1 (AGP choice, `CMakeCache.txt` proven)
- Node v24.15.0 + npm 11.12.1 (JS bundle included in the build)
- Beta note: this build used the stable platform; the
  `android-37.2-beta3` open preference stayed for the first
  open-build verification in D3 (no change).
- Nothing missing found; no global Java/Android setting
  changed; no `local.properties` created (environment
  variables suffice).

## Template comparison: RN 0.88.1 (2026-10-28)

The official `0.88.1` template (immutable tag; read from its
raw files in that session) was compared against the local
`android/` configuration.

| Component | Template 0.88.1 | Local | Status |
|---|---|---|---|
| `minSdkVersion` | 24 | 24 | Same |
| `compileSdkVersion` | 37 | 37 | Same |
| `targetSdkVersion` | 36 | 36 | Same |
| `buildToolsVersion` | 37.0.0 | 37.0.0 | Same |
| `ndkVersion` | 27.1.12297006 | 30.0.16248370 | Deliberate exception (D3 correction) |
| `kotlinVersion` | 2.2.0 | 2.2.0 requested, 2.2.10 resolved | Recorded resolution |
| Gradle wrapper | 9.4.1 | 9.4.1 | Same |
| AGP | 9.2.1 (plugin catalog) | 9.2.1 | Same |
| `newArchEnabled` | true | true | Kept |
| `hermesEnabled` | true | true | Kept |

- The New Architecture + Hermes layout stays as-is:
  `gradle.properties` flags, `MainActivity` fabric delegate,
  `Info.plist` `RCTNewArchEnabled`, JS bundle built with
  Hermes. Nothing changed.
- ABI choice (deliberate): the template default of 4 ABIs is
  kept (`armeabi-v7a,arm64-v8a,x86,x86_64`;
  `reactNativeArchitectures`, no filter). Reason: `arm64-v8a`
  modern device + Play 64-bit; `x86_64` emulator on this
  amd64 machine; the 32-bit pair for old-device coverage +
  zero template drift. Revisit at a release milestone (e.g.
  32-bit removal). Note: the NDK 30 + vision-camera v7a
  compiler crash forced arm64-only device builds
  (`-PreactNativeArchitectures=arm64-v8a`); the 32-bit
  production build is separate work (NDK/vision-camera
  mismatch).
- Later groups verified their native compatibility against
  this chain at their own steps. No random SDK/NDK change
  and no generated-file patch was made to silence an error.

## On-device opening proof (2026-10-29; separate from build)

Build proof is in the "Verified toolchain" section above.
This section only proves the featureless app opened on
device (K21/K24/K26).

- Device: POCO X3 Pro (M2102J20SG/vayu), Android 13 + MIUI
  14, wireless `adb`.
- Install: `adb install -r app-debug.apk` → `Success`.
  (MIUI "Install via USB" permission was opened on the
  phone; details in the session records.)
- Run: Metro v0.87.2 (`packager-status:running`) +
  `adb reverse tcp:8081 tcp:8081` +
  `am start com.logosphere.bits/.MainActivity`.
- Proof: `pidof com.logosphere.bits` returned a live pid
  (8957, 12079); screenshots showed first "Bundling..."
  (Metro link works), then the "Logosphere BITS" first screen.
- Result: opening VERIFIED. No feature was added.
