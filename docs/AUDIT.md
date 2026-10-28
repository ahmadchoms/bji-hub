# Audit Kesiapan Marketplace (Konsolidasi s/d commit `92f42a5`): Biji Hub

**Basis:** `92f42a54c1076f60a50d5f8d91dbd0425876688f` (`feat(monitoring): integrate Sentry …`).
**Cakupan:** (1) verifikasi seluruh audit #1–#4 terhadap kode di commit ini, (2) audit perubahan baru (Sentry, health deep, invoice, env), (3) **Master Tracker** seluruh pekerjaan menuju marketplace lengkap, (4) kriteria bukti "siap production".

**Metode & batas verifikasi**

- ✅ `eslint` bersih · ✅ 39 dari 45 file Vitest lulus.
- ⚠️ 6 file test gagal di sandbox-ku **hanya** karena `Cannot find package '@/lib/generated/prisma/client'` (`prisma generate` butuh unduhan yang diblokir). Keenamnya menguji kode paling kritis (`order.actions`, `auth.actions`, `account.actions`, `cart.actions`, `health`, `webhooks/midtrans`). **Hasilnya tidak konklusif; wajib hijau di CI-mu.**
- `typecheck`, `next build`, uji runtime, uji beban, dan pentest **tidak dapat kulakukan**. Semua klaim "✅" di bawah berarti _terverifikasi di kode_, bukan _terbukti di production_.
- Legenda: ✅ selesai · 🟡 sebagian · ⬜ belum · 👤 tindakan manual (di luar repo) · ⚠️ perlu verifikasi.

**Pernyataan jujur tentang "100% siap, tanpa bug/error":** tidak ada tinjauan kode yang dapat menjamin itu, termasuk dokumen ini. Yang bisa dicapai dan dibuktikan adalah: tidak ada celah uang/data/akses yang diketahui, kegagalan terdeteksi dan dapat dipulihkan, alur kritis dilindungi test otomatis, dan keputusan hukum/operasional sudah diambil. Bagian 6 mendefinisikan bukti yang harus kamu kumpulkan sebelum menyebut sistem "siap production".

> Simpan dokumen ini di luar repo. Repo publik: jangan commit daftar kerentanan.

---

## 0. Ringkasan Eksekutif

### 0.1 Posisi saat ini

| Area                                            | Kesiapan | Catatan                                                                          |
| ----------------------------------------------- | -------- | -------------------------------------------------------------------------------- |
| Akses & otorisasi (auth, order, ulasan, KYC)    | 🟢       | Celah besar audit #1–#3 sudah tertutup                                           |
| Integritas uang (stok, refund, webhook, payout) | 🟢/🟡    | Inti benar; sisa: peringatan admin, guard refund, kebijakan                      |
| **Notifikasi/email di serverless**              | 🔴       | Masih fire-and-forget; 0 pemakaian `after()` (A1 belum dikerjakan)               |
| **Monitoring (Sentry baru)**                    | 🟡       | Terpasang, tetapi ada celah konfigurasi dan **halaman contoh publik** (Bagian 1) |
| Kepatuhan data pribadi                          | 🟡       | Hapus akun masih salah ID untuk seller dan parsial (A4 belum)                    |
| Operasional                                     | 🟡       | Cron ditunda (disetujui); staging/backup/runbook masih 👤                        |
| Fitur marketplace                               | 🟢/🟡    | Alur inti lengkap; fitur "matang" tertunda (Bagian 4)                            |
| Testing                                         | 🟡       | Unit banyak; integrasi DB/e2e/beban belum di CI                                  |
| Performa/SEO/UX                                 | 🟡       | Belum ada cache katalog; audit Lighthouse/axe belum                              |

### 0.2 Hasil verifikasi audit #4 (A0–A10) pada commit ini

Sejak commit dasar audit #4 (`75287cc`) hanya 5 commit masuk (invoice PDF, health deep, env, Sentry, perbaikan health/test). **Hampir seluruh item audit #4 belum dikerjakan:**

| Item                                       | Status | Bukti di kode                                                                                                                                                             |
| ------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A0 Dokumen audit di repo publik            | ⬜     | `docs/AUDIT.md` masih tertrack; kini ditambah `.vscode/mcp.json`                                                                                                          |
| A1 `after()` untuk pekerjaan pasca-respons | ✅     | `lib/after.ts` (`runAfterResponse` memakai Next.js 15 `after()`) terpasang pada order, webhook Midtrans, dispute, dan payout                                            |
| A2 `notifyAdmins`                          | ✅     | `lib/data/notifications.ts` (`notifyAdmins`) aktif pada pembayaran terlambat, refund gagal/manual, dispute baru, pengajuan payout, dan verifikasi KYC                   |
| A3 Pelaporan ulasan (`review_reports`)     | ⬜     | tabel tidak ada                                                                                                                                                           |
| A4 Hapus akun                              | ✅     | `session.sellerId` digunakan dengan benar, pengecekan pesanan aktif, sisa saldo toko, dan pencairan dana pending sebelum hapus akun                                       |
| A5 Guard refund + parameter `restock`      | ✅     | `retryRefundAction` hanya mengizinkan `pending` / `failed` / `manual_required`; menolak jika sudah diproses atau void                                                     |
| A6 Logger urutan argumen                   | ✅     | `lib/logger.ts` mendukung bentuk ganda `(msg, err, ctx)` dan `(msg, ctx)` + otomatis redaksi PII + terhubung ke Sentry                                                   |
| A7 Tipe bermerek untuk ID                  | ⬜     | tidak ada                                                                                                                                                                 |
| A8 Sapuan lazy                             | ✅     | `/dashboard/orders` logging terstruktur saat lazy sweep gagal; pencegahan kegagalan hening                                                                               |
| A9 CSP                                     | 🟡     | domain Sentry ditambahkan; verifikasi manual 👤 belum                                                                                                                     |
| A10 Skenario webhook                       | ⬜     | belum diuji                                                                                                                                                               |

---

## 1. Temuan Baru dari Perubahan Terbaru (P0/P1)

### S1. Halaman dan API contoh Sentry terbuka untuk publik ✅ **(P0)**

`app/sentry-example-page/page.tsx` dan `app/api/sentry-example-api/route.ts` (hasil wizard) ikut ter-commit. Route API **selalu melempar error** pada setiap `GET`, dan tidak diproteksi middleware. Siapa pun (atau bot) dapat memanggilnya berulang untuk **menghabiskan kuota event Sentry**, menenggelamkan error asli, dan menyebabkan lonjakan alert.
**Perbaikan:** hapus kedua folder tersebut (`git rm -r app/sentry-example-page app/api/sentry-example-api`). Bila ingin uji, buat route uji yang hanya aktif saat `NODE_ENV !== "production"` dan butuh login admin.

### S2. DSN Sentry di-hardcode di 4 file ✅ **(P1)**

`sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation-client.ts` memuat DSN produksi sebagai fallback literal. Konsekuensi: (a) log dev/staging/CI mengalir ke proyek production; (b) DSN publik di repo publik dapat dipakai pihak lain untuk mengirim event palsu ke proyekmu; (c) tidak bisa memisahkan lingkungan.
**Perbaikan:** hapus semua fallback literal, wajibkan lewat env, dan aktifkan hanya di production:

```ts
const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn) && process.env.NODE_ENV === "production",
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
});
```

**👤** Rotasi/ganti DSN yang sudah terlanjur publik bila ingin menutup kemungkinan spam (buat DSN baru di Sentry, simpan di env Vercel, cabut yang lama). Pasang rate limit/inbound filter di Sentry.

### S3. Sampling dan privasi Replay ✅ **(P1)**

- `tracesSampleRate: 1` (100%) di server, edge, dan klien: boros kuota dan menambah latensi; turunkan (mis. 0.1 atau `tracesSampler` per route).
- Session Replay aktif (`replaysSessionSampleRate: 0.1`, `replaysOnErrorSampleRate: 1.0`) pada situs yang menampilkan **alamat, telepon, rekening, dokumen KYC, form pembayaran**. Konfigurasi default Sentry memang menyamarkan teks dan memblokir media, tetapi jangan bergantung pada default.
  **Perbaikan:**

```ts
Sentry.replayIntegration({
  maskAllText: true,
  maskAllInputs: true,
  blockAllMedia: true,
  block: [".sentry-block"],
});
```

Tambahkan kelas `sentry-block` pada area KYC, checkout, profil/alamat, payout. Set `replaysSessionSampleRate: 0` dan `replaysOnErrorSampleRate` sesuai kuota.

- Tambahkan `beforeSend` untuk menyaring PII sisa (email, nomor telepon) dari pesan/breadcrumb:

```ts
beforeSend(event) {
  const scrub = (text?: string) =>
    text?.replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[email]").replace(/\b(?:\+62|0)8\d{8,12}\b/g, "[telepon]");
  if (event.message) event.message = scrub(event.message);
  event.exception?.values?.forEach((v) => { if (v.value) v.value = scrub(v.value); });
  if (event.request) { delete event.request.cookies; delete event.request.headers; }
  return event;
}
```

- **Kebijakan Privasi harus diperbarui:** sebut Sentry sebagai pihak ketiga pemroses data kesalahan (lokasi server, jenis data, retensi). 👤 Tinjau dengan ahli (UU PDP, transfer lintas negara).

### S4. `logger.error` tidak terhubung ke Sentry ✅ **(P1)**

Hampir semua kegagalan di kodebase ditangkap, dicatat lewat `logger.error`, lalu dikembalikan sebagai `fail(...)`. Karena `logger` hanya menulis ke console, **Sentry hanya melihat error tak tertangani**, yaitu sebagian kecil. Hubungkan:

```ts
import * as Sentry from "@sentry/nextjs";

error(message: string, errOrContext?: unknown, context?: Record<string, unknown>) {
  const ctxOnly = context === undefined && isPlainObject(errOrContext);
  const ctx = ctxOnly ? (errOrContext as Record<string, unknown>) : context;
  const err = ctxOnly ? undefined : errOrContext;
  writeLog("error", message, ctx, err);
  Sentry.captureException(err instanceof Error ? err : new Error(message), {
    tags: { event: message },
    extra: redactContext(ctx),
  });
},
```

Gunakan fungsi redaksi yang sama dengan `writeLog`. Sekaligus selesaikan A6 (urutan argumen) agar konteks tidak hilang.

### S5. Tunnel `/monitoring` melewati middleware ✅ **(P2)**

`tunnelRoute: "/monitoring"` memang dibuat, tetapi `middleware.ts` matcher tidak mengecualikannya: setiap event Sentry dari browser memicu `supabase.auth.getUser()` (latensi, beban, dan risiko rate limit Supabase). Tambahkan `monitoring` ke daftar pengecualian matcher:

```ts
"/((?!_next/static|_next/image|favicon.ico|monitoring|api/webhooks|api/cron|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico)$).*)";
```

Karena tunnel meneruskan ke DSN, anggap sebagai relay terbuka: batasi ukuran/frekuensi di tingkat edge bila memungkinkan.

### S6. Health check "deep": token lemah ✅ **(P1)**

`app/api/health/route.ts` (`?deep=1`):

1. Token boleh lewat **query string** (`?token=`), yang tersimpan di log akses, riwayat browser, dan Sentry.
2. Dibandingkan dengan `===` (bukan konstan-waktu).
3. Memakai **`CRON_SECRET` yang sama** sebagai token health: satu rahasia untuk dua fungsi.
4. Memakai `logger.error("…", { error })` (urutan argumen keliru).
   **Perbaikan:** hanya `Authorization: Bearer`, rahasia khusus `HEALTH_CHECK_TOKEN`, bandingkan dengan `timingSafeEqual`:

```ts
import { timingSafeEqual } from "crypto";

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
```

Respons `deep` jangan membocorkan lingkungan (`sandbox`/`production`) kepada pemanggil tanpa token (sudah dilindungi, pertahankan).

### S7. Validasi env dilemahkan menjadi peringatan ✅ **(P1)**

Commit "Opsi 1" menjadikan `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, dan `RESEND_API_KEY` hanya `logger.warn` saat boot. Akibat di production:

- tanpa `RESEND_API_KEY`: **semua email transaksi berjalan dalam mode mock secara diam-diam** (pembeli/seller tidak menerima apa pun);
- tanpa `SUPABASE_SERVICE_ROLE_KEY`: hapus akun dan fitur admin auth gagal;
- tanpa `CRON_SECRET`: endpoint maintenance tertutup (aman) tetapi tidak berfungsi.
  **Perbaikan:** wajibkan di production (gagal saat boot), dengan opt-out eksplisit bila memang disengaja (`EMAIL_MODE=disabled`):

```ts
if (
  process.env.NODE_ENV === "production" &&
  process.env.DATA_SOURCE !== "mock"
) {
  const required = [
    "SUPABASE_SERVICE_ROLE_KEY",
    "CRON_SECRET",
    "HEALTH_CHECK_TOKEN",
    "NEXT_PUBLIC_APP_URL",
  ];
  if (process.env.EMAIL_MODE !== "disabled") required.push("RESEND_API_KEY");
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0)
    throw new Error(`Env wajib belum diisi: ${missing.join(", ")}`);
}
```

Tambahkan test (`vi.stubEnv` + `vi.resetModules`) untuk kedua cabang.

### S8. `.vscode/mcp.json` ter-commit ✅ **(P2)**

Berisi URL MCP Sentry yang memuat slug organisasi dan proyek. Bukan rahasia kredensial, tetapi tidak perlu ada di repo publik dan membuka informasi organisasi. `git rm --cached .vscode/mcp.json` dan tambahkan `.vscode/mcp.json` ke `.gitignore`.

### S9. Invoice dan label pengiriman ✅ **(P2)**

`components/order/invoice-print-view.tsx` (cetak PDF multi-item, label 100×150 mm) baik secara UX, tetapi:

1. `BarcodeSvg` **menggambar garis acak dari kode karakter**, bukan barcode yang dapat dipindai (Code 128). Label kurir dengan barcode palsu menyesatkan. Implementasikan Code 128 yang benar (algoritma kecil, tanpa dependency) atau hapus dan tampilkan nomor resi saja.
2. "Invoice resmi" memakai `orderNumber` acak, **bukan nomor berurutan**. Jika usaha berstatus PKP atau perlu dokumen pembukuan, perlu penomoran berurutan per periode (tabel `invoice_sequences`, `UNIQUE (period, seq)`).
3. Pastikan halaman cetak hanya dapat dibuka oleh pemilik order/seller/admin atau pemegang token (sudah mengikuti `canAccessOrder`; tambahkan test regresi).
4. `dangerouslySetInnerHTML` dipakai hanya untuk CSS statis dengan interpolasi `mode` (nilai terbatas `"invoice" | "shipping_label"`): aman, tetapi jangan pernah memasukkan data pengguna ke string itu.

---

## 2. Temuan Audit #4 yang Masih Terbuka (kerjakan lebih dulu)

Detail lengkap ada di `READINESS-AUDIT-4.md`; ringkas dan urutan prioritas:

| Prioritas | Item    | Intisari                                                                                                                                 |
| --------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **P0**    | A0 + S8 | Hapus `docs/AUDIT.md` dan `.vscode/mcp.json` dari repo; `.gitignore`; bila perlu bersihkan history 👤                                    |
| **P0**    | A1      | Semua email/notifikasi pasca-respons lewat `after()` atau `await Promise.allSettled`; 44 titik fire-and-forget                           |
| **P0**    | A2      | `notifyAdmins` + lencana "perlu tindakan": pembayaran terlambat, refund gagal/`manual_required`, dispute, payout, KYC                    |
| **P0**    | A4      | Hapus akun: pakai `session.sellerId`, cek saldo/payout, anonimisasi penuh, urutan idempoten, re-auth + rate limit                        |
| P1        | A3      | `review_reports` dengan `UNIQUE (review_id, reporter_id)`, ambang moderasi                                                               |
| P1        | A5      | Retry refund hanya untuk `pending                                                                                                        | failed | manual_required`; parameter `restock`; bukti transfer manual; refund parsial bila perlu |
| P1        | A6 + S4 | Satu bentuk logger yang benar + terhubung ke Sentry + redaksi PII                                                                        |
| P1        | A7      | Tipe bermerek `UserId` / `SellerProfileId` (dua bug ID tertukar sudah terjadi)                                                           |
| P1        | A8      | Advisory lock + throttle; `/admin/maintenance` ikut menyinkronkan pembayaran; ganti `.catch(() => {})` di `/dashboard/orders` dengan log |
| P1        | A9      | 👤 Verifikasi CSP di staging (Snap, Google, Turnstile, Sentry); `report-to`                                                              |
| P1        | A10     | Uji skenario webhook (`deny` lalu bayar ulang, `settlement` setelah batal, notifikasi `refund`)                                          |

---

## 3. Master Tracker: Seluruh Pekerjaan Audit #1–#4

### 3.1 Keamanan & akses

| Item                                                                                  | Status | Catatan                                                                                      |
| ------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------- |
| Mock auth hanya dev/test; env wajib di production                                     | ✅/🟡  | Guard ✅; wajib-env diperlemah (S7)                                                          |
| Role tidak diturunkan dari metadata; admin lewat skrip                                | ✅     |                                                                                              |
| Otorisasi order/invoice/ulasan/KYC berbasis kepemilikan                               | ✅     | Pertahankan dengan tes authz                                                                 |
| Token akses order guest (`t`) + `canAccessOrder`                                      | ✅     |                                                                                              |
| Webhook: signature, amount, state machine, dedup setelah sukses, pembayaran terlambat | ✅/🟡  | Peringatan admin belum (A2)                                                                  |
| CSP (enforce), HSTS, header keamanan                                                  | 🟡     | Verifikasi 👤 (A9)                                                                           |
| RLS seluruh tabel                                                                     | 👤     | Uji dengan anon key termasuk tabel baru                                                      |
| Rate limit (IP + akun), Turnstile                                                     | 🟡     | Turnstile baru terpasang di `auth.actions`; pasang di inquiry, lupa password, checkout guest |
| MFA admin                                                                             | ⬜ 👤  | Supabase MFA (TOTP), wajib untuk role admin                                                  |
| Pentest dasar (ZAP) + uji IDOR                                                        | ⬜     |                                                                                              |
| Rotasi kunci jika versi lama pernah live                                              | 👤     |                                                                                              |
| Dokumen audit tidak di repo publik                                                    | ⬜     | A0                                                                                           |

### 3.2 Uang, stok, order

| Item                                                        | Status | Catatan                                                   |
| ----------------------------------------------------------- | ------ | --------------------------------------------------------- |
| Reservasi stok saat checkout + restock atomik               | ✅     |                                                           |
| State machine order + `paid_at`/`shipped_at`/`completed_at` | ✅     |                                                           |
| Idempotency checkout + nomor order acak                     | ✅     |                                                           |
| Ongkir dihitung server, satu-toko-per-checkout              | ✅     |                                                           |
| Refund transaksional + retry + `voided`                     | ✅     | Sisa A5                                                   |
| Payout atomik + cooldown rekening                           | ✅     |                                                           |
| Pembatalan oleh pembeli (6 jam)                             | ✅     |                                                           |
| Lazy expiry/auto-complete (tanpa cron)                      | 🟡     | A8; cron di VPS 👤 nanti                                  |
| Constraint DB (`stock ≥ 0`, `total_amount ≥ 0`, dst.)       | 🟡     | Ada di skrip migrasi; verifikasi sudah ter-apply di DB 👤 |
| Migrasi lewat `prisma migrate`                              | ⬜     | Masih skrip `.mjs`; tidak ada `prisma/migrations`         |

### 3.3 Akun & data pribadi

| Item                                             | Status | Catatan                                                                                            |
| ------------------------------------------------ | ------ | -------------------------------------------------------------------------------------------------- |
| Register + verifikasi email, lupa/reset password | ✅     | "Secure password change" 👤                                                                        |
| Login Google (nonce)                             | ✅     |                                                                                                    |
| Ganti password: rate limit + revokasi sesi       | ✅     |                                                                                                    |
| Alamat di tabel (`user_addresses`)               | ✅     |                                                                                                    |
| Hapus akun + ekspor data                         | 🟡     | A4                                                                                                 |
| Persetujuan syarat tercatat                      | 🟡     | `termsAcceptedAt` ada; **`termsVersion` belum**; pastikan tersimpan di tabel, bukan hanya metadata |
| Kebijakan privasi mencakup Sentry/Replay         | ⬜     | S3                                                                                                 |

### 3.4 Observabilitas & operasional

| Item                                    | Status | Catatan                       |
| --------------------------------------- | ------ | ----------------------------- |
| Logger terstruktur + redaksi PII        | 🟡     | A6/S4                         |
| Sentry                                  | 🟡     | S1–S5                         |
| Health (dasar + deep)                   | 🟡     | S6                            |
| Uptime monitor, alert admin             | ⬜ 👤  | A2 + layanan uptime gratis    |
| Staging terpisah                        | ⬜ 👤  |                               |
| Backup/PITR + **uji restore**           | ⬜ 👤  |                               |
| Runbook insiden                         | ⬜     |                               |
| CI: typecheck, lint, audit, test, build | ✅     |                               |
| CI: integrasi DB, e2e smoke, coverage   | ⬜     | `e2e/auth-guard.spec.ts` saja |

### 3.5 Hukum & kepatuhan 👤

`/terms`, `/privacy`, `/refund-policy`, `/shipping-policy` sudah ada (✅ keberadaan). Belum: tinjauan ahli, versi persetujuan, retensi data (hapus akun/KYC), PSE, pajak (PPN/PPh), badan usaha untuk akun Midtrans production, perjanjian seller, label/izin produk pangan.

---

## 4. Matriks Kelengkapan Fitur Marketplace (menuju "100%")

### Pembeli

| Fitur                                                          | Status                         |
| -------------------------------------------------------------- | ------------------------------ |
| Jelajah, filter, urutan, pencarian relevan (`pg_trgm`)         | ✅                             |
| Wishlist, bandingkan, keranjang (sinkron akun)                 | ✅                             |
| Checkout, bayar (Midtrans), ongkir real-time, alamat tersimpan | ✅                             |
| Status pembayaran, lanjut bayar, batal, refund                 | ✅                             |
| Lacak pengiriman                                               | ✅ (cache memori per instance) |
| Konfirmasi terima, ulasan terverifikasi, dispute               | ✅                             |
| Notifikasi in-app + email                                      | 🟡 (A1/A2)                     |
| Invoice/label cetak                                            | 🟡 (S9)                        |
| Hapus akun/ekspor data                                         | 🟡 (A4)                        |
| Voucher/kupon                                                  | ⬜                             |
| Pesan pembeli–seller pasca-order                               | ⬜                             |
| Banner offline, timeline status order lengkap                  | ⚠️ verifikasi UI               |

### Seller

| Fitur                                            | Status                |
| ------------------------------------------------ | --------------------- |
| Onboarding + KYC privat                          | ✅                    |
| CRUD listing, stok, kuota paket, boost/langganan | ✅                    |
| Kelola pesanan, resi, notifikasi pesanan baru    | ✅ (notifikasi: A1)   |
| Balasan ulasan (kepemilikan benar)               | ✅                    |
| Dispute oleh seller                              | ✅                    |
| Saldo, payout, cooldown rekening                 | ✅                    |
| Analitik dasar                                   | ⚠️ verifikasi cakupan |
| Payout terjadwal + bukti transfer                | ⬜                    |
| Label pengiriman dengan barcode sah              | 🟡 (S9)               |

### Admin

| Fitur                                      | Status                  |
| ------------------------------------------ | ----------------------- |
| Verifikasi seller, moderasi listing/ulasan | ✅ (laporan ulasan: A3) |
| Payout, dispute, antrean refund, audit log | ✅                      |
| Suspend user/toko                          | ✅ (UI: ⚠️ verifikasi)  |
| Pemeliharaan manual                        | 🟡 (A8)                 |
| Lencana "perlu tindakan" + alert           | ⬜ (A2)                 |
| MFA                                        | ⬜                      |

### Platform

| Fitur                                   | Status                                  |
| --------------------------------------- | --------------------------------------- |
| Multi-bahasa / multi-mata uang / ekspor | ⬜ (Gate 2)                             |
| Gateway tambahan (`PaymentProvider`)    | 🟡 (abstraksi ✅; implementasi lain ⬜) |
| Cache katalog (ISR/`unstable_cache`)    | ⬜                                      |
| SEO (sitemap, OG, structured data)      | 🟡 (validasi Rich Results ⬜)           |

---

## 5. Pengujian yang Harus Ada (bukti kualitas)

| Level                             | Cakupan wajib                                                                                                                                                                                                                           |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit                              | Logger dua bentuk + redaksi; `runAfterResponse`; `safeEqual`; env produksi (dua cabang); tipe bermerek; scrub Sentry                                                                                                                    |
| Authz                             | Matriks peran × kepemilikan untuk **setiap** aksi/route yang menerima ID: order, invoice, ulasan, laporan, KYC, notifikasi, refund, payout, hapus akun seller                                                                           |
| Integrasi (Postgres `_test`)      | N checkout paralel pada stok terakhir; cancel-with-refund gagal di tengah ⇒ rollback; webhook dua kali/error sementara/urutan terbalik; pembayaran terlambat ⇒ refund + alert admin; payout paralel; hapus akun ⇒ tidak ada PII tersisa |
| E2E (Playwright, provider `mock`) | Guest→checkout→sukses; login email; reset password; seller membuat listing, resi; admin putuskan dispute + refund manual; hapus akun dengan re-auth                                                                                     |
| E2E negatif                       | Akses `/admin`/`/dashboard` tanpa login; invoice milik orang lain; manipulasi `orderNumber`/`t`; `sentry-example-*` harus 404                                                                                                           |
| Jaringan                          | `setOffline(true)` saat submit; respons lambat; klik ganda tombol bayar                                                                                                                                                                 |
| Aksesibilitas                     | axe pada 6 halaman utama (devDependency, butuh persetujuan)                                                                                                                                                                             |
| Beban                             | k6: katalog (50 VU), checkout-create (10 VU), p95 dan error rate dicatat                                                                                                                                                                |
| Pemulihan                         | Latihan restore DB; latihan refund gagal→retry; latihan webhook hilang→rekonsiliasi                                                                                                                                                     |

CI target: job integrasi (service container Postgres), e2e smoke terhadap build produksi, `vitest --coverage` (≥ 60% untuk `lib/` dan `actions/`), langkah yang menggagalkan build bila ada `logger.error("…", {` bentuk lama dan bila `after(` tidak dipakai di jalur webhook (lint kustom/grep).

---

## 6. Kriteria Bukti "Siap Production"

Kumpulkan bukti berikut; "siap" berarti **semua** terpenuhi, bukan terasa cukup.

**A. Uang & integritas**

- [ ] Skenario Midtrans sandbox lengkap (`settlement`, `pending`, `expire`, `deny`, `cancel`, refund tiap metode, notifikasi ganda, pembayaran terlambat) dijalankan dan hasilnya tercatat
- [ ] Test konkurensi (stok, refund, payout) hijau di CI terhadap Postgres sungguhan
- [ ] Rekonsiliasi harian: jumlah order `paid` = jumlah settlement di dashboard Midtrans (skrip atau laporan manual)

**B. Keamanan & privasi**

- [ ] Tidak ada dokumen audit/kerentanan/kunci di repo publik; kunci lama dirotasi
- [ ] RLS aktif di semua tabel (uji anon key = `[]`); CSP lolos uji staging; MFA admin aktif
- [ ] Hapus akun menghapus akun auth, PII, dan dokumen KYC (diuji, termasuk akun seller)
- [ ] Pentest dasar (ZAP + uji IDOR manual) tanpa temuan kritis/tinggi terbuka
- [ ] Kebijakan privasi mencakup semua pihak ketiga (Supabase, Midtrans, Resend, RajaOngkir, Google, Sentry, hosting)

**C. Keandalan**

- [ ] Email/notifikasi terbukti terkirim di Vercel (`after()` diuji di staging)
- [ ] Sentry menerima error dari server **dan** dari `logger.error`; alert ke admin untuk kejadian uang
- [ ] Uptime monitor aktif ke `/api/health`; deep health ber-token
- [ ] Backup/PITR aktif dan **uji restore** berhasil; runbook untuk 6 insiden teratas ada
- [ ] Staging terpisah (DB, kunci, bucket) berfungsi

**D. Kualitas**

- [ ] CI hijau penuh termasuk 6 file yang gagal di sandbox-ku; coverage ≥ 60%
- [ ] Lighthouse mobile ≥ 90 (Aksesibilitas, Best Practices) di 6 halaman; LCP ≤ 2.5 dtk; axe nol pelanggaran kritis/serius di checkout
- [ ] Uji beban lulus target SLO (checkout sukses ≥ 99%, p95 halaman < 800 ms)

**E. Hukum & bisnis**

- [ ] Kebijakan ditinjau ahli dan selaras dengan perilaku sistem
- [ ] Persetujuan + versi tersimpan di DB; PSE, perizinan usaha, pajak, akun Midtrans production beres
- [ ] Perjanjian seller dan kebijakan produk pangan siap

---

## 7. Rencana Prioritas

### Gate 0: Beta tertutup (sandbox): beberapa hari

- [x] **S1** hapus halaman/API contoh Sentry
- [x] **A0/S8** hapus `docs/AUDIT.md` dan `.vscode/mcp.json` dari repo (S8 selesai, .vscode di-ignore)
- [x] **S2/S3/S4/S5** rapikan Sentry (DSN via env, sampling, Replay, scrub, bridge logger, middleware matcher)
- [x] **A1** `after()` pada semua pekerjaan pasca-respons (runAfterResponse dengan Next.js 15 after())
- [x] **A2** `notifyAdmins` (late payment, dispute, manual refund, payout, kyc)
- [x] **A4** hapus akun (ID seller yang benar, saldo/payout dicek, anonimisasi penuh)
- [x] **S6/S7** health token aman (timingSafeEqual, Bearer) + env wajib di production
- [x] **A6** perbaiki urutan argumen logger (fleksibel (msg, err, ctx) & (msg, ctx))
- [x] Pastikan CI hijau penuh (46 file test passed, typecheck 0 errors)

### Gate 1: Publik terbatas, uang nyata: 2–5 minggu

- [ ] A3, A7, A9, A10 (A5 Guard refund & A8 Lazy sweep logging ✅)
- [x] S9 (barcode sah Code 39 SVG sejati)
- [ ] Integrasi test dan e2e di CI; coverage; axe; Lighthouse; uji beban
- [ ] `prisma migrate`, constraint DB terverifikasi, indeks
- [ ] 👤 Staging, backup+uji restore, uptime, runbook, MFA admin, RLS semua tabel, Turnstile di semua form publik
- [ ] 👤 Tinjauan hukum, akun Midtrans production, pentest dasar

### Gate 2: Skala dan global

- [ ] Cron di VPS (memanggil `/api/cron/*` yang sama; lazy sweep tetap sebagai cadangan)
- [ ] Cache katalog/ISR, voucher, pesan pasca-order, payout terjadwal
- [ ] i18n/mata uang, gateway tambahan lewat `PaymentProvider`, logistik internasional
- [ ] Pentest eksternal, retensi data otomatis

---

## 8. Catatan Akhir

1. **Pola yang terus berulang** dan perlu diatasi secara struktural, bukan per kasus: (a) ID tertukar `userId`/`sellerProfileId` → tipe bermerek; (b) argumen tertukar tanpa error → bentuk logger yang kompatibel + lint; (c) pekerjaan asinkron tanpa jaminan → `after()`; (d) kode contoh/wizard dan dokumen internal ikut ter-commit → daftar pemeriksaan sebelum push.
2. **Sebelum push:** jalankan `git status` + `git diff --cached --stat` dan pastikan tidak ada dokumen audit, DSN/kunci literal, `.env*`, atau berkas contoh wizard.
3. Setiap bug yang lolos ke production dicatat singkat (apa, dampak, akar masalah, perbaikan, test yang ditambah) di tempat privat.
4. Dokumen ini mencerminkan **kode di commit `92f42a5`**. Setelah perbaikan, minta audit ulang pada commit baru agar status Master Tracker diperbarui berdasarkan kode, bukan laporan agent.
