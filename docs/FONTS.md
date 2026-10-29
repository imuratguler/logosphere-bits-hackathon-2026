# Logosphere BITS — Font Kaydı

Bu dosya kurulu fontların tek kaydıdır. Yalnız doğrulanan dosyalar
`assets/fonts` altında tutulur; burada yazmayan font paketlenmez.

Kaynak: `D:\Downloads\Logosphere-BITS.zip` (19 TTF içerir; yalnız aşağıdaki
6 dosya alındı, kalan 13 dosya projeye kopyalanmadı).

Kurulum (2026-10-29, K30):

| Dosya | Boyut (bayt) | SHA256 | nameID1 | nameID2 | Ağırlık |
|---|---|---|---|---|---|
| `Lato-Regular.ttf` | 657212 | `6F6940BE0835C3DDEC9199E5FC42BE4CBC61EBCFD58C623FDF719366253F1780` | Lato | Regular | 400 |
| `Lato-Bold.ttf` | 657188 | `BF1B8130069B44B9148EEECE35E5423BEDAC49777BA746615B826B8276574A7B` | Lato | Bold | 700 |
| `Lato-Light.ttf` | 644556 | `E9D59AFB6D9CB9CF6E8D8159D4639D5B577E29EFC64A15182F228659CFC1E818` | Lato | Light | 300 |
| `Lato-Italic.ttf` | 723544 | `8C863F833B12BC8486671D26E3A58B13B0F9EAFF1D6B10398E7C107A9B7EE05A` | Lato | Italic | 400 |
| `Lato-BoldItalic.ttf` | 699008 | `E2F9244FDCD20840F2480F91370CEA885BF99230C49D153199FA64853AD74B69` | Lato | Bold Italic | 700 |
| `EBGaramond-Medium.ttf` | 680636 | `57F9E2A5881AC1A3A7BF02935CEB604BA0CA21961FB161D7A535BAE4F74A52B1` | EB Garamond Medium | Regular | 500 |

Doğrulama:

- Dosya adları hedef listeyle birebir (Lato Regular/Bold/Light/Italic/
  BoldItalic + EB Garamond Medium).
- Gerçek metadata `fontTools` ile name tablosundan okundu: Lato v2.015
  (2015); EB Garamond v1.002. Tüm dosyalarda ad ↔ metadata uyumlu
  (Light: typographic Lato/Light, 300; EB Garamond Medium: typographic
  EB Garamond/Medium, 500).
- Kopya sonrası SHA256 karşılaştırması: 6/6 eşleşti.
- WPF `GlyphTypeface` bu ortamda çalışmadı (yapıcı STA/bağlam hatası);
  GDI+ family adları + `fontTools` kullanıldı.

Roller:

- Lato (5 stil): arayüz yazı tipi.
- EB Garamond Medium: ilerideki canlı marka metni için paketlendi
  (logodaki metin çizilmiş olsa bile).

Lisans notu: zip içinde lisans metni yok; D4'teki lisanslı-kaynak esası
geçerli, ek lisans iddiası kaydedilmedi.

Bağlama durumu: henüz yapılmadı — `react-native.config.js` assets tanımı,
Android/iOS kopyası, ekran/ikon/AI kodu bu adımın dışındadır.
