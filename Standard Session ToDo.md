# Standard Session ToDo — Logosphere BITS

Bu dosya, bu klasörde çalışan her Muse oturumunun genel kurallarının tek ana kaynağıdır.
Kurallar görev ve dosya adlarıyla anlatılır.

## 1. Oturum dosyası açma

Her yeni Muse oturumu, ilk proje işlemi olarak kökte kendi oturum dosyasını oluşturur.

- Desen: `Logosphere BITS, yyyymmdd_hhnnss_TST.MD`
- TST bu projede Turkish Standard Time, UTC+03:00 demektir. Zaman Europe/Istanbul üzerinden
  hesaplanır; dosya adında `yyyyMMdd_HHmmss` biçimi kullanılır (HH 24 saatlik saat, mm dakika).
- Dosya adındaki zaman gerçek açılış zamanını gösterir. Açılış zamanı güvenilir bir
  metadatada yoksa uydurulmaz: dosya bu kaydın oluşturulduğu zamanla adlandırılır ve
  geçmiş açılış zamanının bilinmediği açıkça yazılır.
- Dosyaya session kimliği, açılış zamanı, dosya oluşturulma zamanı ve son güncelleme
  zamanı UTC+03:00 farkıyla açıkça yazılır.
- Aynı session devam ettiği sürece kendi aktif MD'sini kullanır; her kullanıcı mesajında
  yeni dosya açılmaz. Başka session'ın dosyası ezilmez.
- Açılış yordamı: MD oluşturulduktan sonra bu dosya ile mevcut dosya hariç en yakın
  önceki session MD'si okunur; gerekiyorsa daha eski kayıtlar da incelenir. Nerede
  kalındığı, biten işler, açık hatalar, denenmiş çözümler ve sıradaki iş öğrenilir;
  bunlar gerçek dosyalar ve Git durumuyla karşılaştırılır, yarıda kalan iş tamamlanmış
  varsayılmaz. Önceki kaydın yolu ve devralınan durum özeti yeni session MD'sine yazılır.
- Otomasyon: `.muse/hooks.json` içindeki SessionStart olayı `tools/new-session.ps1`
  betiğini çalıştırır ve iskeleti oluşturur. Betik aynı session kimliğiyle tekrar
  çalıştırılınca ikinci MD üretmez ve mevcut kaydı ezmez. Ajan, devralma özetini ve
  kayıt güncellemelerini tamamlar.

## 2. Komut kaydı

- Her kullanıcı komutuna başlamadan önce aktif session MD'sine istek özeti ve
  "devam ediyor" durumu yazılır.
- Tamamlanan HER KOMUT BİTİMİNDE, kullanıcıya sonuç vermeden önce aynı dosya
  güncellenir. Bu zorunluluk kod, belge, inceleme, hata giderme ve başarısız veya
  engellenmiş işler için de geçerlidir.
- Kayıtta bulunur: yapılan işlemler, değişen dosyalar, alınan kararlar, gerçek kontrol
  sonuçları, hatalar, kalan iş, sıradaki somut eylem ve Git durumu.
- Üstte güncel devir özeti, altında zaman damgalı işlem geçmişi tutulur; önceki kayıtlar
  silinmez. Uzun veya riskli işlerde ara durum da diske yazılır. Böylece ani kesinti
  sonrasında son doğrulanmış durum ile yarım kalan iş ayrılabilir.
- Yazma güvenli ve tekrar çalıştırılabilir yapılır; anahtar, token veya parola
  kaydedilmez.

## 3. Çalışma kuralları

- Yalnız o an verilen iş yapılır; gelecekteki dosya ve özellikler peşinen üretilmez.
- Paketler kendi kullanım aşamasında, kesin sürümleriyle kurulur (sürüm seti için
  `docs/DECISIONS.md` içindeki D3 kaydı esas alınır).
- Kilit dosyası (`package-lock.json`) yalnız paket yöneticisiyle güncellenir; elle
  değiştirilmez.
- Çalışan kararlar keyfî değiştirilmez; karar belgelerindeki çelişki yerinde ve tutarlı
  düzeltilir; aynı kurallar için ikinci ana belge üretilmez.
- Yapılmamış kontrol başarılı gösterilmez; kanıtı olmayan test "çalıştı" yazılmaz.
- Mobil kontroller: `npm run typecheck`, `npm run lint`, `npm run format`, `npm test`.
  Gelecekteki Supabase Deno kodu `supabase/` altında tutulur ve mobil kontrollerin
  dışındadır (`tsconfig.json`, `jest.config.js`, `.eslintignore`, `.prettierignore`
  dışlamaları). Bildirim (`*.d.ts`) dosyaları test olarak keşfedilmez.
- Alan adları ve kod içi tüm tanımlayıcılar İngilizce yazılır
  (`temporary`/`temp`, asla `gecici` vb.).
- TypeScript kodunda `docs/DECISIONS.md` D6 "Programcı İsimlendirmeleri"
  hiyerarşisine %100 uyulur; hiyerarşiyi ihlal eden bir isimlendirme
  görülürse kod yazılmadan önce kullanıcı uyarılır ve doğrusu kullanılır.

## 4. Git kuralı

- Tamamlanan ve uygun kontrolleri geçen her somut ilerlemede ilgili dosyalar seçilerek
  açıklayıcı commit oluşturulur. Her araç çağrısı için veya değişiklik yokken boş
  commit üretilmez.
- Şu tamamlanmış kilometre taşlarında push yapılır: oturum kayıt düzeni, çalışan
  Android temeli, görsel temel, Supabase temeli, ortak demo, kamera ve ses, sağlayıcı
  altyapısı, envantere ekleme, satış, Excel raporu, temiz APK kabulü, teslim.
- Gün sonunda kullanıcıdan mesaj geldiğinde veya o sırada çalışılıyorken gönderilmemiş
  tamamlanmış commit'ler de gönderilir; zamanlayıcı kurulmaz. Bu kapsamda yeniden izin
  istenmez.
- GitHub kullanıcısı `imuratguler`, origin
  `https://github.com/imuratguler/logosphere-bits-hackathon-2026`, dal `main` olmalıdır.
- Push öncesi fetch ile uzak durum kontrol edilir; sonrasında yerel HEAD ile
  `origin/main` eşitliği doğrulanır. Force-push, geçmiş silme, tarih değiştirme veya
  secret gönderme yapılmaz. Yalnız ilgili dosyalar stage edilir ve staged diff
  incelenir. Commit/push sonucu aktif session MD'sine işlenir; sırf kendi commit
  kimliğini kayda eklemek için sonsuz yeni commit döngüsü oluşturulmaz.

## 5. Belge haritası

- `Standard Session ToDo.md` (bu dosya): genel kurallar.
- `AGENTS.md`: proje kuralları girişi; bu dosyaya bağlar.
- `docs/SCOPE.md`, `docs/DECISIONS.md`: kapsam ve karar kayıtları.
- `README.md`: kısa proje tanıtımı.
- `Logosphere BITS, *_TST.MD`: oturum kayıtları (TST = UTC+03:00).

## 6. Bilinen ortam notları

- Derleme ve çalıştırma komutlarında normal `C:\...` dizini kullanılır; `\\?\` önekli
  çalışma dizini `javac`'i bozar (ilk oturum kaydında kanıtlandı).
- Bu makineden GitHub HTTPS erişimi çalışır durumdadır.
- Araç zinciri: Node 24.15.0, npm 11, JDK 17.0.12, Android SDK; sürüm seti D3.

## 7. Emülatör kuralı

- Emülasyon, Wireless Debugging ile fiziksel telefonda yapılır; AVD varsayılmaz.
- Uygulama çalıştırmadan önce sorular sırayla sorulur: önce "Metro'yu açtın mı?",
  Evet ise "Telefonun emülasyon için hazır mı?" (Evet/Hayır).
- Her iki soruya da "Evet" alınmadan cihaza dokunulmaz: `adb` bağlantı/emülatör
  komutu çalıştırılmaz, kurulum denenmez. "Hayır" yanıtında iş beklemeye alınır
  ve soru daha sonra yeniden sorulur.
- Kablosuz `adb` portu (ör. `37301`) her yeniden bağlantıda değişir; eski
  port asla varsayılmaz ve önceki kayıtlardaki adres yeniden kullanılmaz.
- Port yalnızca gerekirse sorulur: güncel adres o anda çalıştırılan
  `adb devices` çıktısından alınır; listede cihaz görünmüyorsa port
  kullanıcıya sorulur, tahminle bağlantı denenmez.
