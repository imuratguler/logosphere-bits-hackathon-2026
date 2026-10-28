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

## Kurulacak gruplar (beklemede, sürüm kendi adımında)

- Supabase istemci/CLI grubu — kendi aşamasında.
- Navigasyon grubu — kendi aşamasında.
- Güvenli alan (safe-area) — kendi aşamasında.
- Kamera/Nitro grubu — kendi aşamasında.
- Ses kayıt/oynatma grubu — kendi aşamasında.
- Excel rapor grubu — kendi aşamasında.

Erken kurulu gelecek paketi: yok (2026-10-28 taramasında `package.json`
içinde supabase/navigation/safe-area/vision-camera/nitro/audio/excel eşleşmedi).
