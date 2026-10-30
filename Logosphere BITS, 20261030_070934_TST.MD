# Logosphere BITS - Session Log

- Session ID: 01a18aff-27df-7f43-b7e5-eb3c8f828c65
- Opened (TST): 2026-10-30 07:09:34 +03:00 (source: run time (hook fires at session start, creation ~= opening))
- File created (TST): 2026-10-30 07:09:34 +03:00
- Last updated (TST): 2026-10-30 07:13:54 +03:00

## Handover (current)

- Nerede: K62 kapandı (2026-10-30 07:13 +03:00); commit hazırlanıyor.
- Doğrulanmış durum: hierarchy migration yazılı, 4 kontrol yeşil; SQL çalıştırılmadı (Docker CLI yok).
- Sıradaki: commit et (push yok; kilometre taşı değil), sonraki talimatı bekle.

## Inherited state

- Önceki session MD: `Logosphere BITS, 20261028_234634_TST.MD` (session `01a1843c-9981-7090-b21d-ae4f00a3d6cd`, son güncelleme 2026-10-29 11:41:48 +03:00).
- Devralınan durum: K61 (Supabase yerel düzeni + ilk tablolar) kapandı ve MİLESTONE PUSH yapıldı. Gerçek dosyalar ve Git ile karşılaştırıldı: `HEAD` ve `origin/main` ikisi de `3a38241`; `git status` yalnız bu dosyayı izlenmiyor gösteriyor. Yarıda kalan iş yok.
- Ortam notu: Docker ve `psql` yok (doğrulandı); SQL çalıştırma bu makinede yapılamıyor — K61'deki durumla aynı.

## History

### 2026-10-30 07:09:34 +03:00 - Session file created

- Skeleton created by session opener; agent completes handover and history.

### 2026-10-30 07:11:19 +03:00 - K62 SQL yerleşim kuralları (devam ediyor)

- İstek özeti: açılış işlemleri + workspace/library/collection yerleşim kurallarını SQL tarafında da uygula; geçersiz üst düğüm, workspace dışı bağlantı ve döngü reddedilsin; yalnız mobil arayüz kontrolüne güvenme; iki farklı içerik türünün aynı anda eklenmesinin kuralı aşmaması için transaction/kilitleme davranışını belirle.
- Ön durum: kurallar yalnız `src/validation/hierarchy.ts` içinde (üst-tür izni, seviye saflığı, döngü, workspace tutarlılığı); SQL tarafında yalnız FK + kind check var.
- Tasarım: `nodes` üzerinde BEFORE INSERT OR UPDATE tetikleyici — (a) üst-tür izni (`library` kökte `parent_id IS NULL`; `collection` → library/collection; `set` → collection; `product` → collection/set), (b) workspace tutarlılığı, (c) döngü reddi (öz-üst + ata zinciri), (d) seviye saflığı (collection ile set/product aynı üstte karışmaz). Eşzamanlılık: kardeş denetiminden önce üst satır `FOR UPDATE` ile kilitlenir (varsayılan READ COMMITTED yeterlidir).
- Sıradaki: `migration new` → SQL yaz → 4 kontrol → commit (push yok).
- Sonuç (2026-10-30 07:13:54 +03:00): `migration new enforce_nodes_hierarchy` çıkış 0 → `20261030041250_...sql`. Tetikleyici `validate_nodes_hierarchy` + `nodes_hierarchy_before_write` (BEFORE INSERT OR UPDATE OF workspace_id, parent_id, kind): üst-tür izni, workspace tutarlılığı (üst + kind/workspace değişiminde mevcut çocuklar), döngü reddi (öz-üst + recursive ata zinciri), seviye saflığı. Kayıp üst satır FK'ye bırakılır.
- Eşzamanlılık kararı: kardeş denetiminden önce üst satır `SELECT ... FOR UPDATE` ile kilitlenir; varsayılan READ COMMITTED yeterlidir, özel izolasyon gerekmez. İkinci yazan, birinci commit/rollback edene kadar bekler, sonra satırı görüp reddedilir. Çok düzeyli taşımalar tek transaction içinde yapılır; zıt yönlü eşzamanlı taşımalar deadlock üretirse Postgres birini iptal eder, ağaç geçerli kalır, arayan tekrar dener.
- Kapsam notu: istek workspace/library/collection diyor; set/product üst kuralları da eklendi, çünkü seviye saflığı collection ↔ set/product sınırında tanımlı — sınırın bir yanı denetlenmeden kural kapanmaz. Silme davranışı eklenmedi (SCOPE §6.4 açık karar, K61 ile aynı).
- Kalıcı test notu: SQL tetikleyici için depoda koşucu yok (Docker CLI kurulu değil, `supabase start` çalışamaz); yeni çerçeve eklenmedi. Mobil `hierarchy.test.ts` (6 test) aynalanan kuralları kapsar, yeşil. Kabul yoklaması (Docker geldiğinde): library kökte OK; collection → library/collection OK; set → collection OK; product → collection/set OK; set → library RED; collection üst-yok RED; library üstlü RED; workspace-dışı üst RED; öz-üst RED; A→B→A döngü RED; collection+set aynı üstte RED (iki yön); kind değişimi çocukları bozuyorsa RED; eşzamanlı iki grup eklemede ikinci RED.
- Değişen dosyalar: `supabase/migrations/20261030041250_enforce_nodes_hierarchy.sql` + bu MD.
- Kontroller: typecheck 0, lint 0, format 0, jest 14/14 paket 43/43 geçti.
- Git: aşağıdaki commit (push yok; sonuç chat raporunda).
