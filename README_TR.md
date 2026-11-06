# Logosphere BITS (Türkçe)

Fiziksel kitap ve süreli yayınları kataloglayan Android uygulaması: nüshayı
fotoğrafla, her fotoğrafa bir ses notu ekle, katalog kanıtlı ve piyasa
fiyatlı AI tanısı al, sonra iç içe koleksiyon ve setlere kaydet.

- Kapsam: [docs/SCOPE.md](docs/SCOPE.md)
- Kararlar: [docs/DECISIONS.md](docs/DECISIONS.md)
- Kurulum (veritabanı + işlevler): [docs/SETUP.md](docs/SETUP.md)
- Bağımlılıklar: [docs/DEPENDENCIES.md](docs/DEPENDENCIES.md)
- English copy: [README.md](README.md)

## Durum (2026-11-05)

- Release APK özel release anahtarıyla imzalandı, kablosuz ADB ile kuruldu,
  Metro'suz soğuk açıldı ve işletildi.
- Uygulama kimliği `com.logosphere.bits`, sürüm 1.0 (kod 1).
- Varsayılan dil İngilizce (Türkçe dizgiler korunur).

## Mimari

- İstemci: React Native 0.88.1 + TypeScript, çıplak iş akışı, Hermes.
  Kamera/galeri çekimi, fotoğraf başına ses notu, demo persona girişi,
  klasör hiyerarşisi, aşama takibi, onay kartları, satış durumu, CSV dışa aktarımı.
- Sunucu: Supabase Postgres + dört Edge Function
  (`bits-pipeline-create`, `bits-analysis-run`, `bits-analysis-save`,
  `bits-price-research`). Sağlayıcı anahtarları yalnız sunucuda; APK'da
  yalnız herkese açık proje adresi ve anon anahtarı bulunur.
- Aşama başına AI zinciri (şemaya uygun ilk kazanan durdurur):
  DeepSeek vision fast → DeepSeek vision →
  Baseten'de `meta-models/muse-spark-open-1026` →
  Meta API'de `muse-spark-1.3`. Ses iki Muse bacağını kullanır.
  Her sağlayıcının kendi istek dönüştürücüsü vardır; bacak başına model
  kimliği, HTTP durumu, hata sınıfı ve süre kaydedilir.
- Ses-önce Waterfall: önce bağlı sesi yazıya çevir, her fotoğrafta
  görüneni ön oku (tahmini ISBN yok), deterministik kaynak waterfall'ı
  çalıştır (Open Library, Google Books, Amazon pazarları, Kitapyurdu,
  NadirKitap) ayrıntı sayfası ayrıştırma ve baskı eşleştirme ile, sonra
  nihai tanı, yerel `dewey_nodes` tablosuna karşı Dewey doğrulama, gerçek
  piyasa gözlemleri ve kullanıcı onayı öncesi duplicate incelemesi.

## Geliştirme ve altyapı

- Muse Code (Meta Muse Spark destekli) ile geliştirildi.
- Baseten, görsel okuma, transkripsiyon, nihai tanı ve fiyat yorumu için
  kullanılan `muse-spark-open-1026` bacağını barındırır.

## Demo girişi ve kurulum

1. İmzalı release APK'yı cihaza kur (kablosuz `adb install`).
2. Metro çalışmadan uygulamayı aç; giriş ekranında bir demo persona seç.
3. Çekim yolu: koleksiyon → kamera/galeri + ses → AI sonucu →
   onayla → Koleksiyona Ekle → satış durumu → CSV dışa aktar/paylaş.

## Kapılar

- `npm run typecheck`, `npm run lint`, `npm run format`, `npm test`
- `supabase/functions/` altında `deno test --allow-env --allow-net`

## Lisans

MIT — bkz. [LICENSE](LICENSE).
