# BASE PROJECT ↔ BITS — Ana Eşleme

Bu dosya, BASE PROJECT referansıyla BITS'in ekran ve işleyiş
farklarının ana eşlemesidir. Parçalı güncelleme çalışması bu
dosyayı izler; her parça kendi commit'ini alır.

- BASE: `C:\Logosphere` (v0.11–v0.12 dosya başlıkları), **salt
  okunur referans**; dosyası, veritabanı ve Git geçmişi
  değiştirilmez. Android `applicationId`: `com.logosphere`.
- BITS: `C:\Logosphere-BITS`, Android `applicationId`:
  `com.logosphere.bits`. Bu eşleme HEAD `8d70b68` durumunu
  yansıtır.
- Kural: BITS ürün/akış kararları (SCOPE, DECISIONS) BASE
  davranışıyla çelişirse BITS kararı geçerlidir (D12).
- Telefonda BASE açılmadı; BASE gözlemleri yalnız kaynak
  okumadır. BASE ekranı "görüldü" sayılmaz.

## P0 — Kayıt durumu

- [x] Eşleme (bu dosya) + D12 + secret varlığı (adla).
- [x] P1 Gezinme + ortak sayfa düzeni (marka başlığı, altbilgi).
- [x] P2 Persona açılışı (kart + seçim kutusu + Devam).
- [x] P3 Kütüphane/koleksiyon/set/ürün ekranları.
- [x] P4 Kamera/galeri/ses akışı.
- [x] P5 AI sonuç + fiyat ekranları (istemci).
- [ ] P6 Sunucu işlevleri + uçtan uca bağlama.

## 1. Uygulama kabuğu ve gezinme

BASE (`App.tsx`, `AppNavigator.tsx`):

- Açılış: dil + `supabase.auth.getSession()`; `isLoggedIn`
  kapısı; auth deep-link (`logosphere://`) dinlenir.
- Stack-only: kapalıyken Login/Register/Signup; açıkken
  MainTabs + 17 rota. Native header her rotada ortak
  (`surface` zemin, `sax` başlık).
- MainTabs: ekran-içi 5 sekme (Üyeliklerim varsayılan +
  Yetkilerim + 3 sosyal sekme); üstte marka + mesaj/ayar/çıkış
  simgeleri; üyelik kartları (👤/🏢 + ad + tür); FAB ile
  kurum ekleme.

BITS (`App.tsx`, `navApplication.tsx`):

- Açılış: 800 ms splash + İngilizce-kilitli locale
  (`intLocale.ts`); demo istemcisi tek örnek; hata +
  retry; deep-link yok.
- 7 rotalı stack: Splash, PersonaSelection, Home,
  CollectionBrowser, LibrarySettings, CollectionSettings,
  CameraCapture. Native header başlığı kullanılmaz;
  başlıklar ekran içinden çizilir.
- Hesap modülleri gezinmeden kapalı (hiddenBoundary
  testiyle kilitli).

Eşleme:

- BITS'te login kapısı OLMAYACAK; P2'de persona açılışı
  BASE login kartı düzenine yaklaştırılır (logo + marka +
  kutu + Devam + altbilgi), auth'suz.
- Native header'a geçilmeyecek; ekran-içi başlık standardı
  korunur ve markalaştırılır (P1).
- MainTabs'un 5 sekmesi BITS'e alınmayacak (üyelik/sosyal
  demoda yok); kart + FAB + başlık-satırı desenleri
  alınacak.

## 2. Ortak düzen ve tasarım

BASE (`theme.ts`, ekran stilleri):

- Renkler: `background #1a1a2e`, `surface/card #16213e`,
  `sax #4A90D9`, `gold #e8c84a`; metin beyaz/gri.
- Fontlar: Lato ailesi + marka `EBGaramond-Medium`;
  marka başlığı 30–36 px Garamond.
- Desenler: başlık satırı (solda marka, sağda simge
  eylemler), kart satırları (simge + kalın ad + sax alt
  satır), birincil sax buton (koyu lacivert metin),
  FAB, seçim kipinde başlık + alt eylem barı.

BITS (`utlTheme.ts`, `vw*` bileşenleri):

- Jetonlar BASE ile esasen aynı (zemin/yüzey/sax/gold;
  Lato + EB Garamond Medium; K32 Android bağlaması).
- `vwButton`/`vwText`/`vwCard`/`vwProductCard`/
  `vwTextInput`/`vwSplash` hazır.

Eşleme (P1):

- Başlık standardı: "Logosphere BITS" marka metni; BITS
  small-caps görünümü fontta yok → aynı Garamond ile
  küçük boy + harf aralıklı ikinci `Text` (güvenilir
  yöntem; bold istenmez, D4/FONTS.md kısıtı).
- Uygun ekranların altına "Demo Version © 2026" altbilgi
  bileşeni eklenecek (yeni `vw*`, D6/D8).
- Launcher ikonu + ana sayfa logosu (D4) aynen korunur.

## 3. Açılış: login kartı → persona kartı

BASE (`LoginScreen.tsx`):

- Ortalanmış kart: 96 px logo + Garamond marka +
  alt yazı + ayraç + 2 input + sax buton + kayıt linki.
- Gerçek `signInWithPassword`; hata Alert'i.

BITS (`scrPersonaSelection.tsx`, `intLocale.ts`):

- Başlık + FlatList persona butonları; seçim =
  `srvApiSelectPersona` (RPC demo oturumu); parola/
  üyelik yok; ortak veri bölünmez.
- Dil İngilizce-kilitli, TR dizisi dosyada durur.

Eşleme (P2):

- BASE kart düzeni alınır, auth alınmaz: logo +
  "Logosphere BITS" + persona seçim kutusu (10 kişi,
  sunucu sırası) + Devam butonu + "Demo Version ©
  2026". "CV Meta Hackathon 2026" (seed `sort_order`
  9) açılışta seçili gelir; seçim kimlik/yetki vermez.
- TR çeviriler dosyada kalır, seçici gizli kalır;
  varsayılan görünüm İngilizce.
- `scrAccountLogin` gizli kalır; görsel referans
  yalnız P2 kartına taşınır.

## 4. Kütüphane/koleksiyon/set/ürün

BASE (`NodeBrowserScreen.tsx` + Shortcut/Settings +
`MovePickerScreen.tsx`):

- Bağlam-duyarlı tek gezgin: root/library/collection/
  set; header sağında ⚙/⋯ (bağlama göre ayar
  ekranı/set menüsü); pull-to-refresh.
- Satırlar: node/set kartı (simge + ad + ›); ürün
  kartı (AI durum noktası + kapak/emoji + `#no` +
  başlık + 📷adet). Kapak = `foto_no=1`.
- Seçim kipi: üstte "Tümünü Seç + adet", altta
  İptal/Taşı/Birleştir/Sette Birleştir/Sil.
- Ürün ekleme: koleksiyonda sorusuz kameraya gider;
  tek/set ayrımı AIResult kayıt anında sorulur.
- Alt bar: bağlama göre +Kütüphane/+Koleksiyon/
  +Ürün Ekle.

BITS (`scrHome.tsx`, `scrCollectionBrowser.tsx`,
modallar, RPC'ler):

- Home: paylaşılan kütüphaneler + hızlı oluşturma;
  browser: koleksiyon/set/ürün + seçim kipi (Select
  All/Cancel/Move/Merge/Delete) + atomik sunucu
  işlemleri + Convert All to Set + dağıtma.
- D10: yaprakta Single/Bulk sorusu kameradan ÖNCE
  sorulur; kütüphanede ürün-ekle yok.

Eşleme (P3):

- Satır/kart görselliği BASE'e yaklaştırılır (AI
  noktası + kapak + `#no` + sayaç); veri BITS
  modelinden gelir, BASE varsayımı taşınmaz.
- D10 korunur (BASE'in "kayıt anında sor" akışı
  alınmaz); seçim kipi davranışları korunur.
- Kaydet/ekle akışları mevcut RPC'lerde kalır.

## 5. Kamera/galeri akışı

BASE (`FotografCekScreen.tsx`):

- Üstte thumb paneli (sayaçlı başlık + "Temizle" +
  yatay şerit; rozetli ×/↻); altta sayaç + galeri
  📎 + ÇEK deklanşörü; vizör üstünde "Kitabı Bul"
  bindirme butonu.
- Büyük önizleme: kare sahne (contain) + alt bar
  (Geri Dön / ↻ / Sil).
- `useCameraPermission` + `capturePhotoToFile`;
  `orientationSource="device"` (fiziksel duruş;
  dosya-içi gerekçeli); dönüşler indeks-dizili.
- Ekleme kipi (`attach_item_id`): analizsiz doğrudan
  ürüne ekleme.

BITS (`scrCameraCapture.tsx`, `useDraft.ts`,
`srvImageNormalize.ts`):

- Hook sahipliğinde UUID kimlik + mod/hedef; üst
  şerit (döndür/sil + dokun-aç); büyük önizleme
  (contain + takas-kutu sığdırma + mic-reserve);
  Find Now hazır olma/görünürlük kipinde.
- `react-native-permissions` akışı + kalıcı-red
  yönlendirmesi; Nitro `toImageAsync` + canlı
  photo sahipliği; EXIF+kullanıcı dönüşlü
  normalizasyon (1280 px, JPEG %75) testli.

Eşleme (P4):

- Sayaçlı panel başlığı, "Temizle", bindirme devam
  butonu ve alt-bar yerleşimi değerlendirilir;
  UUID kimlik + izin akışı + normalizasyon korunur.
- `orientationSource="device"` BITS deklanşörüne
  taşınacak adaydır (cihazda doğrulanır).
- BASE'in indeks-dizili dönüşleri alınmaz.
- Ses (F6: görsel başına tek not + mic-reserve +
  `product_images`/`transcriptions` tabloları)
  BITS'e özgüdür; BASE'de ses YOKTUR (kaynak ve
  paket taramasıyla doğrulandı) — P4'te BITS
  kurallarıyla yazılır.

## 6. Waterfall + AI istemcisi

BASE (`KitabiBulScreen.tsx`, `aiClient.ts`,
`aiHandoff.ts`, `waterfallProgress.ts`,
`analyze-bibliographic/`):

- Akış: normalize → `temp/<session>/N.jpg`
  yükleme → Realtime `waterfall:<session>`
  aboneliği → `analyzeBibliographicPhotos` →
  AIResult. Tek/set ayrımı sonuç sayısından
  otomatik.
- Canlı rota UI: durum satırı + adım listesi
  (simge/renk/ms/detay/alanlar), otomatik kayar.
- Handoff v0.3: `storage_path` zorunlu foto
  metaları + `session_id` + model adı.
- Sunucu: 4 katman (Gemini OCR ön-okuma → web
  kaynakları ISBN→Amazon→GoogleBooks→KitapYurdu→
  NadirKitap, çekirdek-alan kapısıyla → Dewey →
  nihai TR/EN tamamlama) + broadcast + diagnostics.
- İstemcide anahtar YOK; modlar: remote/mock/
  disabled; benchmark yalnız açık istekle.

BITS:

- `srvImageNormalize.ts` (yerel) + Find Now
  (tetikleyici adayı) var; upload/AI istemcisi/
  sonuç/fiyat/kayıt istemcisi YOK.
- Tablolar hazır: `pipeline_runs`/
  `pipeline_run_images`/`pipeline_stage_errors`,
  `price_estimates`/`price_observations`/
  `sale_transactions`, `product_images`+ses,
  `transcriptions`, Dewey/Geo referansları.
- `supabase/functions/` YOK (istemci + migration
  + seed var).

Eşleme (P5 istemci, P6 sunucu):

- Akış iskeleti alınır: hazırla → yükle → canlı
  rota → sonuç → onaylı kayıt; rota UI deseni
  alınır.
- BITS uyarlamaları: görsel başına ses notu
  handoff'a girer; Muse sorguları D5 pinleriyle
  (`meta-models/muse-spark-open-1026`,
  Baseten baz URL) ilgili sunucu işlevinde;
  tek/çoklu sıra D10; fiyat + sonuç onayı BITS
  tablolarına yazılır.
- ALINMAZ: BASE endpoint adresleri, BASE secret
  adları (`GEMINI_KEY`, `DEEPSEEK_API_KEY`,
  `VERTEX_API_KEY`, `AWS_*`), login/deep-link,
  eski veri varsayımları, mock-başarı gösterimi.
- BITS secret'ları (adla doğrulandı, değer
  görülmedi/yazılmadı): `LOGOSPHERE_BITS_MUSE_API_KEY`,
  `LOGOSPHERE_BITS_BASETEN_API_KEY`,
  `LOGOSPHERE_BITS_DEEPSEEK_API_KEY`,
  `LOGOSPHERE_BITS_GEMINI_API_KEY`. Sıra
  öncelik/yedek sırası DEĞİLDİR; her anahtar
  yalnız kararlaştırılan işlevde kullanılır.

## 7. AI sonuç + fiyat ekranları

BASE (`AIResultScreen.tsx`, `MarketPriceScreen.tsx`,
`save-bibliographic/`, `analyze-market-price/`):

- Sonuç: set chipleri, rozetli thumb şeridi, kaynak
  rozeti, bölümlü satırlar (Row/BlockRow/DeweyRow),
  kayıt barı (çokluda kayıt anında set/ayrı sorusu),
  kare-sahne önizleme + dönüş-onay, Excel/log
  paylaşımı, header marquee + 📎/⚙.
- Fiyat: ISBN/başlık/yazar + para birimi chipleri +
  gold araştırma butonu + ikame/bant istatistikleri
  + gözlem listesi + güven.

BITS:

- Sonuç/fiyat ekranı YOK; `vwProductCard`/
  `vwProductDetails` + fiyat/envanter tabloları var.

Eşleme (P5):

- Bölüm/satır, chip, rozet, kayıt barı ve fiyat
  istatistik düzenleri BITS bileşenleriyle
  kurulur; metinler EN (+gizli TR); kapak kuralı
  (`foto_no=1`) BITS şemasına uyarlanır.
- Sunucu karşılığı olmayan buton çalışır
  gösterilmez (P6'ya kadar devre-dışı/bilgi).

## 8. Çeviriler

BASE (`translations.ts`): düz `tr`/`en` anahtar
haritaları + `t(key)` + AsyncStorage dil tercihi.
TR dizisi zengindir (ör. `kitabi_bul: 'Şimdi
Bul!'`, kamera/rota/kayıt/fiyat sözlüğü).

BITS (`intTranslations.ts`, `intLocale.ts`):
gruplu tipli EN/TR + açılış İngilizce kilidi.

Eşleme: BITS yapısı korunur; yeni anahtarların TR
karşılıkları BASE TR dizisinden referans alınır;
TR seçici gizli kalır.

## 9. Alınmayacaklar (açık)

- Login/signup/register akışı, deep-link, token
  işlemleri (BITS demosu RPC oturumundadır, D1).
- BASE secret adları/değerleri, endpoint adresleri,
  model zincirleri, benchmark/eval altyapısı.
- BASE veri varsayımları (book_data biçimi, node
  tipleri, `foto_no` dışında kapak kuralı).
- İndeks-dizili fotoğraf kimliği (BITS UUID).
- Sunucusuz eylemin çalışır gösterilmesi; mock
  başarının gerçek sayılması.
