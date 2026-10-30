# Logosphere BITS — Bağımlılık Kaydı

Bu dosya kurulu/kurulacak paket ayrımının tek kaydıdır. Her kurulum kendi adımında
bu kayda eklenir; sürüm burada yazmayan paket kurulmaz.

Kurallar: kesin sürümlerle kurulum (`npm install --save-exact`, geliştirme için
ek olarak `--save-dev`); kilit dosyasını yalnız npm günceller; `--force`,
`--legacy-peer-deps`, toplu latest yükseltmesi ve kör `audit fix` yasaktır.

## Kurulu grup: iskelet + geliştirme araçları (2026-10-28)

2 uygulama + 19 geliştirme bağımlılığı. Yöntem: eksik/farklı 11 paket
`npm install --save-exact` ile hizalandı (1 uygulama, 10 geliştirme); doğru
kurulu 10 pakete dokunulmadı. Yayımlanmamış sürüm, engine veya peer hatası çıkmadı.

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

Çalışma araçları: `engines.node` = `^22.13.0 || ^24.3.0 || >=26.0.0`;
fiilî Node v24.15.0 (semver ile aralık doğrulandı, `SATISFIES=true`).
Scriptler korundu: `android`, `ios`, `lint`, `start`, `test` aynen;
ek `typecheck`, `format`, `format:write` aynen.

Doğrulama (2026-10-28):

- `npm ls --depth=0`: 21 paketin 21'i hedefle birebir, çıkış 0.
- 21 paketin `engines` alanı tek tek okundu; tamamı Node v24.15.0 ile uyumlu
  (en sıkı koşul `^22.13.0||^24.3.0||>=26.0.0`: react-native, metro-config,
  babel-preset, eslint-config).
- `npx react-native config`: `android/` ve `ios/` kökleri görünüyor,
  autolink listesi boş (beklenen: yerel bağımlılık yok).
- Android yapılandırması RN 0.88.1 şablonuyla aynı (RN sürümü değişmedi);
  tek fark kararlı D3 istisnası `ndkVersion 30.0.16248370`; wrapper 9.4.1.
  Yerel uyum değişikliği gerekmedi.
- Kontroller: typecheck/lint/format çıkış 0, jest 1/1 geçti.
- Kurulum kanıtı: `react@19.3.1` çıkışı 0; 10 geliştirme paketi tek komutla
  çıkışı 0 (`changed 1 package` — 9'u zaten çözülmüş sürümdeydi, yazım kesinleşti).

## Kurulu grup: güvenli alan (2026-10-29)

1 uygulama bağımlılığı. Yöntem: `npm install --save-exact
react-native-safe-area-context@5.10.1`, çıkış 0 (`added 1 package`).
Mevcut 21 pakete dokunulmadı; `--force`, `--legacy-peer-deps`, toplu
latest yükseltmesi ve `audit fix` kullanılmadı. Yayımlanmamış sürüm,
engine veya peer hatası çıkmadı. Navigasyon paketleri kurulmadı.

dependencies (ek):

- `react-native-safe-area-context` = 5.10.1

Doğrulama (2026-10-29):

- `npm ls --depth=0`: 22 paketin 22'si hedefle birebir
  (`react-native-safe-area-context@5.10.1`; react 19.3.1,
  react-native 0.88.1 ve 19 geliştirme paketi değişmedi).
- `package.json` dependencies: `5.10.1` çıplak yazım (`^`/`~` yok).
- `npx react-native config`: bağımlılık autolink listesinde
  (`react-native-safe-area-context`); android yapılandırması görünüyor
  (`SafeAreaContextPackage`, `libraryName safeareacontext`, Fabric
  tanımlayıcıları `RNCSafeAreaProvider/ViewComponentDescriptor`).
- Kontroller: typecheck/lint/format çıkış 0, jest 11/28 geçti.
- Özellik kodu yazılmadı; sonraki talimat bekleniyor.

## Kurulu grup: Supabase CLI (2026-10-29)

1 geliştirme bağımlılığı. Yöntem: `npm install --save-dev --save-exact
supabase@2.122.0`, çıkış 0. Mevcut 22 pakete dokunulmadı; `--force`,
`--legacy-peer-deps`, toplu latest yükseltmesi ve `audit fix`
kullanılmadı. Yayımlanmamış sürüm, engine veya peer hatası çıkmadı.
CLI yalnız yerel geliştirme aracıdır; mobil runtime koduna import
edilmez, global kurulmaz. `supabase init`, ilk migration, uzak proje
ve Docker denemesi sonraki adımların işidir; bu turda yapılmadı.

devDependencies (ek):

- `supabase` = 2.122.0

Doğrulama (2026-10-29):

- `npm ls --depth=0`: 23 paketin 23'ü hedefle birebir
  (`supabase@2.122.0`; önceki 22 paket değişmedi), çıkış 0.
- `package.json` devDependencies: `2.122.0` çıplak yazım (`^`/`~` yok).
- `npx supabase --version`: `2.122.0`, çıkış 0 (global kurulum yok).
- Native grup değil: autolink kontrolü uygulanmaz.
- Kontroller: typecheck/lint/format çıkış 0, jest 14/43 geçti.
- Özellik kodu yazılmadı; sonraki talimat bekleniyor.

## Kurulu grup: mobil Supabase istemcisi (2026-10-31)

3 uygulama bağımlılığı. Yöntem: `npm install --save-exact
@supabase/supabase-js@2.118.0
@react-native-async-storage/async-storage@3.1.1
react-native-url-polyfill@4.0.0`, çıkış 0 (`added 12 packages`).
Mevcut 23 pakete dokunulmadı; `--force`, `--legacy-peer-deps`, toplu
latest yükseltmesi ve `audit fix` kullanılmadı. Yayımlanmamış sürüm,
engine veya peer hatası çıkmadı. Sonraki adımda istemci + URL polyfill
+ oturum saklama birlikte kullanılacak. Supabase CLI ayrı geliştirme
bağımlılığı olarak kalır; mobil runtime kodu bu CLI paketini import
etmez.

dependencies (ek):

- `@supabase/supabase-js` = 2.118.0
- `@react-native-async-storage/async-storage` = 3.1.1
- `react-native-url-polyfill` = 4.0.0

Doğrulama (2026-10-31):

- `npm ls --depth=0`: 26 paketin 26'sı hedefle birebir (3 yeni paket
  + önceki 23 paket değişmedi), çıkış 0.
- `package.json` dependencies: 3 sürüm de çıplak yazım (`^`/`~` yok).
- `npx react-native config`: android + ios kökleri görünüyor; autolink
  listesinde `@react-native-async-storage/async-storage` (android
  yapılandırması görünüyor: `AsyncStoragePackage`, `libraryName
  AsyncStorageSpec`) + `react-native-safe-area-context`.
  `@supabase/supabase-js` ve `react-native-url-polyfill` listede yok
  (beklenen: saf JS, native modül içermez).
- Kontroller: typecheck/lint/format çıkış 0, jest 16/16 paket 50/50 geçti.
- Özellik kodu yazılmadı (istemci/hook/demo oturumu yok); sonraki talimat bekleniyor.

## Kurulacak gruplar (beklemede, sürüm kendi adımında)
- Navigasyon grubu — kendi aşamasında.
- Kamera/Nitro grubu — kendi aşamasında.
- Ses kayıt/oynatma grubu — kendi aşamasında.
- Excel rapor grubu — kendi aşamasında.

Erken kurulu gelecek paketi: yok (2026-10-28 taramasında `package.json`
içinde supabase/navigation/safe-area/vision-camera/nitro/audio/excel eşleşmedi).

## Doğrulanmış araç zinciri (2026-10-28)

`:app:assembleDebug` yeşil (`BUILD SUCCESSFUL in 10m 13s`, 60 görev, çıkış 0).
Artımlı yeniden derlemeler de yeşil: 58 sn (K19), 37 sn (K21), 10 sn (K26);
çıkış 0, native sorun çıkmadı.
APK: `android/app/build/outputs/apk/debug/app-debug.apk` (116,5 MB; minSdk 24,
targetSdk 36; 4 ABI: arm64-v8a, armeabi-v7a, x86, x86_64).

- JDK 17.0.12 (`JAVA_HOME`; Gradle daemon JVM kanıtlı)
- Gradle 9.4.1 (wrapper)
- AGP 9.2.1 (`buildEnvironment` kanıtlı)
- Kotlin gradle plugin: istenen 2.2.0, çözülen 2.2.10 (çakışma çözümü; derleme yeşil)
- compileSdk 37 → `android-37.0` kararlı (aapt `compileSdkVersionCodename='17'`,
  beta `DEV` değil; klasik `android-37` dizini yok)
- build-tools 37.0.0; NDK 30.0.16248370 (pin + clang yolları kanıtlı);
  CMake 3.22.1 (AGP seçimi, `CMakeCache.txt` kanıtlı)
- Node v24.15.0 + npm 11.12.1 (JS demeti derlemeye dahil)
- Beta notu: bu derleme kararlı platformu kullandı; `android-37.2-beta3` açık
  tercihi D3'teki gibi ilk açık-derleme doğrulamasına bırakıldı (değişiklik yok).
- Eksik bulunamadı; global Java/Android ayarı değiştirilmedi; `local.properties`
  oluşturulmadı (ortam değişkenleri yeterli).

## Şablon karşılaştırması: RN 0.88.1 (2026-10-28)

Resmî `0.88.1` şablonu (değişmez etiket; bu oturumda ham dosyalarından okundu)
ile yerel `android/` yapılandırması karşılaştırıldı.

| Bileşen | Şablon 0.88.1 | Yerel | Durum |
|---|---|---|---|
| `minSdkVersion` | 24 | 24 | Aynı |
| `compileSdkVersion` | 37 | 37 | Aynı |
| `targetSdkVersion` | 36 | 36 | Aynı |
| `buildToolsVersion` | 37.0.0 | 37.0.0 | Aynı |
| `ndkVersion` | 27.1.12297006 | 30.0.16248370 | Bilinçli istisna (D3 düzeltmesi) |
| `kotlinVersion` | 2.2.0 | 2.2.0 istenir, 2.2.10 çözülür | Kayıtlı çözünürlük |
| Gradle wrapper | 9.4.1 | 9.4.1 | Aynı |
| AGP | 9.2.1 (eklenti kataloğu) | 9.2.1 | Aynı |
| `newArchEnabled` | true | true | Korundu |
| `hermesEnabled` | true | true | Korundu |

- New Architecture + Hermes düzeni aynen korunur: `gradle.properties` bayrakları,
  `MainActivity` fabric delegesi, `Info.plist` `RCTNewArchEnabled`, JS demeti
  Hermes ile üretilir. Değişiklik yapılmadı.
- ABI seçimi (bilinçli): şablon varsayılanı 4 ABI korunur
  (`armeabi-v7a,arm64-v8a,x86,x86_64`; `reactNativeArchitectures`, filtre yok).
  Gerekçe: `arm64-v8a` modern cihaz + Play 64-bit; `x86_64` bu amd64 makinede
  emülatör; 32-bit ikilisi eski cihaz kapsama + sıfır şablon sapması. Sürüm
  kilometre taşında (ör. 32-bit eleme) yeniden değerlendirilir.
- Nitro/kamera paketleri kurulmadı; kendi adımlarında bu zincirle native uyumları
  ayrıca doğrulanacak. Hata susturmak için rastgele SDK/NDK değişimi ve üretilmiş
  dosya yaması yapılmadı.

## Cihazda açılma kanıtı (2026-10-29; derlemeden ayrı)

Derleme kanıtı yukarıdaki "Doğrulanmış araç zinciri" bölümündedir. Bu bölüm
yalnızca özelliksiz uygulamanın cihazda açıldığını kanıtlar (K21/K24/K26).

- Cihaz: POCO X3 Pro (M2102J20SG/vayu), Android 13 + MIUI 14, kablosuz `adb`.
- Kurulum: `adb install -r app-debug.apk` → `Success`. (MIUI "USB ile yükle"
  izni telefonda açıldı; ayrıntı oturum kayıtlarında.)
- Çalıştırma: Metro v0.87.2 (`packager-status:running`) +
  `adb reverse tcp:8081 tcp:8081` +
  `am start com.logosphere.bits/.MainActivity`.
- Kanıt: `pidof com.logosphere.bits` canlı pid döndürdü (8957, 12079);
  ekran görüntülerinde önce "Bundling..." (Metro bağlantısı çalışıyor),
  sonra "Logosphere BITS" ilk ekranı görüldü.
- Sonuç: açılma DOĞRULANDI. Yeni özellik eklenmedi.
