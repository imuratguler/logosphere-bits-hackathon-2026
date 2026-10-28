# Logosphere BITS

Yayın kütüphanesi, iç içe koleksiyonlar, setler ve envanter yönetimi için Android uygulaması. Görselle yayın tanıma, görsel başına tek ses notu, Muse tanılama, otomatik fiyatlama ve satış durumu takibi içerir.

- Kapsam: [docs/SCOPE.md](docs/SCOPE.md)
- Kararlar: [docs/DECISIONS.md](docs/DECISIONS.md)
- Bağımlılıklar ve araç zinciri: [docs/DEPENDENCIES.md](docs/DEPENDENCIES.md)

Yalın iskelet kurulu ve çalışıyor (özellik yok): React Native 0.88.1 + TypeScript 6.0.3 (çıplak iş akışı), New Architecture + Hermes; uygulama kimliği `com.logosphere.bits`; ilk ekran yalnız "Logosphere BITS" yazar.

Çekirdek sürümler: RN 0.88.1, React 19.3.1, Gradle 9.4.1, AGP 9.2.1, Kotlin 2.2.0, NDK 30, JDK 17, Node 24.15.0. Tam liste ve kanıtlar `docs/DEPENDENCIES.md` içindedir (tek kaynak).

Durum (2026-10-29): derleme BAŞARILI (`assembleDebug`, çıkış 0); cihazda açılma DOĞRULANDI (kurulum + Metro + ekran kanıtı). Uygulama varsayılan dili: İngilizce.
