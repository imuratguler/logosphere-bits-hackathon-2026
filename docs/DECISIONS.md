# Logosphere BITS — Karar Kayıtları

Bu dosyadaki her karar, kullanıcı açıkça onaylayana kadar **Taslak** kalır.

## D1 — Demo kimlik modeli: arka planda anonim Supabase oturumu

- Durum: **Taslak** (kullanıcı onayı ile Final olur)
- Tarih: 2026-10-28
- Bağlam: SCOPE.md F10 (hesapsız demo, 8 profil, ortak veri) ve F11 (kimlik/yetki ayrı modüllerde, demoda gizli).

### Seçenekler

- **A) Giriş göstermeden arka planda anonim Supabase oturumu.** Uygulama açılışta `signInAnonymously()` ile görünmez bir oturum açar; kullanıcı kayıt olmaz.
- **B) Tüm yazmalara tamamen açık veritabanı.** Kimliksiz, RLS'siz ortak yazma.
- **C) Sekiz gerçek hesaba gömülü parolayla giriş.** Profiller gerçek Supabase kullanıcılarına bağlı; parolalar uygulamaya gömülü.

### Karar

**A seçildi.** Somut bir teknik engel bulunamadı (doğrulama aşağıda).

### Gerekçe

- A, iki gereksinimi aynı anda karşılar: **kayıtsız demo kullanımı** ve **izlenebilir yazma** (her yazma, anonim kullanıcının `auth.uid()` değeriyle ilişkilendirilebilir).
- Profil seçimi kimlik olmaz: 8 profil yalnızca yerel bir UX tercihidir; hesap açmaz, yetki vermez, oturumu değiştirmez.
- F11 sınırına uyar: anonim oturum kimlik modülünün içinde kalır; demoda giriş/üyelik ekranı gösterilmez.
- Üyeliğe geçiş yolu açıktır: anonim kullanıcı, daha sonra bir kimlik bağlanarak (identity linking) kalıcı kullanıcıya dönüştürülebilir.
- B reddedildi: yazmalar izlenemez (kullanıcının açık gereksinimini karşılamaz), herkes her şeyi silebilir/değiştirebilir, kötüye kullanıma tamamen açıktır.
- C reddedildi: gömülü parola, istemciden sökülebilir bir sırdır (gerçek güvenlik sağlamaz); yazmalar ancak profil düzeyinde izlenir (8 kişi = 1 kimlik); parola rotasyonu eski sürümleri bozar; hesap paylaşımı üyelik modeline taşınamaz.

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
