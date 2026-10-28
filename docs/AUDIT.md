# Audit Kesiapan Marketplace #3: Biji Hub (`ahmadchoms/bji-hub`)

**Basis:** `main` pada commit `31d4aa2` (setelah audit #2 dieksekusi: N1–N9, F1–F10, S1/S5–S9, dst.).
**Metode:** static review kode baru + menjalankan lint dan test.

- ✅ `eslint` bersih.
- ✅ 38 dari 44 file Vitest lulus.
- ⚠️ **6 file gagal di sandbox-ku hanya karena `Cannot find package '@/lib/generated/prisma/client'`** (`prisma generate` butuh unduhan yang diblokir di sandbox). Keenam file itu justru menguji kode paling kritis: `order.actions`, `auth.actions`, `account.actions`, `cart.actions`, `health`, dan `webhooks/midtrans`. Hasilnya **tidak konklusif**; pastikan CI-mu hijau untuk keenamnya.
- `typecheck` dan `next build` tidak bisa kujalankan di sandbox; andalkan CI.

**Legenda:** ✅ terverifikasi di kode · ⚠️ perlu diverifikasi / konfigurasi di luar repo.
**Peringatan jujur:** tidak ada sistem bebas bug. Target dokumen ini: menutup celah yang menyangkut **uang, data pribadi, dan hak akses**, agar kegagalan terlihat dan bisa dipulihkan.

> Simpan di luar repo atau di `docs/` yang sudah di-`.gitignore`. Repo publik: jangan commit daftar kerentanan yang belum diperbaiki.

---

## 0. Ringkasan Eksekutif

### 0.1 Status eksekusi audit #2

| Item                                       | Status | Catatan                                                                                                                                                              |
| ------------------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| N1 Refund outbox + retry + antrean admin   | 🟡     | Ada, tetapi **record refund dibuat sebelum status order berubah; bila transisi gagal, refund yatim bisa memicu pengembalian dana untuk order yang masih aktif** (M1) |
| N2 Cron                                    | ⏸️     | **Ditunda sesuai keputusanmu** (lihat Bagian 2). Workflow GitHub Actions sudah ada di repo tetapi tidak aktif tanpa secret                                           |
| N3 Expiry 75 menit + batas pending         | ✅     | `autoCancelExpiredPendingOrders(1.25)`; ada guard stock-hold                                                                                                         |
| N4 Restock tidak mengaktifkan arsip manual | ✅     | `status='archived' AND stock = 0`                                                                                                                                    |
| N5 Jalur idempotency `createOrder`         | ✅     | `throw` setelah `ROLLBACK`                                                                                                                                           |
| N6 Keranjang                               | ✅     | Payload tidak valid ditolak                                                                                                                                          |
| N7 Normalisasi email                       | ✅     | Login, register, reset                                                                                                                                               |
| N8 Domain hardcode                         | 🟡     | Masih ada fallback `https://bji-hub.vercel.app` di `lib/email.ts` dan `lib/notifications.ts` (M12)                                                                   |
| N9 Health                                  | ✅     | Dengan cache                                                                                                                                                         |
| F1 Notifikasi in-app                       | 🟡     | **Notifikasi penjual salah alamat** (M5)                                                                                                                             |
| F2 Audit log                               | ✅     | Ada halaman `/admin/audit-logs`                                                                                                                                      |
| F3 Suspend user/toko                       | ✅     | Guard di `getSession()`, katalog menyembunyikan toko tersuspend                                                                                                      |
| F5 Pencarian `pg_trgm`                     | ✅     | Migrasi indeks + saran hasil kosong                                                                                                                                  |
| F6 Hapus akun + ekspor data                | 🔴     | **Akun Supabase tidak dihapus, anonimisasi parsial, gagal dianggap sukses** (M6)                                                                                     |
| F7 Alamat di tabel                         | ✅     | `user_addresses`                                                                                                                                                     |
| F9 Balasan & laporan ulasan                | 🔴     | **Seller mana pun dapat membalas ulasan produk seller lain** (M4)                                                                                                    |
| F10 KYC privat                             | 🟡     | Bucket privat + signed URL 5 menit, tetapi **path dokumen tidak diikat ke seller** dan ada fallback ke mock (M7)                                                     |
| S1 CSP enforce                             | 🟡     | Sudah `Content-Security-Policy`, tetapi belum diverifikasi dan masih ada `unsafe-eval` (M8)                                                                          |
| S5 Webhook replay guard                    | 🔴     | **Event dicatat sebelum diproses ⇒ kegagalan sementara membuat event hilang permanen** (M2)                                                                          |
| S7–S9                                      | ✅     | Redaksi PII log, revokasi sesi, cooldown rekening payout 24 jam                                                                                                      |
| F17 Batas pembatalan 6 jam                 | 🟡     | Memakai `updatedAt`, bukan waktu bayar (M10)                                                                                                                         |

### 0.2 Skor kesiapan saat ini

| Area                                      | Kesiapan | Catatan                                                                     |
| ----------------------------------------- | -------- | --------------------------------------------------------------------------- |
| Keamanan akses (auth/otorisasi inti)      | 🟢       | Baik untuk alur order dan admin                                             |
| Otorisasi fitur baru                      | 🔴       | Ulasan, KYC, notifikasi: celah baru muncul dari fitur yang baru ditambahkan |
| Integritas uang (refund, webhook, payout) | 🟡       | **Perlu M1–M3 sebelum uang nyata**                                          |
| Kepatuhan data pribadi                    | 🔴       | Hapus akun belum memenuhi tujuannya (M6)                                    |
| Operasional                               | 🟡       | Cron ditunda; monitoring, staging, backup masih [HUMAN]                     |
| Fitur marketplace                         | 🟢/🟡    | Inti sudah lengkap; sisa: pesan pasca-order, voucher, invoice resmi, i18n   |
| Testing                                   | 🟡       | Unit banyak; integrasi DB/konkurensi dan e2e di CI belum ada                |
| Performa/SEO/UX                           | 🟡       | Belum ada cache katalog, audit Lighthouse/axe                               |

### 0.3 Pola yang berulang pada kode baru

Tiga pola yang sudah kita perbaiki di kode lama kembali muncul di modul baru. Kendalikan sebelum menulis fitur berikutnya:

1. **Hak akses hanya diperiksa pada "peran", bukan pada "kepemilikan data"** (M4, M7).
2. **Kegagalan DB/storage ditelan, lalu fallback ke memori/mock dan melapor sukses** (M6, M7, `lib/data/notifications.ts`, `lib/data/reviews.ts`, upload).
3. **Operasi berantai tanpa transaksi** (M1, M2).

Tambahkan guard di CI: `grep -rn "catch {\s*return false" lib/data` dan `grep -rn "mock" lib/data/*.ts | grep -v "DATA_SOURCE"` harus nol hasil pada jalur production.

---

## 1. Blocker (P0): kerjakan sebelum uang dan data pengguna nyata

### M1. Refund yatim: record refund dibuat sebelum order dibatalkan ✅

**File:** `actions/order.actions.ts` (`cancelPaidOrderAction`, dan pola serupa di `resolveDisputeAction`/`sellerResolveDisputeAction`), `app/api/cron/retry-refunds/route.ts`, `actions/refund.actions.ts`

Urutan sekarang: (1) `createRefundRecord(... "pending")` → (2) `transitionOrderStatus(... "canceled")` → (3) bila `!applied`, `return fail(...)` **tanpa membatalkan record refund** → (4) panggil gateway.

Dampak: bila transisi gagal (balapan: order sudah `shipped`, atau dibatalkan oleh pihak lain), baris `refunds` berstatus `pending` tertinggal. Retry refund (cron **dan** tombol admin) membaca `pending|failed` tanpa memeriksa status order, lalu **mengembalikan dana untuk pesanan yang masih aktif/terkirim**. Karena `refunds.order_id` unik dan `refundId = ref-${order.id}`, percobaan batal berikutnya juga ditolak ("sedang diproses").

**Perbaikan:**

1. Satu fungsi transaksional `cancelOrderWithRefund(orderId, { reason, createdBy })` di `lib/data/orders.ts`:
   - `BEGIN`; `SELECT ... FROM orders WHERE ... FOR UPDATE`; validasi status asal (`paid` untuk pembatalan; `disputed` untuk putusan);
   - `UPDATE orders SET status='canceled'`, restock stok;
   - `INSERT INTO refunds (id, order_id, amount, reason, status, ...) VALUES (..., 'pending', ...) ON CONFLICT (order_id) DO NOTHING RETURNING id`;
   - `COMMIT`. Bila ada kegagalan, **seluruhnya rollback** (tidak ada order batal tanpa record refund dan tidak ada record tanpa order batal).
2. Setelah commit: panggil gateway dengan `refund_key` deterministik, lalu `updateRefundStatus`.
3. **Guard di semua jalur retry** (cron dan aksi admin): ambil order, dan hanya proses bila `order.status === "canceled"`; selain itu tandai refund `voided` dan catat `logger.error("refund.orphan_detected", ...)`.
4. Tambahkan status `voided` ke `refunds.status` dan `CHECK (status IN ('pending','processed','failed','manual_required','voided'))`.
5. Ubah semua tiga aksi memakai fungsi baru.

**Test:** transisi gagal ⇒ tidak ada baris refund; refund `pending` untuk order `shipped` ⇒ retry menolak dan menandai `voided`; dua pembatalan paralel ⇒ satu refund.

### M2. Dedup webhook mencatat event _sebelum_ diproses ✅

**File:** `app/api/webhooks/midtrans/route.ts` (`recordWebhookEventIfNew` dipanggil sebelum `transitionOrderStatus`)

Jika proses setelah pencatatan gagal sementara (DB putus, timeout, error 500), Midtrans mengirim ulang **payload yang sama** ⇒ hash sama ⇒ dibalas `already_processed` ⇒ **notifikasi pembayaran hilang permanen** dan order tetap `pending_payment` padahal sudah dibayar.

Padahal state machine sudah idempoten, jadi dedup tidak boleh menjadi gerbang.

**Perbaikan (pilih satu):**

- **A (disarankan):** hapus pemeriksaan "isNew" sebagai gerbang. Proses selalu dijalankan (aman karena idempoten), lalu catat `webhook_events` **setelah sukses** hanya sebagai jejak audit.
- **B:** dua fase: `INSERT ... status='processing'` → proses → `UPDATE status='done'`; event `processing` yang lebih tua dari 2 menit boleh diproses ulang.

```ts
// setelah handler sukses (termasuk hasil duplicate/invalid_transition):
await recordWebhookEvent({
  eventId,
  provider: "midtrans",
  orderRef: parsed.orderRef,
  outcome,
});
```

**Test:** `transitionOrderStatus` melempar error pada panggilan pertama ⇒ respons 500; panggilan kedua dengan payload sama ⇒ order menjadi `paid`.

### M3. Pembayaran masuk setelah order dibatalkan tidak ada penanganannya ✅

Webhook memetakan `deny/cancel/expire` → `canceled`, dan `ALLOWED_FROM.paid = ["pending_payment"]`. Bila `settlement` datang saat order sudah `canceled` (pembeli menekan "Batalkan pesanan" di tab lain saat popup bayar terbuka; cron/auto-cancel berjalan; `deny` lalu pembeli mencoba metode lain pada token Snap yang sama ⚠️ periksa perilaku Midtrans), hasilnya `invalid_transition` dengan balasan 200: **pembeli sudah membayar tetapi tidak ada pesanan dan tidak ada refund**.

**Perbaikan:** pada webhook, bila `parsed.status === "paid"` dan `order.status === "canceled"`:

1. `logger.error("payment.late_on_canceled", { orderId })`;
2. buat record refund `pending` (alasan "Pembayaran diterima setelah pesanan dibatalkan") dengan `refund_key` deterministik dan proses lewat jalur retry (M1);
3. buat notifikasi/email ke admin dan pembeli;
4. tambahkan tab "Anomali pembayaran" di `/admin/refunds`.
   Terapkan juga bila order `canceled` tetapi stok sudah direstock: **jangan** otomatis menghidupkan order (dana dikembalikan).

### M4. Seller mana pun dapat membalas ulasan produk seller lain (IDOR) ✅

**File:** `actions/review.actions.ts` (`replyToReviewAction`), `lib/data/reviews.ts` (`replyToReview`, `reportReview`)

`replyToReviewAction` hanya memanggil `requireSeller()`. `replyToReview(reviewId, text)` menjalankan `UPDATE reviews SET seller_reply = ... WHERE id = $3` **tanpa memeriksa bahwa ulasan itu milik produk seller tersebut**. Akibatnya seller A bisa menulis/menimpa balasan di ulasan produk seller B (penghinaan, spam, pencemaran nama baik).

Masalah terkait:

- `reportReview`: siapa pun yang login dapat menandai ulasan mana pun; **alasan laporan ditimpa** laporan terakhir; satu pengguna dapat melaporkan berulang tanpa batas; tidak ada rate limit; tidak ada konsekuensi (ulasan tidak disembunyikan).
- Kedua fungsi memakai `catch { return false }`: error DB tidak terlihat.

**Perbaikan:**

```sql
UPDATE public.reviews r
SET seller_reply = $1, seller_replied_at = $2
FROM public.listings l
WHERE r.id = $3
  AND r.listing_id = l.id
  AND l.seller_id = $4
  AND r.seller_reply IS NULL;   -- satu balasan; izinkan edit ≤ 24 jam bila diperlukan
```

- Ubah signature: `replyToReview(reviewId, sellerId, text)`; aksi memakai `sellerId` dari `requireSeller()`.
- Laporan: tabel `review_reports (id, review_id, reporter_id, reason, status, created_at, UNIQUE (review_id, reporter_id))`; rate limit 10/jam per user; ambang otomatis (mis. ≥ 3 pelapor berbeda ⇒ ulasan `hidden_pending_review`); antrean moderasi di admin; audit log.
- Log error DB, bukan menelan.
- Test authz: seller lain ⇒ ditolak; seller pemilik ⇒ berhasil; balasan kedua ⇒ ditolak; pelapor sama dua kali ⇒ satu baris.

### M5. Notifikasi penjual dikirim ke ID yang salah ✅

`createNotification({ userId: order.sellerId, ... })` (webhook, `order.actions.ts` baris ±516, 573, 675, `payout.actions.ts` ±179). **`order.sellerId` adalah `SellerProfile.id`**, sedangkan lonceng notifikasi membaca `user_id = session.userId`. Akibatnya notifikasi seller (pesanan baru, dispute, payout) **tidak pernah muncul**.

**Perbaikan:** resolusikan `userId` pemilik toko (`seller_profiles.user_id`) di satu helper:

```ts
export async function notifySeller(
  sellerProfileId: string,
  payload: Omit<NotificationInput, "userId">,
) {
  const seller = await getSellerById(sellerProfileId);
  const userId = seller?.userId ?? seller?.user?.id;
  if (!userId) {
    logger.warn("notification.seller_user_not_found", { sellerProfileId });
    return;
  }
  await createNotification({ ...payload, userId });
}
```

Ganti semua pemanggilan dengan `notifySeller`. Tambahkan test yang membuat order lalu memastikan `getUserNotifications(sellerUserId)` memuatnya. Juga: `getUserNotifications` jatuh ke memori saat DB gagal (pola buruk): lempar/log error di mode DB.

### M6. Hapus akun belum memenuhi tujuan dan bisa melapor sukses padahal gagal ✅

**File:** `actions/account.actions.ts` (`deleteAccountAction`)

1. **Akun Supabase Auth tidak dihapus.** Kode hanya `signOut({ scope: "global" })`. Email asli, identitas Google, dan password hash tetap di `auth.users`; pengguna bisa login lagi. (Guard suspend memblokir di aplikasi, tetapi data pribadi tetap tersimpan.)
2. **Gagal-terbuka pada pemeriksaan order aktif:** bila `getOrdersByBuyer` melempar error, pemeriksaan dilewati dan penghapusan lanjut. Status yang dicek memuat `"processing"` (tidak ada di enum) dan **tidak memuat `disputed`**; refund `pending`/`manual_required` juga tidak diperiksa.
3. **Kegagalan anonimisasi DB ditelan** ("Non-fatal") lalu fungsi tetap mengembalikan `ok(... "/login?deleted=1")`. Pengguna mengira data terhapus padahal tidak.
4. **Anonimisasi parsial:** hanya `email`, `passwordHash`, alamat. `name`, `phone`, avatar, PII di tabel `orders` (`buyer_name/email/phone/address/city`), nama pada ulasan, `inquiries`, `notifications`, `user_carts`, dan **dokumen KYC (untuk seller)** tidak disentuh.
5. **Email anonim tabrakan:** `anonymized_${userId.slice(0, 8)}@deleted.bijihub.com` hanya memakai 8 karakter; bentrok dengan constraint unik ⇒ update gagal ⇒ (lihat poin 3) ditelan.
6. **Akun seller tidak ditangani:** listing aktif tetap tayang, saldo/payout tertahan, order seller berjalan.
7. **Tanpa autentikasi ulang:** sesi curian cukup mengetik "HAPUS AKUN".

**Spesifikasi perbaikan (urutan dan semantik fail-closed):**

1. Wajib autentikasi ulang (password; untuk akun Google: login ulang < 5 menit) dan rate limit.
2. Cek penghalang, **gagal ⇒ berhenti**:
   - pembeli: order `pending_payment|paid|shipped|disputed`, refund `pending|failed|manual_required`;
   - seller: order aktif, saldo `> 0`, payout `pending`, listing aktif (minta arsipkan/tarik dana dulu).
3. Satu transaksi DB untuk anonimisasi dengan placeholder unik berbasis **seluruh** `userId`:
   `email = 'deleted+' || id || '@invalid.local'`, `name = 'Pengguna Terhapus'`, `phone = NULL`, `avatar = NULL`; hapus `user_addresses`, `notifications`, `user_carts`, `inquiries` berisi PII; pada `orders` untuk order selesai/batal ganti `buyer_name/email/phone/address/city` dengan nilai anonim (pertahankan jumlah, tanggal, ID untuk keperluan keuangan dan pajak); ulasan dipertahankan dengan nama anonim.
4. Seller: hapus objek di bucket `seller-kyc`, kosongkan `kycDocumentUrl`, sembunyikan toko dan listing.
5. Setelah DB sukses: `supabaseAdmin.auth.admin.deleteUser(userId)` (service role). Bila gagal ⇒ `fail(...)` + `logger.error` + audit log; **jangan** melapor sukses.
6. Catat audit log (tanpa PII), hapus cookie, `signOut` global.
7. Perbarui halaman privasi: apa yang dihapus dan apa yang dipertahankan beserta alasan hukumnya (retensi transaksi).
8. **Ekspor data:** pastikan memuat profil, alamat, order (milik sendiri), ulasan, notifikasi; tanpa data pihak lain.

### M7. KYC: path dokumen tidak diikat ke seller dan ada fallback ke mock ✅

**File:** `actions/seller.actions.ts` (`requestVerificationAction`), `actions/upload.actions.ts` (`createKycUploadTargetAction`, `getKycDocumentSignedUrlAction`)

1. `kycDocumentPath` datang dari klien (`z.string().min(1).max(500)`) dan **tidak divalidasi** terhadap `uploads/${sellerId}/<uuid>.<ext>` serta tidak diperiksa keberadaannya. Seller dapat menunjuk ke path milik seller lain; lalu `getKycDocumentSignedUrlAction(sellerId-miliknya)` menandatangani path itu ⇒ **membaca dokumen identitas orang lain** (path berisi UUID acak sehingga sulit ditebak, tetapi tidak boleh bergantung pada itu).
2. Bila Supabase Storage gagal, aksi mengembalikan **`ok` dengan target `/api/mock-storage/kyc-...`**. Di production ini berarti unggahan dokumen identitas "berhasil" ke penyimpanan mock; endpoint `GET /api/mock-storage/[id]` bersifat **publik tanpa auth**. Jalur serupa ada pada unggahan gambar listing (komentar "Fall through to mock storage target if Supabase bucket/service fails in dev").
3. Admin melihat dokumen KYC tanpa jejak audit.

**Perbaikan:**

```ts
const KYC_PATH = new RegExp(
  `^uploads/${sellerId}/[0-9a-f-]{36}\\.(jpg|png|webp|pdf)$`,
);
if (!KYC_PATH.test(path)) return fail("Dokumen tidak valid");
// verifikasi objek ada di bucket (list/createSignedUrl tanpa error) sebelum menyimpan
```

- Fallback mock hanya bila `isMockAuthAllowed()`; selain itu `fail("Penyimpanan dokumen sedang bermasalah, coba lagi")`.
- Setiap pembukaan dokumen oleh admin ⇒ `recordAuditLog({ action: "view_kyc_document", targetId: sellerId })`.
- **[HUMAN]** Bucket `seller-kyc`: privat, `file_size_limit` (mis. 5 MB), `allowed_mime_types` (jpeg/png/webp/pdf); tanpa policy publik.
- Kebijakan retensi: hapus dokumen setelah verifikasi disetujui/ditolak + N hari.

### M8. CSP sudah enforce, tetapi belum teruji dan masih longgar ⚠️

`next.config.ts` kini mengirim `Content-Security-Policy` (bukan Report-Only). Catatan:

1. `script-src` memuat **`'unsafe-eval'` di production**: tidak diperlukan oleh Next di production; hapus (pertahankan hanya saat `NODE_ENV !== "production"`).
2. Tidak ada `frame-ancestors`, `form-action`, dan `report-uri/report-to`. Tambahkan `frame-ancestors 'none'` dan `form-action 'self'`.
3. Tanpa verifikasi, kemungkinan memblokir: Snap Midtrans (periksa kebutuhan `https://api.midtrans.com` dan `https://api.sandbox.midtrans.com` pada `connect-src`, serta aset gambar pada `img-src`), Vercel Analytics/Speed Insights bila dipakai (`https://va.vercel-scripts.com`), dan Turnstile. **Uji di staging dengan DevTools Console terbuka:** login email, login Google (One Tap dan popup), checkout sampai popup Snap terbuka dan pembayaran sandbox selesai, unggah gambar, Turnstile, halaman produk dengan gambar Supabase.
4. Rencana aman: kembalikan sementara ke `Content-Security-Policy-Report-Only` + `report-to` ke endpoint log sampai bersih selama 1–2 minggu, lalu enforce.

---

## 2. Cron Ditunda: Konsekuensi dan Mitigasi Tanpa Cron

Keputusanmu: cron dilewati dulu dan dipasang setelah memakai VPS sendiri. Itu wajar. Catatan teknis yang perlu kamu tahu:

- Repo **sudah memiliki** `.github/workflows/scheduled-jobs.yml` (GitHub Actions, gratis, tidak tergantung Vercel). Ia hanya aktif bila secret `APP_URL` dan `CRON_SECRET` diisi; tanpa itu ia **diam-diam melewati** (hanya mencetak peringatan). Jika tidak ingin menjalankannya sekarang, nonaktifkan workflow tersebut agar tidak membingungkan, atau biarkan; tidak berbahaya.
- Route `/api/cron/*` tetap aman (menolak bila `CRON_SECRET` kosong di production).

### 2.1 Efek selama cron tidak berjalan

| Pekerjaan cron                           | Efek bila tidak berjalan                                                                      | Mitigasi                                                                          |
| ---------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Auto-cancel pesanan belum bayar (75 mnt) | Stok tertahan oleh pesanan kedaluwarsa jika webhook `expire` terlewat                         | Sweep **lazy** saat checkout (2.2-A)                                              |
| Auto-complete pesanan `shipped` (48 jam) | Saldo seller tidak bertambah kecuali pembeli menekan "Pesanan diterima" ⇒ **payout tertahan** | Sweep lazy saat seller membuka saldo/pesanan (2.2-B) + tombol admin (2.2-C)       |
| Sinkronisasi pembayaran                  | Bila webhook gagal, order tetap pending                                                       | Halaman sukses/polling sudah menyinkronkan per order; tambah tombol admin (2.2-C) |
| Retry refund                             | Refund `failed` tidak otomatis diulang                                                        | Tombol "Coba lagi" di `/admin/refunds` (sudah ada) + guard M1                     |

### 2.2 Desain pemeliharaan tanpa cron ("opportunistic maintenance")

**A. Lazy-expiry saat checkout.** Di `createCheckoutOrderAction`, **sebelum** cek/reservasi stok, jalankan `expireStalePendingForListings(listingIds, 75 menit)`: batalkan (lewat `transitionOrderStatus(..., "canceled")`, sehingga restock atomik) semua order `pending_payment` yang lebih tua dari 75 menit untuk listing tersebut. Biayanya kecil karena dibatasi per listing dan memiliki indeks `(listing_id, status, created_at)`.

**B. Lazy auto-complete per seller.** Saat seller membuka `/dashboard/orders`, `/dashboard` atau saat `requestPayoutAction` menghitung saldo, panggil `autoCompleteShippedForSeller(sellerId, 48 jam)`. Ini memastikan saldo seller selalu mutakhir saat dibutuhkan.

**C. Tombol admin `/admin/maintenance`.** Server action khusus admin yang memanggil tiga fungsi (auto-cancel, auto-complete, sinkron pembayaran) dan menampilkan hasil serta `lastRunAt`. Catat di audit log.

**D. Pengaman konkurensi.** Bungkus semua sweep dengan `pg_try_advisory_xact_lock(hashtext('maintenance:<nama>'))` agar tidak berjalan ganda; throttle dengan tabel `maintenance_runs (name PRIMARY KEY, last_run_at)` (mis. maksimum sekali per menit per jenis).

**E. Saat pindah ke VPS:** cukup panggil route `/api/cron/*` yang sama dari `systemd timer`/`cron` (`curl -H "Authorization: Bearer $CRON_SECRET"`); logika sweep lazy tetap sebagai lapisan cadangan.

---

## 3. Temuan Lain (P1/P2)

### M9. Pola fallback-ke-memori masih ada di modul baru ✅

`lib/data/notifications.ts` (gagal DB ⇒ baca `mockNotifications`), `lib/data/reviews.ts` (`catch { return false }`), unggahan gambar/KYC (fallback ke `/api/mock-storage`). Terapkan satu helper `assertMockAllowed()` dan aturan: **di production, kegagalan DB/storage ⇒ error terlihat**, bukan fallback. Tambahkan test yang mensimulasikan `pool.query` gagal dan memastikan fungsi tidak mengembalikan data mock.

### M10. Batas pembatalan 6 jam memakai `updatedAt` ✅

`cancelPaidOrderAction` memakai `order.updatedAt` sebagai "waktu bayar". `updatedAt` berubah setiap ada pembaruan order, sehingga jendela bisa bergeser atau tidak sesuai. Tambahkan kolom `paid_at timestamptz` yang diisi sekali pada transisi ke `paid`, dan pakai kolom itu. Tambahkan juga `shipped_at` dan `completed_at` (untuk auto-complete 48 jam dan metrik).

### M11. Ganti password dari profil ✅

- Tidak ada rate limit pada verifikasi `oldPassword` (`signInWithPassword`); sesi yang tercuri dapat menebak password lama. Tambahkan `checkRateLimit("pwd_change:"+userId, 5, 15*60_000)`.
- Untuk akun yang hanya memakai Google (tanpa password), tampilkan jalur "Atur kata sandi" lewat tautan reset, bukan pesan "kata sandi salah".

### M12. Fallback domain hardcode ✅

`lib/email.ts` (`APP_URL`) dan `lib/notifications.ts` masih jatuh ke `https://bji-hub.vercel.app`. Di production `NEXT_PUBLIC_APP_URL` wajib sudah diisi oleh validasi env; hapus fallback agar kesalahan konfigurasi terlihat di staging.

### M13. Detail lain

- `webhook`: setelah `paid`, notifikasi dan email dibungkus `try { ... } catch { }` besar yang menelan semua; ganti dengan log per langkah.
- Cache pelacakan 10 menit berada di memori instance (serverless): efeknya kecil; pertimbangkan tabel cache jika kuota kurir menipis.
- Pemeriksaan HTTP `health`: sudah dengan cache; tambahkan `?deep=1` ber-token untuk pemeriksaan Storage dan payment provider.
- `autoCancelExpiredPendingOrders` masih memakai `console.error` di satu cabang; ganti `logger.error`.

---

## 4. Yang Masih Perlu **[HUMAN]**

- [ ] Verifikasi CSP di staging (M8) dan baca konsol browser.
- [ ] Bucket `seller-kyc`: privat, batas ukuran, allow-list MIME.
- [ ] Supabase: "Secure password change", Redirect URLs, template email Indonesia, MFA admin, backup/PITR **dan uji restore**.
- [ ] Midtrans: notification URL (sandbox → production), uji `settlement/pending/expire/deny/cancel`, refund tiap metode, dan skenario M3.
- [ ] Sentry (atau log terpusat) + uptime monitor ke `/api/health`.
- [ ] Staging terpisah (DB, kunci, bucket).
- [ ] Tinjauan hukum atas `/privacy`, `/refund-policy`, `/shipping-policy`, `/terms`, kebijakan retensi (khususnya hapus akun dan KYC), kewajiban PSE, pajak, badan usaha untuk akun Midtrans production.
- [ ] Rotasi kunci bila versi lama pernah live.
- [ ] Verifikasi RLS seluruh tabel baru (`refunds`, `notifications`, `audit_logs`, `webhook_events`, `user_addresses`, `review_reports`, `maintenance_runs`) dengan anon key: semua harus `[]`.

---

## 5. Fitur dan Kualitas yang Tersisa (P2/P3)

| Area          | Item                                                                                                                                                                                                                               |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fitur         | Pesan pembeli–seller pasca-order; voucher; invoice resmi (nomor berurutan, PDF); payout terjadwal + bukti transfer; i18n/multi-mata uang (simpan `currency` di order dari sekarang)                                                |
| Performa      | Cache katalog/produk/toko dengan `unstable_cache`/ISR + `revalidateTag`; `next/image` konsisten; analisis bundel; targetkan LCP ≤ 2.5 dtk, CLS ≤ 0.1, INP ≤ 200 ms                                                                 |
| SEO           | Sitemap dinamis, `canonical`, data terstruktur `Product/Offer/AggregateRating` lolos Rich Results Test, OG image per produk                                                                                                        |
| UX            | Timeline status order (menunggu bayar → dibayar → dikirim → selesai / dibatalkan → refund), batas waktu bayar terlihat, banner offline, error state per daftar, pemilih wilayah                                                    |
| Aksesibilitas | Lighthouse mobile ≥ 90 pada 6 halaman utama; axe pada checkout; tombol ≥ 44 px                                                                                                                                                     |
| Data          | Constraint DB (`CHECK` stok/kuantitas/jumlah/rating/status), indeks `orders (listing_id, status, created_at)`, `refunds (status)`, migrasi lewat `prisma migrate` (bukan skrip `.mjs` terpisah), `paid_at/shipped_at/completed_at` |
| Keamanan      | Turnstile di register, lupa password, inquiry, checkout guest; MFA admin; pentest dasar (OWASP ZAP) dengan fokus IDOR pada setiap route `[id]/[slug]` dan setiap aksi yang menerima ID dari klien                                  |

---

## 6. Pengujian: Tambahan Khusus untuk Temuan Ini

CI sekarang: typecheck, lint, `npm audit`, test, build. Tambahkan:

| Level                               | Skenario                                                                                                                                                                                                                                                                                             |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authz (matriks peran × kepemilikan) | `replyToReview` oleh seller lain/pemilik/dua kali; `reportReview` oleh pelapor sama dua kali; `requestVerification` dengan path seller lain; `getKycDocumentSignedUrl` oleh seller lain                                                                                                              |
| Integrasi (Postgres `_test` di CI)  | `cancelOrderWithRefund` gagal di tengah ⇒ rollback penuh; retry refund pada order bukan `canceled` ⇒ `voided`; webhook: error di tengah proses lalu kirim ulang ⇒ `paid`; webhook `paid` pada order `canceled` ⇒ refund `pending` + log anomali; checkout paralel pada stok terakhir; payout paralel |
| Akun                                | Hapus akun: order aktif (termasuk `disputed`) ⇒ ditolak; kegagalan DB ⇒ `fail`; sukses ⇒ tidak ada PII di tabel yang disebut M6, `auth.users` terhapus                                                                                                                                               |
| Notifikasi                          | Notifikasi seller muncul di akun pemilik toko                                                                                                                                                                                                                                                        |
| E2E (Playwright, provider `mock`)   | Guest→checkout→sukses; seller membalas ulasan miliknya; admin memutus dispute; admin `/admin/maintenance`                                                                                                                                                                                            |
| E2E negatif                         | `/admin`, `/dashboard` tanpa login; invoice milik orang lain; manipulasi ID di aksi ulasan/KYC                                                                                                                                                                                                       |
| Pemulihan                           | Latihan "refund gagal → retry", latihan "webhook hilang → rekonsiliasi", latihan restore DB                                                                                                                                                                                                          |

Tambahkan job CI: integrasi dengan service Postgres, e2e smoke terhadap build produksi, `vitest --coverage` (ambang awal 60% untuk `lib/` dan `actions/`).

---

## 7. Rencana Prioritas

### Gate 0: Beta tertutup (sandbox) · 1–2 minggu

- [ ] **M1** Refund transaksional + guard retry + status `voided`
- [ ] **M2** Webhook: tidak ada dedup-gerbang; catat setelah sukses
- [ ] **M3** Penanganan pembayaran terlambat pada order batal
- [ ] **M4** Otorisasi balasan ulasan + tabel laporan
- [ ] **M5** `notifySeller` memakai `userId` pemilik toko
- [ ] **M6** Hapus akun: reauth, fail-closed, anonimisasi penuh, hapus akun Supabase
- [ ] **M7** KYC: validasi path, tanpa fallback mock di production, audit akses admin
- [ ] **M8** Verifikasi CSP di staging; hapus `unsafe-eval` di production
- [ ] Pemeliharaan lazy (Bagian 2.2) agar bisnis berjalan tanpa cron
- [ ] Pastikan 6 file test yang gagal di sandbox hijau di CI

### Gate 1: Publik terbatas, uang nyata · 3–6 minggu

- [ ] M9–M13; `paid_at/shipped_at/completed_at`
- [ ] Sentry + uptime + backup teruji + staging + runbook
- [ ] Integrasi test dan e2e di CI, coverage, axe, Lighthouse ≥ 90
- [ ] `prisma migrate`, constraint DB, indeks
- [ ] Tinjauan hukum, MFA admin, verifikasi RLS semua tabel
- [ ] Akun Midtrans production disetujui

### Gate 2: Skala dan global

- [ ] Cron di VPS (Bagian 2.2-E), cache katalog, uji beban
- [ ] Voucher, pesan, payout terjadwal, invoice resmi
- [ ] i18n/mata uang, gateway tambahan lewat `PaymentProvider`
- [ ] Pentest eksternal, retensi data otomatis

---

## 8. Checklist Go-Live

**Uang & stok**

- [ ] Refund diuji: berhasil; gagal lalu retry; `manual_required`; transisi gagal ⇒ tidak ada refund
- [ ] Webhook: error sementara lalu retry Midtrans ⇒ order `paid`; pembayaran terlambat ⇒ refund + alarm
- [ ] 10 checkout paralel pada stok 1 ⇒ satu pesanan; stok akhir 0
- [ ] Sweep lazy: pesanan kedaluwarsa melepas stok saat checkout berikutnya; saldo seller terbarui saat dibuka

**Keamanan & privasi**

- [ ] `DATA_SOURCE=prisma`, `ALLOW_MOCK_AUTH` tidak diset, `CRON_SECRET` terisi, `NEXT_PUBLIC_APP_URL` benar
- [ ] RLS aktif di semua tabel (uji anon key)
- [ ] CSP lolos uji staging; tidak ada `unsafe-eval` di production
- [ ] Balasan/laporan ulasan hanya oleh pihak berhak; path KYC terikat seller; bucket KYC privat
- [ ] Hapus akun menghapus akun Supabase dan PII (diuji end-to-end)
- [ ] MFA admin aktif; kunci dirotasi bila versi lama pernah live

**Operasional**

- [ ] Sentry/alert, uptime, backup teruji dan terdokumentasi, staging terpisah
- [ ] Runbook untuk: pembayaran tidak masuk, webhook gagal, refund gagal, stok tertahan, payout salah, kunci bocor

**Kualitas**

- [ ] CI hijau penuh (typecheck, lint, audit, test **termasuk 6 file yang gagal di sandbox**, build, integrasi, e2e)
- [ ] Lighthouse mobile ≥ 90; axe nol pelanggaran kritis/serius di checkout
- [ ] Tidak ada fallback mock/memori pada jalur production

**Hukum**

- [ ] Kebijakan ditinjau ahli dan selaras dengan perilaku sistem (refund, retensi, hapus akun)
- [ ] Persetujuan + versi tercatat di DB
- [ ] PSE, perizinan usaha, pajak dikonsultasikan

---

## 9. Tentang Target "Tanpa Bug dan Error"

Targetkan **kualitas yang dapat diukur**:

- **Tidak ada kerugian finansial yang diketahui:** refund transaksional dan idempoten, webhook tidak kehilangan event, penanganan pembayaran terlambat, payout dan stok atomik, audit log.
- **Tidak ada akses silang:** setiap aksi yang menerima ID dari klien memeriksa **kepemilikan data**, bukan hanya peran.
- **Deteksi dan pemulihan cepat:** monitoring, alert, backup teruji, runbook, feature flag.
- **Regresi tertahan:** integrasi + e2e + authz test wajib hijau di CI.
- **Anggaran error:** SLO awal (checkout sukses ≥ 99%, p95 halaman < 800 ms), ditinjau mingguan.

Setiap bug yang lolos ke production dicatat singkat (apa, dampak, akar masalah, perbaikan, test yang ditambah) agar tidak terulang.
