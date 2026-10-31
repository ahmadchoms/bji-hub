# Checklist Latihan Pemulihan Bencana (Disaster Recovery & Restore Drill) (WS-E / E2)

Latihan pemulihan wajib dijalankan setiap kuartal (quarterly) untuk menjamin target pemulihan terpenuhi:
- **RTO (Recovery Time Objective)**: ≤ 60 menit
- **RPO (Recovery Point Objective)**: ≤ 24 jam (atau point-in-time snapshot terakhir)

---

## Formulir Catatan Latihan

- **Tanggal Latihan**: `YYYY-MM-DD`
- **Pelaksana Drill**: `[Nama Engineer / Lead]`
- **Waktu Mulai**: `HH:MM:SS WIB`
- **Waktu Selesai**: `HH:MM:SS WIB`
- **RTO Aktual**: `[X] Menit`
- **RPO Aktual**: `[X] Jam`

---

## Langkah Kerja Drill

1. **Unduh Backup Snapshot Terbaru**:
   - Buka Supabase Console Production > Database > Backups.
   - Unduh snapshot `.sql` atau dump PITR terbaru.

2. **Pulihkan ke Database Terisolasi (Drill Instance)**:
   ```bash
   createdb biji_restore_drill
   psql -d biji_restore_drill < supabase_backup.sql
   ```

3. **Verifikasi Integritas Skema dengan Prisma**:
   ```bash
   npx prisma migrate diff \
     --from-migrations prisma/migrations \
     --to-url "postgresql://postgres:postgrespassword@localhost:5432/biji_restore_drill" \
     --exit-code
   ```
   *Ekspektasi*: Exit code 0 (tidak ada deviasi skema antara migration history dan restored database).

4. **Verifikasi Hitungan Baris Tabel Kunci**:
   ```bash
   node scripts/compare-row-counts.mjs \
     --source "$PRODUCTION_READONLY_REPLICA_URL" \
     --target "postgresql://postgres:postgrespassword@localhost:5432/biji_restore_drill"
   ```
   *Ekspektasi*: Seluruh tabel kunci (`users`, `seller_profiles`, `listings`, `orders`, `order_items`, `payout_requests`, `refunds`, `reviews`, `roast_batches`, `producer_sellers`) menghasilkan status `MATCH`.

5. **Uji Fungsional Aplikasi terhadap Database Pulihan**:
   - Arahkan `DATABASE_URL` staging/local ke DB pulihan.
   - Uji login pembeli & penjual.
   - Uji verifikasi detail satu pesanan aktif.
   - Uji penelusuran katalog dan filter produk.

6. **Pembersihan (Cleanup)**:
   - Hapus database drill setelah evaluasi selesai:
   ```bash
   dropdb biji_restore_drill
   ```
