# Logosphere BITS — Karar Kayıtları

Bu dosyadaki her karar, kullanıcı açıkça onaylayana kadar **Taslak** kalır.

## D1 — Demo kimlik modeli: sunucu-üretimli demo oturumu (RPC)

- Durum: **Taslak** (kullanıcı onayı ile Final olur)
- Tarih: 2026-10-28
- Bağlam: SCOPE.md F10 (hesapsız demo, 10 profil, ortak veri) ve F11 (kimlik/yetki ayrı modüllerde, demoda gizli).

### Seçenekler

- **A) Giriş göstermeden arka planda anonim Supabase oturumu.** Uygulama açılışta `signInAnonymously()` ile görünmez bir oturum açar; kullanıcı kayıt olmaz.
- **B) Tüm yazmalara tamamen açık veritabanı.** Kimliksiz, RLS'siz ortak yazma.
- **C) On gerçek hesaba gömülü parolayla giriş.** Profiller gerçek Supabase kullanıcılarına bağlı; parolalar uygulamaya gömülü.

### Karar

**A seçildi.** Somut bir teknik engel bulunamadı (doğrulama aşağıda).

### Gerekçe

- A, iki gereksinimi aynı anda karşılar: **kayıtsız demo kullanımı** ve **izlenebilir yazma** (her yazma, anonim kullanıcının `auth.uid()` değeriyle ilişkilendirilebilir).
- Profil seçimi kimlik olmaz: 10 profil yalnızca yerel bir UX tercihidir; hesap açmaz, yetki vermez, oturumu değiştirmez.
- F11 sınırına uyar: anonim oturum kimlik modülünün içinde kalır; demoda giriş/üyelik ekranı gösterilmez.
- Üyeliğe geçiş yolu açıktır: anonim kullanıcı, daha sonra bir kimlik bağlanarak (identity linking) kalıcı kullanıcıya dönüştürülebilir.
- B reddedildi: yazmalar izlenemez (kullanıcının açık gereksinimini karşılamaz), herkes her şeyi silebilir/değiştirebilir, kötüye kullanıma tamamen açıktır.
- C reddedildi: gömülü parola, istemciden sökülebilir bir sırdır (gerçek güvenlik sağlamaz); yazmalar ancak profil düzeyinde izlenir (10 kişi = 1 kimlik); parola rotasyonu eski sürümleri bozar; hesap paylaşımı üyelik modeline taşınamaz.

### Doğrulama (somut engel taraması)

Resmî Supabase belgelerine göre ([Anonymous Sign-Ins](https://supabase.com/docs/guides/auth/auth-anonymous?queryGroups=language&language=js)):

- `signInAnonymously()`; JavaScript, Flutter, Swift, **Kotlin**, Python ve C# istemcilerinde mevcuttur — yığın kararı (§6 madde 1) hangisi olursa olsun desteklenir.
- Anonim kullanıcılar kalıcı kullanıcı gibi davranır, `authenticated` Postgres rolünü kullanır; JWT içindeki `is_anonymous` bildirimi RLS politikalarında kullanılabilir.
- Anonim kullanıcı, kimlik bağlama (manual linking etkinleştirilerek) ile kalıcı kullanıcıya dönüştürülebilir.
- Uyarı olarak belgelenen nokta engel değildir, tasarım notudur: anonim kullanıcılar `authenticated` rolünü kullandığı için RLS politikaları `is_anonymous` ayrımını içermelidir.

### Sonuçlar ve kısıtlar

- Supabase projesinde "anonymous sign-ins" etkinleştirilmelidir (uygulama aşamasında).
- Ortak veri okuması tüm anonim oturumlara açıktır; yazma politikaları `auth.uid()` ilişkilendirmesi ister.
- Oturum aygıt/ilkeye bağlıdır: çıkış, veri temizliği veya yeniden kurulumda anonim kimlik kaybolur; izlenebilirlik **kurulum-oturum düzeyinde** kabul edilir.
- Ertelenen işletim konuları (engel değil, sonraki aşamaların işi): yetim anonim kullanıcı temizliği, yazma kotası/hız sınırı, kötüye kullanım politikası.
- Ağ bağımlılığı A'ya özgü değildir; ortak veri gereksinimi B ve C için de bir arka uç ister.

### Doğrulama planı (uygulama aşamasına ertelendi)

- Uygulama giriş ekranı göstermeden açılır ve görünmez oturum kurulur.
- Yapılan yazmalar anonim `auth.uid()` ile ilişkilidir.
- Profil değişimi oturumu değiştirmez ve ek yetki vermez.

### Açık noktalar

- Yok (bu karar için). Yığın seçimi ve işletim politikaları kendi aşamalarında ele alınır.

### Düzeltme (2026-10-31): anonim Auth yok, RPC demo oturumu var

İlk taslaktaki A seçeneği (`signInAnonymously()` ile görünmez Auth
oturumu, `auth.uid()` ile izlenebilirlik, `is_anonymous` RLS ayrımı,
"anonymous sign-ins etkinleştirilmeli" koşulu ve doğrulama planındaki
görünmez-oturum maddeleri) GEÇERSİZDİR ve uygulanmadı: demo yolunda
Auth hesabı açılmaz, `signInAnonymously()` çağrılmaz, `auth.users`
satırı oluşmaz, `auth.uid()` kullanılmaz.

Geçerli model (migration `20261030080608_demo_write_policy`):

- Demo kimliği = `demo_sessions` satırı: `start_demo_session(p_persona_id)`
  (SECURITY DEFINER, `anon`/`authenticated` EXECUTE) persona kimliğini
  `demo_personas`'a karşı doğrular, rastgele oturum kimliği + 24 saatlik
  bitiş üretir; iptal sunucu taraflı `revoked_at` güncellemesidir.
- İstemci kayıtsız (sessionless) `anon` rolüyle çalışır: okumalar anon
  SELECT politikalarıyla oturumsuz yapılır; yazmalar yalnız `p_session_id`
  alan SECURITY DEFINER RPC'lerle yapılır (`demo_authorize`: invalid /
  revoked / expired denetimi + `demo_permissions` hücre denetimi).
- İzlenebilirlik oturum-satırı düzeyindedir (persona + zaman); persona
  seçimi istemci-içi kalır, veriyi bölmez.
- Gerçek hesap tasarımı ayrı tutulur: `profiles`→`auth.users`,
  `organization_memberships`, `role_permissions` matrisi; demo yolu bu
  tablo/matrise hiç danışmaz (demo_authorize kural 2). Üyeliğe geçiş
  ayrı bir karardır.
- Migration yorumlarındaki eski "D1 anonymous demo" ifadeleri tarihsel
  metindir; davranış yukarıdaki gibidir.
- Ertelenen işletim konuları: süresi dolmuş demo oturumu satırlarının
  temizliği, yazma kotası/hız sınırı, kötüye kullanım politikası.

---

## D2 — Uygulama yığını: React Native + TypeScript, çıplak (bare) yerel Android projesi

- Durum: **Taslak** (kullanıcı onayı ile Final olur)
- Tarih: 2026-10-28
- Bağlam: SCOPE.md F5 (görselle tanıma, kamera/galeri), F6 (görsel başına tek ses notu), §6 madde 1 (yığın seçimi). Önceki projelere veya başka klasörlere dair varsayım kullanılmadı; yalnızca bu çalışma alanında doğrulanan araç zinciri ve aşağıda adı geçen resmî belgeler esas alındı.

### Seçenekler

- **A) React Native + TypeScript, çıplak yerel Android projesi.** `android/` dizini bize ait; Gradle/Manifest kontrolü doğrudan.
- **B) Expo geliştirme derlemesi (development build).** Yerel kod desteklenir; `android/`/`ios/` dizinleri prebuild ile üretilir.
- **C) Web uygulamasını Android kabuğunda çalıştırma.** Bize ait bir `android/` projesi ve yerel modül katmanı yoktur.

### Karar

**A seçildi.** Somut bir teknik engel bulunamadı (doğrulama aşağıda).

### Gerekçe

- Kullanıcının açık gereksinimi (özel kamera, ses kaydı, Android derlemesi üzerinde doğrudan kontrol) A'da yapısal olarak karşılanır: yerel proje, izinler ve derleme bize aittir.
- Kamera: resmî VisionCamera kurulum kılavuzuna göre kitaplık Android'de CameraX kullanır, npm ile kurulur ve **çıplak React Native** akışını doğrudan destekler (izinler `AndroidManifest.xml`'e eklenir, ardından yerel yeniden derleme) — [kurulum kılavuzu](https://visioncamera.margelo.com/docs/guides/installation).
- Ses: resmî Expo Audio belgesine göre `expo-audio`, Android'de kayıt ve oynatmayı destekler ve mevcut bir React Native uygulamasına Expo modülleri kurularak eklenebilir ("If you are installing this in an existing React Native app...") — [Expo Audio](https://docs.expo.dev/versions/latest/sdk/audio/). Topluluk kayıt kitaplıkları da A'da doğrudan kullanılabilir; kesin paket seçimi uygulama aşamasınındır.
- Araç zinciri hazır: bu alanda doğrulandı — Node v24.15.0, npm 11.12.1, JDK 17.0.12 (derleme testi geçti), Android SDK (platforms/build-tools 35–37), ADB çalışır durumda.
- B elenmedi-ama-ikinci-seçildi: geliştirme derlemeleri yerel kodlu kitaplıkları destekler, ancak yerel dizinler prebuild (CNG) ile üretilir ve yerel bağımlılık/config değişiminde `prebuild --clean` + yeniden derleme gerekir — [geliştirme derlemeleri](https://docs.expo.dev/develop/development-builds/introduction/). Bu, "doğrudan derleme kontrolü" gereksinimini A kadar karşılamaz; ayrıca SDK eşleşme bağımlılığı ve (bulut derlemede) Expo hesabı getirir. Kamera/ses yapılabilirliği B'yi elemez; kontrol düzeyi eler.
- C reddedildi: kabuk yaklaşımında bize ait yerel proje katmanı olmadığı için özel kamera ve doğrudan derleme kontrolü gereksinimi yapısal olarak karşılanamaz.
- D1 ile uyumlu: A'da Supabase JS istemcisi kullanılır; anonim oturum kararı değişmez.

### Sonuçlar ve kısıtlar

- `android/` projesinin bakımı (Gradle, Manifest, izinler, sürüm hedefleri) bizim sorumluluğumuzdadır.
- Yerel kod içeren her kitaplık eklemesi/değişimi yerel yeniden derleme ister (B'dekine benzer maliyet, ancak üretim mekanizması prebuild değil doğrudan sahiplenmedir).
- Kesin kamera/ses paketleri bu kararla onaylanmaz; adaylar (VisionCamera; expo-audio veya topluluk kaydedici) uygulama aşamasında seçilir ve doğrulanır.
- TypeScript, A'nın parçası olarak kararlaştırıldı (B'de de mümkündü; ayırt edici değildir).

### Doğrulama planı (uygulama aşamasına ertelendi)

- Yerel araç zinciriyle Android derlemesi alınır (önceki aşamada doğrulanan JDK/SDK ile).
- Gerçek cihaz/emülatörde kamera çekimi yapılır; bir görsele bir ses notu kaydedilip oynatılır (F5–F6 kabulü).

### Açık noktalar

- Yok (bu karar için). Kesin paket ve sürüm seçimleri uygulama aşamasınındır.

---

## D3 — Uyumlu sürüm seti (resmî şablon pinleri esas)

- Durum: **Taslak** (kullanıcı onayı ile Final olur)
- Tarih: 2026-10-28
- Bağlam: D2 (çıplak RN + TypeScript). İlke: **koşulsuz "en yeni" yok** — sürümler, resmî kararlı sürümün şablon pinlerinden alınır; `^` aralıkları kurulumda npm tarafından çözülüp lock dosyasına sabitlenir. Bu karar kurulum içermez.

### Seçilen sürümler

**JavaScript tarafı** (kaynak: resmî şablon `0.88.1`, [template/package.json](https://raw.githubusercontent.com/react-native-community/template/0.88.1/template/package.json)):

| Paket | Sürüm | Not |
|---|---|---|
| `react-native` | `0.88.1` (birebir) | Son kararlı yama ([releases](https://github.com/react/react-native/releases/tag/v0.88.1), 2026-10-27) |
| `react` / `react-test-renderer` | `19.3.0` (birebir) | Şablon pini; RN 0.88.1'in eşleşen React'i |
| `typescript` | `^6.0.3` (aralık) | Şablon aralığı aynen alınır; kesin sürüm lock'a yazılır |
| `@react-native/*` (babel-preset, eslint-config, jest-preset, metro-config, typescript-config, new-app-screen) | `0.88.1` (birebir) | Şablon pini |
| `@react-native-community/cli` (+ android/ios platformları) | `20.2.0` (birebir) | Şablon pini |
| `@types/react` | `^19.2.0` | Şablon aralığı |
| `jest` / `@types/jest` | `^29.6.3` / `^29.5.13` | Şablon aralığı |
| `eslint` / `prettier` | `^8.19.0` / `2.8.8` | Şablon pini |
| `react-native-safe-area-context` | `^5.5.2` | Şablonun varsayılan bağımlılığı |

Not: `@react-native/new-app-screen` ve `react-native-safe-area-context`, iskelede kullanılmadığı doğrulandığı için kaldırıldı; navigasyon aşamasında ihtiyaca göre yeniden eklenir.

**Çalışma araçları** (kaynak: RN 0.88 resmî kurulum belgesi, [Windows + Android](https://raw.githubusercontent.com/react/react-native-website/main/website/versioned_docs/version-0.88/_getting-started-windows-android.md) + şablon `engines`):

| Araç | Gerekli | Yerel durum |
|---|---|---|
| Node | `>= 22.11.0` (LTS önerilir) | v24.15.0 ✓ |
| npm | Node ile gelen (11.12.1 doğrulandı) | ✓ paket yöneticisi olarak seçildi |
| JDK | 17 önerilir (yükseği sorun çıkarabilir) | 17.0.12 ✓ (D2 öncesi doğrulandı; yükseltme yok) |

**Android tarafı** (kaynak: şablon [android/build.gradle](https://raw.githubusercontent.com/react-native-community/template/0.88.1/template/android/build.gradle), [gradle-wrapper.properties](https://raw.githubusercontent.com/react-native-community/template/0.88.1/template/android/gradle/wrapper/gradle-wrapper.properties), gradle-plugin [libs.versions.toml](https://raw.githubusercontent.com/react/react-native/v0.88.1/packages/gradle-plugin/gradle/libs.versions.toml)):

| Bileşen | Sürüm | Yerel durum |
|---|---|---|
| Gradle | `9.4.1` (wrapper otomatik indirir) | ⏳ ilk derlemede gelir, kurulum gerekmez |
| AGP (`com.android.tools.build:gradle`) | `9.2.1` | ⏳ derlemede katalogdan çözülür |
| Kotlin (`kotlin-gradle-plugin`) | `2.2.0` | ⏳ derlemede çözülür |
| Derleme platformu | `platforms;android-37.2-beta3` (API 37.1, DEV, beta 3) | ✓ kurulu (kullanıcı kararı) |
| Yedek kararlı platform | `platforms;android-37.0` (API 37.0, kararlı) | ✓ kurulu |
| `targetSdkVersion` / `minSdkVersion` | `36` / `24` (şablon pini) | ✓ `android-36` kurulu |
| `buildToolsVersion` | `37.0.0` | ✓ kurulu |
| `ndkVersion` | `30.0.16248370` (r30) | ✓ kurulu (kullanıcı kararı; şablon pini `27.1.12297006` geçersiz) |
| Platform `android-36` | API 36 | ✓ kurulu |
| CMake | şablon sabitlemiyor | ✓ 3.22.1 ve 4.1.2 kurulu |
| cmdline-tools (latest) | latest | ✓ kurulu |
| Emülatör sistem imajı | AVD için gerekli | ⚠ `system-images` boş → kurulum aşamasında (veya fiziksel cihaz) |

### Gerekçeler ve ilkeler

- RN `0.88.1`: resmî son kararlı yama; React eşleşmesi ve tüm `@react-native/*` pinleri şablondan birebir alınır, ayrıca yükseltilmez.
- TypeScript `^6.0.3`: şablon aralığı değiştirilmez; npm'in çözdüğü kesin sürüm lock dosyasına sabitlenir.
- Node `>= 22.11.0`: hem belge hem şablon `engines` aynı eşiği verir; mevcut v24.15.0 karşılar, Node değişimi gerekmez.
- JDK 17: belge açıkça önerir ve yüksek sürüm uyarısı yapar; mevcut 17.0.12 korunur.
- Gradle/AGP/Kotlin/SDK düzeyleri şablon pinleridir; "daha yenisi var" diye değiştirilmez. İki noktada kullanıcı kararı şablonu geçersiz kılar: NDK (`30.0.16248370`) ve derleme platformu (`android-37.2-beta3`).
- **Düzeltme (2026-10-28):** D3'ün ilk sürümündeki "`android-37` eksik" saptaması yanlıştı; klasik adlandırmaya dayanıyordu. SDK platformları artık alt sürümlüdür: `android-37.0` kararlı API 37.0 platformudur (ApiLevel=37.0, önizleme yok), `android-37.2-beta3` ise API 37.1 DEV beta 3'tür. Kanıt: yerel `source.properties` (`AndroidVersion.ApiLevel`, `AndroidVersion.CodeName`, `AndroidVersion.BetaVersion`) ve `sdkmanager --list_installed` çıktısı (`platforms;android-37.0`, `platforms;android-37.2-beta3`).
- Belge metni (Platform 35 + Build-Tools 36) ile şablon (compileSdk 37 + buildTools 37.0.0) çelişir; derleme ayarları için şablon pinleri esas alınır, yukarıdaki iki kullanıcı istisnası saklıdır.
- Beta platformla derleme: önizleme (DEV) API'lerine karşı derlenir; demo için kabul edildi. Beta başvurusunun kesin Gradle yazımı, kurulum aşamasındaki ilk başarılı derlemeyle doğrulanır; AGP 9.2 başvurusu ([CompileSdkSpec](https://developer.android.com/reference/tools/gradle-api/9.2/com/android/build/api/dsl/CompileSdkSpec) / `CompileSdkBetaSpec`) beta belirtim modelini doğrular. Derleme takılırsa yedek: kurulu `android-37.0` kararlı platformu.
- Sonuç: SDK bileşeni kurulumu gerekmez; açık kalan tek kalem AVD sistem imajıdır (veya fiziksel cihaz).
- Yerel paketler (kamera/ses vb.) bu karara dahil değildir; ihtiyaç doğduğunda, bu setteki RN/React ile uyumluluğu doğrulanarak eklenir.

### package-lock.json kuralı

- Paket yöneticisi: **npm** (Node ile gelen; v11.12.1 bu alanda doğrulandı).
- `package-lock.json` **yalnızca npm tarafından üretilir ve güncellenir; elle değiştirilmez.**
- Proje sürüm denetimine alındığında lock dosyası da eklenir; bağımlılık değişimleri `npm install/uninstall` ile yapılır.

### Doğrulama planı (kurulum aşamasına ertelendi)

- SDK kurulumu gerekmez (düzeltme sonrası eksik bileşen kalmadı); AVD imajı veya fiziksel cihaz sağlanır.
- Şablon bu sette kurulur; `npm ls` çakışmasız kapanır.
- Android derlemesi `android-37.2-beta3` + NDK 30 ile alınır; takılırsa yedek `android-37.0` ile tekrar denenir ve sonuç D3'e işlenir.

### Açık noktalar

- Yok (bu karar için). Kurulum, sonraki aşamanın işidir.

---

## D4 — Marka varlıkları: logo rolleri ve yazı tipi

- Durum: **Taslak** (kullanıcı onayı ile Final olur)
- Tarih: 2026-10-29
- Bağlam: görsel kimlik henüz eklenmedi (K27'de bilinçli olarak dışarıda bırakıldı). Bu karar yalnızca kaynak rollerini ve yazı tipi planını kaydeder; üretim/kurulum içermez.

### Kaynak dosyalar (doğrulanmış)

| Dosya | Boyut (bayt) | SHA256 |
|---|---|---|
| `D:\Downloads\logo_docs_BITS.png` | 536167 | `6ABC8C4877995E4C3BEDF647BCDF8E1483269AC83240DCBDD48EB3CAA4D207B6` |
| `D:\Downloads\logo_bigcanvas_BITS.png` | 197643 | `797F9DA197F1ECE62802A76388E132E762F986B235809AF8C3C0BEC8DB4F00D6` |

Doğrulama: boyut + SHA256 bu alanda okundu (2026-10-29); hash'ler gelecekteki kopya/üretim adımlarında karşılaştırma için saklanır.

### Roller

- `logo_docs_BITS.png`: ilerideki Word belgelerinde ve uygulama içindeki yazılı marka alanlarında kullanılır.
- `logo_bigcanvas_BITS.png`: Android ana ekran, apps ve drawer launcher ikonunda kullanılır.

### Seçim onayı ve inceleme (K37, 2026-10-29)

- Logo seçimi kullanıcı tarafından verildi: roller yukarıdaki gibidir;
  dosyalar birbirinin yerine kullanılmaz.
- `logo_docs_BITS.png`: 1920x2480, 536167 bayt; şeffaf zeminli (%19 tam
  şeffaf + kenar yumuşatma pikselleri); rozet + "Logosphere" yazısından
  oluşur. Küçük ekranda yazılar okunmaz → launcher olarak kullanılmaz.
- `logo_bigcanvas_BITS.png`: 2048x2048, 197643 bayt; tamamen opak
  (şeffaf piksel yok); metinsiz L + kitaplık simgesi. Küçük ekranda L
  silueti okunur, kitap detayları yumuşar; ikon kaynağı olarak uygundur.
- Yasaklar: başka logo varyantlarına kendiliğinden görev verilmez;
  görseller yeniden çizilmez; renk/kitap oranları değiştirilmez; başka
  klasördeki eski logolar kaynak sayılmaz.
- Bu turda Android kaynakları değiştirilmedi.

### Repozitori kopyaları (K38, 2026-10-29)

- `D:\Downloads\logo_docs_BITS.png` → `assets/brand/logo-docs-bits.png`
  (yazılı belge + uygulama içi logo; hash eşleşti).
- `D:\Downloads\logo_bigcanvas_BITS.png` →
  `assets/brand/logo-launcher-source.png` (launcher tek kaynağı; hash eşleşti).
- Kopya öncesi varlık + ölçü + hash D4 kaydıyla doğrulandı; kaynaklar değiştirilmedi.
- Türev kuralı: gerekli türevler yalnız bu onaylı PNG'lerden üretilir;
  esnetme yok, kitapları yeniden tasarlama yok, yazılı logoyu launcher
  için kırpma yok. Varyantlar kullanım yerleri dışına dağıtılmaz.
- Android ikon bağlama henüz yapılmadı. (K38 notu; K39'da üretildi.)

### Launcher üretimi (K39, 2026-10-29)

- Kaynak: yalnız `assets/brand/logo-launcher-source.png` (hash doğrulandı);
  `logo-docs-bits.png` launcher için kullanılmadı.
- Ölçüm: zemin `#4A90D9` (4 köşede birebir; tema `colAccentBlue` ile aynı);
  simge kutusu %29-71 x, %25-75 y; merkezden en uzak nokta %31,6 → 66dp
  güvenli dairenin (%33) içinde; tüm maskelerde kesilme yok.
- Çıktılar: 5 yoğunluk × legacy (kare + çember kırpımlı round) + 5
  adaptive foreground + `mipmap-anydpi-v26` XML'leri + `colors.xml`.
  Kareden kareye LANCZOS; esnetme/çizim yok; yeniden-birleşim farkı 0,22.
- Cihaz kanıtı (K39/K40): drawer + ana ekran "AI & Apps" klasöründe mavi
  L + BITS ikonu kesilmeden görüldü (squircle maske, ekran görüntüleri).

### Logo değişimi (Komut14, 2026-11-04)

- Yeni kaynaklar (ölçüler eskilerle birebir; oranlara dokunulmadı,
  piksel-kopya, transform yok):
  - `D:\Downloads\Logosphere_BITS_L.png` (2048x2048, 333693 bayt,
    SHA256 `40D6408C…F6A1F3`) → `assets/brand/logo-launcher-source.png`
    (hash eşleşti).
  - `D:\Downloads\Logosphere_BITS_Logo.png` (1920x2480, 542795 bayt,
    SHA256 `C2E311F1…68465`) → `assets/brand/logo-docs-bits.png`
    (hash eşleşti; %19,6 şeffaf).
- L ölçüm: zemin `#4A90D9` (4 köşe; opak, şeffaf piksel yok); simge
  kutusu %29,9-77,4 x, %28,9-70,8 y; merkezden en uzak sanat pikseli
  687px (%33,5). Eski sanat 647px (%31,6) idi; D4 cetveli (%33 ≈
  676px) ve katı 66dp (626px) ile her iki sanat da sınırda/dışında —
  yeni tasarımda ~11px daha dışta; katı daire maskelerde en uç
  piksellerde hafif kesilme olabilir. Kullanıcının tasarımı aynen
  uygulandı (küçültme/büyütme ayarları kullanıcıda).
- Mipmap tarifi (K39 yöntemi mevcut res'ten tersine doğrulandı):
  legacy LANCZOS (MSE 0,0 birebir), round sert daire maskesi (alfa
  farkı 0 birebir), foreground ölçekle-sonra-keyle tolerans 52
  (bbox ±2px, görsel halo yok). 5 yoğunluk × 3 dosya yeniden
  üretildi (15 PNG); XML/renk değişmedi.
- Uygulama içi `vwLogo` yeni docs logosunu derlemeyle alır.
- Not: değişim öncesi repo launcher dosyası 89791 bayttı; D4'teki
  197643 baytlık eski kayıtla uyuşmuyordu (tek commit, ağaç temiz)
  — eski kayıt şüpheli olarak işaretlendi, yeni gerçek değerler
  yukarıdadır.

### Yazı tipi

- EB Garamond Medium; `assets/fonts` altında kurulacak; lisanslı kaynaktan alınacak (Lato benzeri lisans disiplini).
- Kurulum: K30'da 6 dosya kuruldu, K31'de kullanıcı 13 yedek ekledi
  (toplam 19 TTF `assets/fonts` altında, tümü doğrulandı); ayrıntı ve
  hash'ler `docs/FONTS.md` içindedir (tek kaynak). Bağlama: K32'de
  Android'e elle bağlandı (ayrıntı FONTS.md); iOS bağlaması yok.

### Sonuçlar ve kısıtlar

- Henüz ikon üretilmedi; launcher ikonu üretimi sonraki aşamanın işidir.
- Kaynak dosyalar proje dışındadır (`D:\Downloads`); projeye kopyalanmadı.
- Görsel kimlik bu kararla bitmiş sayılmaz; yalnızca roller + font planı taslak olarak kaydedildi.

### Açık noktalar

- Yok (bu karar için). İkon üretimi ve font kurulumu sonraki aşamalardadır.

---

## D5 — AI sağlayıcı erişimi: Baseten üzerinden Muse Spark

- Durum: **Taslak** (kullanıcı onayı ile Final olur)
- Tarih: 2026-10-29
- Bağlam: SCOPE.md F7 (Muse tanılama) ve §6 madde 6 (Muse entegrasyon yöntemi — bu kararla kapanmaz, yalnızca sağlayıcı erişimi sabitlenir).

### Baseten yanıtı (kullanıcıdan gelen, kayda aynen geçirildi)

- Özel anahtar kişisel hesaba bağlanamıyor.
- Bu iş akışında resmî kullanım izlenemiyor.
- Kullanıcıya ücret çıkmayacak.

### Yorum kuralı

- Bu erişim, ayrı ücretli bir entity veya görünür 100 USD bakiyesi varmış gibi yorumlanmaz.

### Kabul edilen pinler

- Yalnız model: `meta-models/muse-spark-open-1026`.
- Yalnız baz URL: `https://inference.baseten.co/v1`.
- Başka Baseten modeli/ürünü açılmaz.

### Anahtar disiplini (bu aşama)

- Bu karar-kaydı aşamasında anahtar istenmez, görülmez, canlı çağrı yapılmaz.
- Anahtar/token oturum kayıtlarına yazılmaz (Standard Session ToDo.md §2 zaten yasaklar).

### Sonraki sağlayıcı aşaması

- Tek küçük canlı test + yerel teknik sayaç kullanılır.
- Meta hesabının maliyeti ayrı tutulur.

### Açık noktalar

- Testin içeriği ve zamanı sonraki sağlayıcı aşamasınındır.
- §6 madde 6 açık kalır: entegrasyon yöntemi ve tanılama içeriği henüz kararlaştırılmadı.

---

## D6 — Programcı İsimlendirmeleri (TypeScript naming)

- Durum: **Taslak** (kullanıcı onayı ile Final olur; içerik kullanıcı diktesidir)
- Tarih: 2026-10-29
- Bağlam: projenin okunabilirliği, bakımı ve yapay zeka tarafından hatasız üretilmesi. Tüm TypeScript `interface`, `type`, `class`, `enum`, `const` ve `function` tanımlamaları için geçerlidir.

### İngilizce kuralı

- Alan adları ve kod içi tüm tanımlayıcılar İngilizce yazılır (`temporary`/`temp`, asla `gecici` vb.).

### Hiyerarşi (zorunlu, %100 uyum)

1. RENKLER (kök: `col`) — sistem, tema ve UI renkleri.
   - Örnekler: `colBackground1`, `colBackground2`, `colSuccess1`, `colDanger`, `colNavy`, `colSilver`
2. GÖRÜNÜMLER VE BİLEŞENLER (kök: `vw`) — sayfalar, modüller, kartlar, düzenler, butonlar, tüm UI bileşenleri.
   - Örnekler: `vwItemCard`, `vwNavbar`, `vwDashboardLayout`, `vwMainList`, `vwSubmitBtn`
3. LABELS / ETİKETLER (kök: `lab`) — metin etiketleri, başlıklar, açıklama/placeholder/tooltip metinleri.
   - Örnekler: `labItemTitle`, `labFormErrorHeader`, `labInputPlaceholder`, `labWelcomeMessage`
4. ALANLAR VE VERİ MODELLERİ (kök: `fld`) — nesne özellikleri, DB alanları, form input veri yapıları. `fld` + 3 harfli tip kırılımı:
   - A) Date (`fldDat`): `fldDatPublishDate`, `fldDatUpdatedTime`
   - B) Metin (`fldStr`): `fldStrItemName`, `fldStrDescription`, `fldStrUserEmail`
   - C) Sayısal (`fldNum`): `fldNumPrice`, `fldNumStockCount`, `fldNumDiscountRate`
   - D) Boolean (`fldBoo`): `fldBooIsActive`, `fldBooHasDiscount`, `fldBooIsDeleted`
   - E) Nesne/Dizi (`fldObj`/`fldArr`): `fldObjMetaData`, `fldArrTags`
5. SERVİSLER VE API KATMANI (kök: `srv`) — API istekleri, HTTP istemcileri, entegrasyonlar, yönlendiriciler, servis sınıfları/fonksiyonları. Kesinlikle `svc` KULLANILMAZ, daima `srv`.
   - A) Veri çekme/yazma (`srvApi`): `srvApiGetProduct`, `srvApiUpdateUser`
   - B) Storage (`srvStor`): `srvStorSetToken`, `srvStorGetTheme`
   - C) Kimlik doğrulama (`srvAuth`): `srvAuthLogin`, `srvAuthLogout`
   - D) Navigator (`srvNav`): `srvNavToDashboard`, `srvNavGoBack`
6. AKSİYONLAR VE EVENTLER (kök: `act`) — kullanıcı etkileşimleri, tetikleyiciler, state değişimleri, event handlerlar.
   - A) Handler (`actHand`): `actHandOnClick`, `actHandOnSubmit`, `actHandOnChange`
   - B) Redux yönetimi (`actSet`/`actRdx`): `actSetLoadingState`, `actRdxCartReducer`
7. FONKSİYONLAR VE İŞ MANTIĞI (kök: `fnc`) — saf iş mantığı, hesaplamalar, veri manipülasyonu.
   - A) Hesaplama (`fncCalc`): `fncCalcTotalPrice`, `fncCalcTaxAmount`, `fncCalcDiscount`
   - B) Conv (`fncConv`): `fncConvJsonToXml`, `fncConvStringToNumber`, `fncConvArrayToMap`
   - C) İş mantığı/akış (`fncRun`): `fncRunOrderPipeline`, `fncRunUserActivation`
8. DOĞRULAMA VE KURALLAR (kök: `vld`) — form validasyonları, iş kuralı kontrolleri, şema doğrulamaları.
   - A) Mantıksal kontrol (`vldChg`): `vldChgIsEmailValid`, `vldChgIsPasswordStrong`
   - B) Kompleks şemalar (`vldSch`): `vldSchProductSchema`, `vldSchUserFormSchema`
9. YARDIMCI ARAÇLAR (kök: `utl`) — domain bağımsız saf yardımcılar.
   - A) Date (`utlDat`): `utlDatFormatToDays`, `utlDatGetTimeAgo`
   - B) Metin (`utlStr`): `utlStrConvertToSlug`, `utlStrTruncateText`
   - C) Sayı/finans (`utlNum`): `utlNumFormatCurrency`, `utlNumAddLeadingZeros`
   - D) Nesne/dizi (`utlObj`/`utlArr`): `utlObjDeepClone`, `utlArrRemoveDuplicates`

### AI kod üretim ve denetim kuralları

- Hiyerarşiyi ihlal eden bir isimlendirme görülürse (örn. `fetchData`, `validateEmail`, `formatDate`, `setIsActive`, `onButtonClick`, `CnvJson`), kod yazılmadan önce kullanıcı uyarılır ve doğrusu kullanılır.
- Kuralın işletimi `Standard Session ToDo.md` §3'te de kayıtlıdır (tek kaynak bu D6 kaydıdır).

### İstisnalar (çerçeve zorunluluğu, K35)

- Bileşen tanımları D6-saf küçük harfle yazılır (`vwText`); JSX büyük harf
  zorunlu olduğundan kullanım yerinde büyük-harf alias kullanılır
  (`import { vwText as VwText }`). Alias, JSX zorunluluğunun istisnasıdır.
- Üçüncü parti / çerçeve API adları D6 dışındadır ve yeniden adlandırılmaz:
  React (`children`, `createElement`), React Native (`Text`, `StyleSheet`,
  stil özellikleri), jest (`test`, `describe`), paket import adları.

### Açık noktalar

- Yok (bu karar için).

---

## D7 — Set modeli: koleksiyona bağlı ayrı sets tablosu + yayınlarda set_id

- Durum: **Taslak** (kullanıcı onayı ile Final olur)
- Tarih: 2026-10-29
- Bağlam: SCOPE.md F1 (yayınlar setlere bağlanabilir), F3 (set tanımı, üye ekleme/çıkarma, bütünlük görünürlüğü). "Yayın" SCOPE terimidir (istekteki "ürün" ile aynı öğe).

### Seçenekler

- **A) Ayrı `sets` tablosu (koleksiyona bağlı) + yayınlarda `set_id`.** Set birinci-sınıf kayıttır; ad, üyeler ve toplam fiyat set düzeyinde ayrı yönetilir. Üyelik FK ile bütünlüklüdür; yeniden adlandırma tek satırdır; RLS tablo başına yazılır (D1 deseniyle uyumlu). Bedeli: bir tablo + bir FK; üye listesi join ister; bir yayın aynı anda tek sette olabilir (1:N).
- **B) Seti özel bir ürün gibi saklama.** Tek tabloyla daha az parça, ancak karışık anlambil: set satırları tür bayrağı unutulan her sorguda ürün listelerine karışır; toplam fiyat ya hesaplanır ya da anlamı kaymış bir sütunda saklanır; "ayrı yönetim" zedelenir.
- **C) Yalnız metin etiketleriyle gruplama.** Şemasız ve esnek, ancak bütünlüksüz: yazım hatası ayrı grup üretir; yeniden adlandırma toplu yazmadır; set adı/toplam/bütünlük için etiket dışı mekanizma şarttır; F3'ün "set tanımlar" eylemi tanımsız kalır.

### Karar

**A seçildi** (kullanıcı tercihi; değerlendirme uyumlu).

### Gerekçe

- F3 birinci-sınıf set ister: tanım, üye ekleme/çıkarma ve bütünlük görünümü, set düzeyinde alanlar olmadan kurulamaz.
- Ad, üyeler ve toplam fiyat ayrı yönetilir: ad `sets` sütunu; üyeler `set_id` üzerinden sorgulanır/sayılır; toplam set düzeyinde ele alınır.
- Bütünlük (eksik parça) üyelikten hesaplanabilir; C'de bu zemin yoktur, B'de tür koşuluna gömülür.
- B'nin sessiz-hata sınıfı (bayrak unutulması) ve C'nin bütünlüksüzlüğü elendi.

### Sonuçlar ve kısıtlar

- `sets` koleksiyona bağlıdır; yayın `set_id` ile tek sete bağlanır (1:N).
- Tablo ve ekran oluşturma bu kararın dışındadır; kendi adımlarında yapılır.
- Toplam fiyatın saklanan sütun mu hesaplanan değer mi olacağı tablo adımında netleşir.

### Açık noktalar

- F1'deki "setlere" çoğul okunuşu: bir yayının aynı anda birden çok sette olması gerekirse A birleşim (junction) tablosuyla genişletilir; bu ayrı bir karardır, şu an kapsamda böyle bir gereksinim yoktur.
- SCOPE §6 madde 5 (set bütünlük kuralları) hâlâ açıktır; bu karar kapatmaz.

---

## D8 — Dosya Adlandırmaları: klasör önekleri

- Durum: **Taslak** (kullanıcı onayı ile Final olur; içerik kullanıcı diktesidir)
- Tarih: 2026-10-30
- Bağlam: D6 kod içi tanımlayıcıları kapsar; bu kayıt dosya adlarını kapsar. İkisi birlikte adlandırma sisteminin tamamıdır.

### Kurallar

Her klasörün dosyaları kendi önekiyle başlar. Klasör henüz yoksa, açıldığında yeni dosyalar aynı düzende adlandırılır.

| Klasör | Önek | Örnekler |
|---|---|---|
| `assets` | `ast` | `astBanner.jpg`, `astLogo.png` |
| `components` | `vw` | `vwButton.tsx`, `vwCard.tsx`, `vwEmptyState.tsx`, `vwLoading.tsx`, `vwLogo.tsx`, `vwSplash.tsx`, `vwText.tsx`, `vwTextInput.tsx` |
| `config` | `cfg` | `cfgFlags.ts`, `cfgSupabase.ts` |
| `constants` | `con` | `conAppLimits.ts`, `conRegexPatterns.ts` |
| `contexts` | `ctx` | `ctxAuth.tsx`, `ctxThemeMode.tsx` |
| `hooks` | `hok` | `hokAuth.ts`, `hokDebounce.ts`, `hokFetchData.ts` |
| `i18n` | `int` | `intLocale.ts`, `intTranslations.ts` |
| `navigation` | `nav` | `navApplication.tsx` |
| `screens` | `scr` | `scrSearchItem.tsx`, `scrLogin.tsx` |
| `services` | `srv` | `srvMembership.ts`, `srvPayment.ts`, `srvUser.ts` |
| `types` | `typ` | `typModels.ts` |
| `utils` | `utl` | `utlTheme.ts` |
| `validation` | `vld` | `vldDetails.ts`, `vldHierarchy.ts`, `vldMembership.ts` |

### Kapsam notları

- Dosya adı ile kod içi tanımlayıcı ayrı düzlemlerdir: önek kuralı dosya adını bağlar, dosya içindeki export'lar D6'ya uyar.
- K70'te uygulandı: `config`, `i18n`, `types`, `utils`, `validation` yeniden adlandırıldı; `components` zaten uygundu.
- `constants`, `contexts`, `hooks`, `navigation`, `screens`, `services` henüz yok; açıldıklarında bu önekler kullanılır.
- `__tests__` dosya adları bu kararın dışındadır.

### Açık noktalar

- Yok (bu karar için).

---

## D9 — Referans tablolar anonim okumaya açıldı; veri sorumluluğu kullanıcıda

- Durum: **Taslak** (kullanıcı onayı ile Final olur; içerik kullanıcı kararıdır)
- Tarih: 2026-10-30
- Bağlam: K75 kapalı duruşu bu kararla gevşetildi; K84 kapıları (B1/B2 aktarım engelleri) proje-tarafı aktarım yapılmadığı için aynen durur; B3/B4 erişim kararları bu kayıtla kapanır.

### Karar

- `public.dewey_nodes` ve `public.geo_nodes` giriş yapmamış istemcilerce okunabilir: yalnız `anon` rolüne SELECT hibesi + tablo başına `FOR SELECT TO anon USING (true)` politikası (`dewey_nodes_anon_read`, `geo_nodes_anon_read`).
- RLS iki tabloda da açık kalır. `anon` için INSERT/UPDATE/DELETE veya başka yetki açılmaz; `authenticated` rolüne bu turda hibe verilmez (uygulamada auth akışı yok; gelince yeniden değerlendirilir).
- Diğer tabloların izinleri, referans satırlar ve `geo_nodes.postal_code` değerleri değişmez.

### Veri sorumluluğu

- Uzak tablolardaki 35.293 Dewey + 233.001 Geo satırı 2026-10-30'da `supabase/transfers/live_reference/transfer.py` ile Logosphere v1.0 projesinden kopyalandı (kaynak salt-okunur SELECT, 2.000'lik atomik doğrulanmış partiler, deterministik UUID eşlemesi; ayrı oturum kaydı `Logosphere BITS, 20261030_153216_TST.MD`). Dosya-tabanlı aktarım betikleri (`supabase/transfers/dewey/`, birleşik Geo SQL) ve `Geo_Load_for_BITS.sql` çalıştırılmadı.
- Yüklenen verinin kaynağı (Logosphere v1.0 projesi), kullanım hakkı ve doğruluğu kullanıcı sorumluluğundadır. Herkese açık dağıtım için hak beyanları çözülmüş sayılmaz. K73/K74 dosya kapıları, dosya-tabanlı aktarım yapılmadığı için kayıt olarak durur; K84'ün "yalnız Geo-global" kısıtı bu yüklemeyle aşılmıştır (tam veri kullanıcı yönlendirmesiyle yüklendi).
- Aktarım betikleri (`supabase/transfers/dewey/`, birleşik Geo SQL) gelecekteki doğrulanmış yüklemeler için korunur; bu verilerle çalıştırılmadı.

### service_role rotasyonu (ertelendi)

- K86'da oturum transcript'ine düşen legacy `service_role` JWT parçası için rotasyon önerisi kullanıcı kararıyla ERTELENDİ; çözülmüş sayılmaz.
- Bu turda anahtar istenmedi, görülmedi, gösterilmedi.

### Açık noktalar

- Yükleme anında aktarma betiği tekillik/öksüz/kök sayılarını doğruladı (dewey 10 kök, geo 250 kök, öksüz 0); kaynakta üst-kimliği çocuk-kimliğinden küçük olduğundan döngü yapısal olarak dışlanır. Artık not: denetlenen SQL dosyası 35.292 tuple içerirken kaynak VT 35.293 satır tutar (dosya 1 satır geride).
- `authenticated` rolü için okuma hibesi, ilk auth akışıyla birlikte kararlaştırılacak.

### Yeniden değerlendirme (2026-10-31): auth akışı geldi

- Gizli gerçek-hesap akışı (login/kayıt) bu tarihte istemciye girdi;
  yukarıda ertelenen `authenticated` hibeleri migration
  `20261031191911_account_core_and_demo_rejection` ile tanındı:
  `profiles` üzerinde politika-bağlı SELECT/INSERT/UPDATE (yalnız
  kendi satırı), `organizations`/`organization_memberships`
  üzerinde politika-bağlı SELECT (yalnız üyesi olunan),
  `account_upsert_profile`/`account_create_organization`/
  `account_assign_role` RPC'lerinde EXECUTE. `anon` rolüne bu
  turda da hibe verilmedi; demo yolu değişmedi.

## D10 — Ürün ekleme kipi: Single Item + Bulk Items (A seçeneği)

- Değerlendirme (2026-10-31): A) Single Item aynı fiziksel
  yayının birden fazla fotoğrafıdır; Bulk Items görsel başına
  aday üretir ve eşleşenler sonradan duplicate kontrolüyle
  birleştirilir. B) her fotoğrafı koşulsuz ayrı ürün sayar.
  B, aynı yayın birden çok açıdan çekildiğinde sahte ürün
  şişmesi üretir ve birleştirme yükünü kullanıcıya yıkar; A,
  fiziksel gerçekliği (bir yayın, N fotoğraf) korur ve fazlalığı
  sunucu tarafı duplicate kontrolüne bırakır. A seçildi.
- Kurallar: çekim girişi yalnız uygun yaprak koleksiyondadır
  (alt koleksiyonu olmayan koleksiyon); kütüphane kökünde ürün
  ekle butonu olmaz. Single Item ve Bulk Items aynı kamerayı
  farklı `fldStrCaptureMode` (`single` | `bulk`) ile açar; kip
  girişte bir kez seçilir, analiz başlamadan ikinci kez
  sorulmaz. Kamera hazır olana dek butonlar devre dışı-görünür
  durur; dokunulabilir-ama-işlemsiz bırakılmaz.

## D11 — Kamera çekim onayı: her yayın çekiminde ara soru

- Kameranın bir yayını (kitap, dergi vb.) çekmesine her ihtiyaç
  duyulduğunda, çekimden önce o iş özelinde ara soru ile onay
  alınır; tek seferlik genel onay biriktirilmez. Onaysız çekim
  yapılmaz, çekim testi yapılmış gibi raporlanmaz.

---

## D12 — BASE PROJECT referansı salt okunurdur; BITS kararları önceliklidir

- Durum: **Taslak** (kullanıcı onayı ile Final olur)
- Tarih: 2026-11-01
- Bağlam: `C:\Logosphere` (BASE PROJECT) ekran/işleyiş
  referansı olarak incelenir.

### Kurallar

- BASE PROJECT yalnız okunur: dosyaları, veritabanı ve
  Git geçmişi değiştirilmez. Telefonda BASE açılacaksa
  önce kendi `applicationId` değeri (`com.logosphere`)
  doğrulanır; `com.logosphere.bits` komutu BITS'i açar.
- BASE'den alınan tasarım/akış, BITS adlandırma (D6/D8),
  veri modeli, API işleyişi, ortak demo alanı ve güvenli
  sunucu çağrısı düzenine uyarlanır.
- BITS için verilen güncel ürün ve akış kararları
  (SCOPE, D1–D11 ve sonrası), BASE'de farklı bir
  davranış varsa önceliklidir.
- Ekran/işleyiş eşlemesi `docs/BASE_MAPPING.md` ana
  kaydında tutulur; gerçekten gözlemlenmeyen BASE
  ekranı görüldü sayılmaz.

---

## D13 — Test dosyaları: köke yazılmaz, `__tests__/output` tek adrestir

- Durum: **Taslak** (kullanıcı onayı ile Final olur)
- Tarih: 2026-11-02
- Bağlam: kullanıcı diktesi; test kanıtlarının app kökünü
  kirletmesi yasaklandı.

### Kurallar

- Ekran görüntüleri, UI dökümleri ve geçici test
  betikleri (`bits-*` dahil) app köküne yazılmaz;
  yalnız `__tests__/output/` altında oluşturulur.
- Yeni test dosyaları da `__tests__/output/` altında
  oluşturulur (jest varsayılan keşfi bu alt klasörü
  kapsar; mevcut süitler yerinde kalır).
- `__tests__/output/` commit dışıdır: push öncesi
  `git status` ile seçili ekleme yapılır, kanıt
  dosyaları commite alınmaz.
- 2026-11-02'de kökteki 184 `bits-*` dosyası
  (66 png + 117 xml + 1 jpg) çakışmasız şekilde
  `__tests__/output/` altına taşındı; kökte
  `bits-*` kalmadı.

---

## D14 — Pinned çubuk etiketleri: metin (glif görüşmesi hükmen kapandı)

- Durum: **Yürürlükten kalktı** (Komut15 / D16 ile değişti:
  'New Item' → 'New Set', alttaki 'New set' kalktı)
- Eski durum: Taslak (kullanıcı onayı ile Final olur)
- Tarih: 2026-11-04
- Bağlam: Komut13'te Export/For Sale için glif önerisi istendi (1.
  soru soruldu, cevap gelmedi); Komut14'te kullanıcı metin
  etiket kararı verdi. Glif görüşmesi hükmen kapandı.

### Kurallar

- Pinned çubuk üç eşit genişlikte metin düğmedir: 'Export CSV',
  'For Sale', 'New Item' (TR: "CSV'ye aktar", 'Satılık',
  'Yeni öğe'). Glif/symbol kullanılmaz.
- 'New Item' öğe-ekleme akışını açar (alt çubuktaki +Add Item(s)
  ile aynı; 'New set' altta kalır). Koleksiyon içeren düzeyde
  3. düğme gizlenir (Komut6 politikası), çubuk 2 düğmeyle sürer.
- Dar etiket kayması ('Expo/rt' vb.) kullanıcı tarafından
  biliniyor; çözüm sonraki komuta bırakıldı.

---

## D15 — Dışa aktarım: CSV + Downloads kaydı + kullanıcı bilgisi

- Durum: **Taslak** (kullanıcı onayı ile Final olur)
- Tarih: 2026-11-04
- Bağlam: Komut14; xlsx + paylaşım sayfası kaldırıldı.

### Kurallar

- Format: RFC 4180 CSV (BOM + CRLF), aynı 15 sütun; uzantı
  `.csv`, MIME `text/csv`.
- Kayıt: önbelleğe yaz + blob-util medya katmanıyla herkese
  açık Downloads koleksiyonuna kopyala (Android 10+ MediaStore,
  altı legacy yol). Paylaşım sayfası açılmaz.
- Bilgi: tarayıcıda Alert (başlık + dosya adı; boşta 'Nothing
  to export'; hatada başlık + mesaj), MarketPrice'ta 2 satırlık
  başlık yazısı. `xlsx` + `react-native-share` bağımlılıkları
  kaldırıldı (yalnız export kullanıyordu).

---

## D16 — Liste numaraları + satır tonları + pinned New Set + weight bump

- Durum: **Taslak** (kullanıcı onayı ile Final olur)
- Tarih: 2026-11-04
- Bağlam: Komut15; D14'ün 3. düğme kuralını değiştirir.

### Kurallar

- Numaralandırma: aynı koleksiyondaki set + direkt öğe tek
  sayaçla sonu noktalı 1..N ('1.', '3.'); set-içi öğeler
  `<setNo>.<sıra>.` ('2.1.', '2.2.'). SetDetail aynı kuralı
  nav parametresiyle (`fldStrSetNumber`, noktasız taşınır)
  uygular.
- Numara yazıtipi bir kademe yukarı: regular → Lato-Medium.
- Medya: set satırlarında kapak/ikon yok; öğe satırlarında
  kapak/'no thumbnail' glifi sağda (toggle hizası). Numara solda.
- Satır zeminleri: direkt öğe aynı (slim); set koyu mat teal
  `colRowSet #1D4F4A` (açık yazı); set-içi öğe bunun belirgin
  açık tonu `colRowMember #C2DAD4` (koyu yazı `colTextOnAccent`).
- Pinned: 'Export CSV' / 'For Sale' / 'New Set' eşit genişlik,
  çubuk dolgusu 16→8 + aralık 8→4 ile daha geniş. 'New Set'
  (EN 'New Set', TR 'Yeni Set') set-modalını açar, koleksiyon
  içeren düzeyde de görünür; boş koleksiyonda çubuk yalnız
  'New Set' ile tam genişlik sürer. Alttaki 'New Set' kalktı.
- Butonlar: tüm ekranlarda buton etiketi regular → medium,
  medium → bold (Lato + bold = `Lato_bold.ttf`). Kart/satır/
  alan/dropdown-alan/picker-satır içerikleri buton etiketi
  sayılmaz; kamera 'Clear' yazı-butonu bold'a alındı.
