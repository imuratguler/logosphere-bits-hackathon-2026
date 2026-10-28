# Logosphere BITS — Kapsam Belgesi

- Belge sürümü: 0.1 (taslak)
- Tarih: 2026-10-28
- Durum: Onay bekliyor
- İlke: Bu belge **ne yapılacağını** tanımlar; **nasıl yapılacağını** (teknoloji yığını, dosya yapısı, kod) tanımlamaz. Kod bu aşamada yazılmaz.

## 1. Amaç

Logosphere BITS, yayın koleksiyonlarını yöneten bir Android uygulamasıdır. Kullanıcı; kütüphanesini, iç içe koleksiyonlarını, setlerini ve yayın envanterini tek yerden yönetir; kamera/galeri görselleriyle yayın tanır; görsellere ses notu ekler; Muse destekli tanılama, otomatik fiyatlama ve satış durumu takibi yapar.

## 2. Terimler

- **Yayın:** Envantere giren tekil öğe (ör. kitap, dergi, çizgi roman — nihai tür listesi açık karar).
- **Koleksiyon:** Yayınları gruplar; **iç içe** (ağaç) yapıda olabilir.
- **Set:** Birlikte anlam taşıyan yayın grubu (ör. seri, kutulu takım); bütünlük durumu takip edilir.
- **Envanter kaydı:** Bir yayının sahiplik/adet/durum bilgileridir.
- **Görsel:** Bir yayına ait kamera veya galeri fotoğrafı.
- **Ses notu:** Bir görsele eklenen ses kaydı; **görsel başına en fazla bir** ses notu bulunur.
- **Demo profili:** Hesap açmadan seçilen 8 hazır profilden biri.
- **Ortak veri:** Tüm demo profillerinin gördüğü aynı veri kümesi.

## 3. Fonksiyonel Kapsam

### F1 — Kütüphane yönetimi
- Kullanıcı yayın ekler, görüntüler, düzenler, siler (veya arşivler).
- Her yayın; koleksiyonlara ve setlere bağlanabilir.

### F2 — İç içe koleksiyonlar
- Koleksiyonlar ağaç yapısındadır (koleksiyon içinde koleksiyon).
- Kullanıcı koleksiyon oluşturur, taşır, yeniden adlandırır, siler.
- Silme/taşma kuralları (içerikle birlikte mi, içeriği koruyarak mı) uygulama aşamasında netleşir.

### F3 — Set yönetimi
- Kullanıcı set tanımlar; yayınları sete ekler/çıkarır.
- Set bütünlüğü (eksik parça) görünür olmalıdır.

### F4 — Yayın envanteri
- Adet, sahiplik durumu, fiziksel konum/raf bilgisi gibi envanter alanları tutulur.
- Nihai alan listesi açık karardır (bkz. §6).

### F5 — Görselle yayın tanıma
- Kullanıcı kamerayla çeker veya galeriden seçer; uygulama yayını tanımaya çalışır.
- Tanıma sonucu kullanıcı onayına sunulur; yanlış eşleşme düzeltilebilir.
- Tanınamayan görsel de kayda eklenebilir (manuel eşleştirme).

### F6 — Görsel başına tek ses notu
- Her görsele **en fazla bir** ses notu eklenebilir.
- Kullanıcı ses notunu dinler, yeniden kaydeder (üzerine yazar) veya siler.
- Kural: ikinci bir not, mevcut not silinmeden/üzerine yazılmadan eklenemez.

### F7 — Muse tanılama
- Yayın görselleri üzerinden Muse destekli tanılama yapılır (tanıma desteği ve/veya durum değerlendirmesi).
- Tanılama sonucu; güven düzeyi ve kısa gerekçeyle birlikte gösterilir.
- **Belirsizlik:** "Tanılama"nın tam içeriği (kimlik doğrulama, kondisyon/grade tahmini, eksik parça tespiti vb.) açık karardır (bkz. §6).

### F8 — Otomatik fiyatlama
- Uygulama, yayına tahmini fiyat önerir.
- Fiyat; manuel olarak geçersiz kılınabilir; öneri kaynağı görünür olmalıdır.
- Fiyat veri kaynağı ve para birimi kuralları açık karardır (bkz. §6).

### F9 — Satış durumu
- Her envanter kaydı için satış durumu tutulur (ör. satılık değil / satılık / satıldı — nihai liste açık karar).
- Satış durumu değişimleri kayıtta izlenebilir olmalıdır.

### F10 — Demo profilleri ve ortak veri
- Kullanıcı **hesap açmadan** 8 demo profilden birini seçerek uygulamaya girer.
- Tüm profiller **herkesle aynı veriye** erişir; profiller arası veri ayrımı yoktur.
- Profil seçimi; görünümü/deneyimi kişiselleştirebilir ama veriyi bölmez.

### F11 — Kimlik ve yetki altyapısı (demoda gizli)
- Login, üyelik, kullanıcı türleri ve yetki denetimi **ayrı modüller** olarak tasarlanır.
- Demo deneyiminde bu modüller **gizli** kalır; giriş/üyelik ekranı gösterilmez.
- Kural: Yetki kontrolleri, ilgili modüllerin içinde toplanır; iş mantığına serpiştirilmez.

### F12 — Dil
- Uygulamanın **varsayılan dili İngilizce**dir.
- Çoklu dil altyapısı planlanır; ilk ek diller açık karardır.

## 4. Demo / Tam Sürüm Görünürlük Matrisi

| Alan | Demoda | Tam sürümde |
|---|---|---|
| Kütüphane, koleksiyon, set, envanter | Görünür | Görünür |
| Görselle tanıma, ses notu | Görünür | Görünür |
| Muse tanılama, otomatik fiyatlama, satış durumu | Görünür | Görünür |
| 8 demo profili, ortak veri | Görünür | Kaldırılabilir/değişebilir (açık karar) |
| Login, üyelik, kullanıcı türleri, yetki | **Gizli** (modüller ayrı durur) | Görünür |

## 5. Kapsam Dışı

- Gerçek ödeme/sipariş altyapısı (satış durumu yalnızca durum takibidir).
- Demoda kullanıcı bazlı veri ayrımı (ortak veri esastır).
- Demoda görünür giriş/üyelik akışı.
- Bu belgede yazmayan her özellik (sonraki kapsam revizyonuna tabidir).

## 6. Açık Kararlar ve Varsayımlar

1. Teknoloji yığını — karar verildi: React Native + TypeScript, çıplak yerel Android projesi; bkz. DECISIONS.md D2 (Taslak).
2. Ortak verinin mekanizması — karar verildi: paylaşımlı arka uç (Supabase) + görünmez anonim oturum; bkz. DECISIONS.md D1 (Taslak).
3. Yayın türleri ve zorunlu/isteğe bağlı alan listesi — karar verilmedi.
4. Koleksiyon silme/taşma kuralları — karar verilmedi.
5. Set bütünlük kuralları — karar verilmedi.
6. Muse entegrasyon yöntemi ve tanılamanın tam içeriği — karar verilmedi, netleştirme gerekli.
7. Fiyat veri kaynağı, para birimi, güncelleme sıklığı — karar verilmedi.
8. Satış durumu değer kümesi — karar verilmedi.
9. Tam sürümde demo profillerinin akıbeti — karar verilmedi.
10. Hedef Android sürümleri — karar verildi: minSdk 24 / targetSdk 36 (şablon pini), derleme platformu android-37.2-beta3 + NDK 30 (kullanıcı kararı); bkz. DECISIONS.md D3 (Taslak). Cihaz gereksinimleri kurulum aşamasında netleşir.

Varsayım: Kullanıcı gereksinimleri aşamalı vermeye devam eder; her aşama yalnızca kendi işini yapar.

## 7. Kabul Kriterleri (belge düzeyi)

- Bu belgedeki her F maddesi; sonraki aşamalarda tekil doğrulanabilir işe dönüşebilir durumdadır.
- Demoda gizli modüllerin sınırları (§4) ihlal edilmez.
- Varsayılan dil İngilizce olarak doğrulanır.

## 8. Değişiklik Geçmişi

| Sürüm | Tarih | Açıklama |
|---|---|---|
| 0.1 | 2026-10-28 | İlk taslak: F1–F12, görünürlük matrisi, açık kararlar |
| 0.2 | 2026-10-28 | D1 kaydedildi: demo kimlik kararı (A); §6 madde 2 güncellendi |
| 0.3 | 2026-10-28 | D2 kaydedildi: yığın kararı (A); §6 madde 1 güncellendi |
| 0.4 | 2026-10-28 | D3 kaydedildi: sürüm seti; §6 madde 10 güncellendi |
| 0.5 | 2026-10-28 | D3 düzeltildi: NDK 30 + android-37.2-beta3; §6 madde 10 güncellendi |
