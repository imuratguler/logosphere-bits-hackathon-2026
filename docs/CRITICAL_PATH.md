# Logosphere BITS — Kritik Yol Kaydi

- Tarih: 2026-11-03
- Kaynak: 4 Edge Function + 30 migration + Baseten resmi ses/vizyon
  sayfalari + gercek cihaz kanitlari (`__tests__/output`, 561 dosya)
  karsilastirmasi; kamera/ses on yuzu korunmustur.

## Dogrulanan aciklar

1. `bits-analysis-run` transcribe asamasi `engine-undecided` diye
   atlaniyordu (`supabase/functions/bits-analysis-run/index.ts`,
   eski satir 360). COZULDU (bu paket): Muse `audio_url` ile
   gercek desifre; ses yoksa cagri yok (`no-voice`).
2. Katalog asamasi yalniz ISBN normalizasyonu yapiyordu.
   COZULDU (komut 2): yerel `catalog_records` eslesme + tek
   uzak katalog (Open Library) + null/neden; kayit gorsel
   kanitina eklenir.
3. Coklu merge AI duplicate karari vermiyordu. COZULDU
   (komut 2): fiyatlar bitince ayri Muse karari + sunucu
   koruma (para birimi/baski); tek urunde asama calismaz.
4. Release yapilandirmasi debug anahtariyla imzaliyor
   (`android/app/build.gradle:108`,
   `signingConfig signingConfigs.debug`). ACIK — komut 7
   (duzgun imzali APK) kapsar; bu pakette derleme yok.

## Bu pakette biten (sesli Muse girisi)

- Pinler korundu: `https://inference.baseten.co/v1` + yalniz
  `meta-models/muse-spark-open-1026`; anahtar yalniz Supabase
  sunucusundaki `LOGOSPHERE_BITS_BASETEN_API_KEY` secret'indan
  okunur, istemciye/loga yazilmaz.
- Resmi `audio_url` bicimi; M4A/AAC sniff + 8-48 kHz +
  sure/boyut dogrulamasi; kayit basina 5 dk/25 MB, cagri
  basina 4 ses, gorsel batch 8.
- Sira: tek urunde tum sesler ilk gorsel sorgusundan ONCE;
  cokluda her ses kendi gorselinin ilk sorgusundan ONCE
  (transcribe asamasi preRead oncesi + olay zamanlari).
- Eslesme: sabit gorsel UUID + ses surumu (v1); desifre
  kullanici beyani olarak saklanir; bos kayit null, uydurma yok.
- Teknik sayaç: `fncConvMuseUsage` (istek/retry/token);
  degerler asama yukune yazilir. Bu, faturalama paneli
  degildir; ozel erisim kisisel hesaba bagli degildir.
- Canli cagri YAPILMADI (erisim bu ortamdan
  dogrulanamadigindan); tum kanitlar fixture'dir.
