# Logosphere BITS — Tekrarlanabilir Kurulum

Boş veritabanından tam kuruluma giden sıralı yordam. Elle SQL adımı yoktur:
her adım aşağıdaki dosyalardan biriyle kapanır. Durum: K81 (2026-10-30).

## 1. Sıra

1. **Şema migration'ları** — `supabase/migrations/` dosya-adı sırasında
   (15 dosya, K81'de doğrulandı). Araç: `supabase db push` veya eşdeğeri.
2. **Referans veri aktarımları** — §2'deki kapılar açılmadan ÇALIŞTIRILMAZ.
   Dewey ve Geo birbirinden bağımsız iki ayrı işlemdir.
3. **Demo seed** — `supabase/seed.sql` en son uygulanır (10 persona,
   1 workspace, örnek katalog). Tekrar çalıştırılabilir; çoğaltma yapmaz.

## 2. Referans veri kapıları

| Küme | Kaynak dosya | Beklenen | Hak durumu | Eksik | Aktarım |
|---|---|---|---|---|---|
| Dewey | `Dewey_Nodes_Structure_and_Data_for_BITS.sql` (D:\Downloads) | 35.292 satır | DOĞRULANMADI | Menşe/lisans beyanı (dosyada yok, ek belge yok) | ENGELLİ: `supabase/transfers/dewey/` paketi hazır, veride koşulmadı |
| Geo | `Geo_Structure_and_Data_for_BITS.sql` + `Geo_Nodes_Data_for_BITS.csv` (D:\Downloads) | 233.001 satır (250/5308/152068/973/74402) | KISMEN: global ODbL doğrulandı, TR doğrulanmadı | `turkiye-il-ilce-mahalle-koy.json` için yukarı-akış URL + lisans + hash eşleşmesi | ENGELLİ: birleşik dosya ayrılamaz, bütün aktarım durur |

Kurallar:

- Kaynağı/hakkı doğrulanmamış aktarım çalıştırılmaz; veritabanına
  (geçici koşum dahil) yüklenmez, depoya alınmaz, uzak çalıştırılmaz.
- Kaynak dosyalar ASLA doğrudan çalıştırılmaz: Dewey dosyasındaki
  TRUNCATE/sabit-ID ON CONFLICT/eksik transaction aktarım yoluna girmez.
- Aktarım betikleri TRUNCATE/DELETE içermez, mevcut satırı silmez,
  code-tabanlı idempotent yazar; doğrulama geçmezse bütün işlem durur.
- Kapı açılınca sıra: şema (kurulu) → aktarım → doğrulama raporu.
  Dewey'de `extract.ps1` + `transfer.sql`; Geo'da birleşik SQL dosyası
  (içi doğrulama+rapor blokludur, okuma hibesini yüklerken verir).
- Veri kümeleri resmî/eksiksiz katalog diye sunulmaz. Geo atfı:
  Countries States Cities Database (dr5hn), ODbL v1.0.

## 3. Migration varsayımları

| Varsayım | Kullanan | Karşılanma |
|---|---|---|
| `pgcrypto` (`gen_random_uuid`) | İlk migration + sonrası | İlk migration `IF NOT EXISTS` ile kurar |
| `pg_trgm` | Geo migration | Aynı migration `IF NOT EXISTS` ile kurar |
| `auth.users` | Profiller FK | Supabase'te gerçek; koşumda taslak (setup.js) |
| `storage` şeması | Storage migration | Supabase'te gerçek; koşumda taslak (setup.js) |
| `anon`/`authenticated`/`service_role` | Hibe/iptal/politika içeren 10 migration | Platform rolleri; koşumda setup.js üretir |
| Önceki migration nesneleri (tablolar, tetikleyiciler, kapı fonksiyonu) | Sonraki migration'lar | Dosya-adı sırası çözer; K81'de boş DB'de doğrulandı |

## 4. Yerel koşum tarifi (Docker yokken)

Taşınabilir Postgres 17 (`$env:TEMP\bits-pg`, depo dışı), 127.0.0.1:55433:

```powershell
$d="$env:TEMP\bits-pg"
& "$d\bin\bin\pg_ctl.exe" -D "$d\data" -o "-p 55433 -c listen_addresses=127.0.0.1" -l "$d\server.log" start
Set-Location "$env:TEMP\bits-pg\client"
node setup.js        # boş DB + roller + taslaklar + 15 migration + seed
node <accept|verify>.js
& "$d\bin\bin\pg_ctl.exe" -D "$d\data" stop -m fast
```

`setup.js` her koşuda veritabanını düşürüp yeniden kurar; roller
küme-düzeyinde kalıcıdır. Kabul betikleri depo dışındadır.

## 5. Erişim duruşu (özet)

- Demo okuma/yazma yalnız RPC ve politika yolundan; istemcide doğrudan
  tablo yazma hibesi yok; RLS her tabloda açık.
- `dewey_nodes`/`geo_nodes` istemciye kapalı; salt-okunur açma her küme
  için ayrı kararla, hak + yükleme sonrasında.
- Süreli URL'ler kalıcı kimlik olarak saklanmaz (yol CHECK'leri URL
  kabul etmez); ses/kurumsal okuma sunucu-imzalı URL ile.
- Ölü iş taslak temizliği yalnız sunucu (`cleanup_abandoned_runs`,
  kuru-çalışma öntanımlı); iş kayıtları denetim için korunur.
