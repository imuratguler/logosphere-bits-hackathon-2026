# Logosphere BITS — Font Kaydı

Bu dosya kurulu fontların tek kaydıdır. Yalnız doğrulanan dosyalar
`assets/fonts` altında tutulur; burada yazmayan font paketlenmez.

Kaynak: `D:\Downloads\Logosphere-BITS.zip` (19 TTF içerir).

Aktif kurulum (2026-10-29, K30): aşağıdaki 6 dosya arayüz + marka için seçildi.

| Dosya | Boyut (bayt) | SHA256 | nameID1 | nameID2 | Ağırlık |
|---|---|---|---|---|---|
| `Lato-Regular.ttf` | 657212 | `6F6940BE0835C3DDEC9199E5FC42BE4CBC61EBCFD58C623FDF719366253F1780` | Lato | Regular | 400 |
| `Lato-Bold.ttf` | 657188 | `BF1B8130069B44B9148EEECE35E5423BEDAC49777BA746615B826B8276574A7B` | Lato | Bold | 700 |
| `Lato-Light.ttf` | 644556 | `E9D59AFB6D9CB9CF6E8D8159D4639D5B577E29EFC64A15182F228659CFC1E818` | Lato | Light | 300 |
| `Lato-Italic.ttf` | 723544 | `8C863F833B12BC8486671D26E3A58B13B0F9EAFF1D6B10398E7C107A9B7EE05A` | Lato | Italic | 400 |
| `Lato-BoldItalic.ttf` | 699008 | `E2F9244FDCD20840F2480F91370CEA885BF99230C49D153199FA64853AD74B69` | Lato | Bold Italic | 700 |
| `EBGaramond-Medium.ttf` | 680636 | `57F9E2A5881AC1A3A7BF02935CEB604BA0CA21961FB161D7A535BAE4F74A52B1` | EB Garamond Medium | Regular | 500 |

Yedek kurulum (2026-10-29, K31): kalan 13 dosya kullanıcı tarafından aynı
klasöre kopyalandı, aynı disiplinle doğrulandı; ileride kullanılabilir.

| Dosya | Boyut (bayt) | SHA256 | nameID1 | nameID2 | Ağırlık |
|---|---|---|---|---|---|
| `Lato-Black.ttf` | 614544 | `4ED66FA3928AE769205635C916B4F9E6A63F6A77F5D9693AC31A83D0D96AE1EF` | Lato | Black | 900 |
| `Lato-BlackItalic.ttf` | 672480 | `0AE5310FE1ED156AB6AF26A8C0BE61AEE44C166896765D5A9473670AD9C28DBC` | Lato | Black Italic | 900 |
| `Lato-Hairline.ttf` | 584784 | `80DC280E8A05B80D7A566A15B379BBA422A776E5BC58B92A9B8F3A9BBEA7EB03` | Lato | Hairline | 250 |
| `Lato-HairlineItalic.ttf` | 609436 | `9E469D156B0471556F202358939CC7FD2CAB421659E3A3638136431D3C46EC8B` | Lato | Hairline Italic | 250 |
| `Lato-Heavy.ttf` | 665420 | `4CE7EC20CD9C391B271B4149AD8CF5A71301D98965403F14FC5530D017146DBB` | Lato | Heavy | 800 |
| `Lato-HeavyItalic.ttf` | 698924 | `4C9AF8DF580F1B7A2E3336D69B225A38364A636DC014D8FD9C2B72ADEA68DD2D` | Lato | Heavy Italic | 800 |
| `Lato-LightItalic.ttf` | 658212 | `8926C41622B7400D7F6F7DBF31CEA50495F31230CF40904B8B83E634BF3CF6C6` | Lato | Light Italic | 300 |
| `Lato-Medium.ttf` | 637068 | `BE8BBF7105500E8FC1F9429307FB396905A0E6CFF63FE1EB751BB319D0F1B0DB` | Lato | Medium | 500 |
| `Lato-MediumItalic.ttf` | 695588 | `0739BE048A122E3ABB0CB731B49F6C07AC212A54EB182EBAA25A65829D5AC0CF` | Lato | Medium Italic | 500 |
| `Lato-Semibold.ttf` | 669228 | `2DC5D31E2CF1E29F3430EB2DFA1BA9911E08EE401B61DD12F40E0ACB047A17A3` | Lato | Semibold | 600 |
| `Lato-SemiboldItalic.ttf` | 698028 | `0AA594079C213D1DBA417A2FC34B8170445D0F03AF02A3B35F16B9B775EEF398` | Lato | Semibold Italic | 600 |
| `Lato-Thin.ttf` | 627220 | `11B51A8BB6361BE3E4642DE40B49C210ECB4A19B8BF630F3335FF07813726F3B` | Lato | Thin | 275 |
| `Lato-ThinItalic.ttf` | 654216 | `C8AD5351E800F8286890A4C8A57D849207CB930287CAEB40C4FFBE538F2F3E0E` | Lato | Thin Italic | 275 |

Doğrulama:

- Dosya adları hedef listeyle birebir.
- Gerçek metadata `fontTools` ile name tablosundan okundu: Lato v2.015
  (2015); EB Garamond v1.002. Tüm dosyalarda ad ↔ metadata uyumlu
  (aktif 6: Regular 400, Bold 700, Light 300, Italic 400, BoldItalic 700,
  EB Garamond Medium 500; yedek 13: Thin 275, Hairline 250, Medium 500,
  Semibold 600, Heavy 800, Black 900 + italikleri).
- Kopya bütünlüğü: K30'da 6/6, K31'de 13/13 SHA256 eşleşti.
- WPF `GlyphTypeface` bu ortamda çalışmadı (yapıcı STA/bağlam hatası);
  GDI+ family adları + `fontTools` kullanıldı.

Roller:

- Lato Regular/Bold/Light/Italic/BoldItalic: arayüz yazı tipi (aktif).
- EB Garamond Medium: ilerideki canlı marka metni için paketlendi
  (logodaki metin çizilmiş olsa bile).
- Diğer 13 Lato stili: yedek (ileride kullanılabilir).

Lisans notu: zip içinde lisans metni yok; D4'teki lisanslı-kaynak esası
geçerli, ek lisans iddiası kaydedilmedi.

Android bağlama (2026-10-29, K32):

- Yöntem: elle kopya (`react-native-asset` kurulmadı; yeni paket ve
  doğrulanamayan iOS değişikliği istenmedi). Kaynak adlar korunur;
  Android tarafı RN çözümleme adlarını kullanır.
- RN 0.88.1 kuralı (kaynak koddan okundu): `fonts/<family>`
  + `""`/`_bold`/`_italic`/`_bold_italic` + `.ttf`; weight<700 →
  normal/italic dosyasına çöker.
- Eşleme (`assets/fonts` → `android/app/src/main/assets/fonts`):
  - `Lato-Regular.ttf` → `Lato.ttf` (family "Lato")
  - `Lato-Bold.ttf` → `Lato_bold.ttf`
  - `Lato-Italic.ttf` → `Lato_italic.ttf`
  - `Lato-BoldItalic.ttf` → `Lato_bold_italic.ttf`
  - `Lato-Light.ttf` → `Lato Light.ttf` (family "Lato Light"; weight 300
    normal dosyaya çökeceği için ayrı aile)
  - `EBGaramond-Medium.ttf` → `EB Garamond Medium.ttf` (family
    "EB Garamond Medium", tek stil)
- Kısıt: "Lato Light" ve "EB Garamond Medium" ailelerinde yalnız normal
  stil istenir (bold varyant yok; istenirse sistem fontuna düşer).
- Doğrulama (K32): APK içinde `assets/fonts/` altında 6 dosya listelendi;
  cihazda geçici görünümle her stil ayrı ayrı görüldü (Regular/Bold/
  Italic/BoldItalic/Light 300/EB Garamond Medium); `fontFamily:
  "Lato-Regular"` sistem fontuna düştü (negatif kontrol). Geçici görünüm
  kaldırıldı, temiz taban yeniden kurulup doğrulandı.
- iOS bağlaması yapılmadı; ekran/ikon/AI kodu bu adımın dışındadır.
