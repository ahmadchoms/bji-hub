# PRD.md — Product Requirement Document
## [Nama Platform] — Direktori & Marketplace Kopi Indonesia

| Field | Value |
|---|---|
| Versi Dokumen | 1.0 |
| Status | Approved for Development |
| Tipe Produk | B2C & B2B Coffee Directory Platform (Non-Payment Gateway) |
| Target Rilis MVP | 10–12 minggu |

---

## 1. Latar Belakang & Visi Produk

### 1.1 Problem Statement
Petani dan roaster kopi lokal di Indonesia kesulitan menjangkau pembeli B2C (konsumen akhir) maupun B2B (kedai kopi/kafe) secara langsung tanpa bergantung pada marketplace umum yang tidak dirancang khusus untuk industri specialty coffee (tidak ada atribut rasa, proses, asal biji, dsb). Di sisi lain, kedai kopi kesulitan menemukan supplier terverifikasi secara efisien.

### 1.2 Visi
Menjadi direktori kopi lokal nomor satu di Indonesia yang menghubungkan petani/roaster dengan pembeli B2C & B2B, dengan visi jangka panjang ekspansi ke pasar internasional.

### 1.3 Prinsip Bisnis Inti
- **Non-Payment Gateway / Non-Escrow** — platform tidak pernah menyentuh dana transaksi kopi. Seluruh transaksi terjadi langsung antara penjual dan pembeli di luar platform.
- **Model Directory/Ad Platform** — pendapatan berasal dari jasa visibilitas (subscription, iklan, verifikasi), bukan dari persentase transaksi.
- **Low-Maintenance** — arsitektur dan fitur dirancang agar dapat dioperasikan oleh tim kecil (mahasiswa) tanpa monitoring harian intensif.

---

## 2. Target Pengguna & Persona

| Persona | Deskripsi | Kebutuhan Utama |
|---|---|---|
| **Petani/Roaster (Seller)** | Produsen kopi skala kecil-menengah, ingin memperluas pasar tanpa ribet urusan pembayaran online | Visibilitas produk, kemudahan kontak dengan buyer, kepercayaan (badge) |
| **Buyer B2C** | Penikmat kopi individu mencari biji/roast tertentu | Pencarian mudah, info rasa detail, kontak langsung ke penjual |
| **Buyer B2B (Kedai Kopi/Kafe)** | Pembeli rutin skala grosir | Info harga grosir, kuantitas minimum order, kontak cepat, supplier terverifikasi |
| **Admin Platform** | Tim internal pengelola | Moderasi listing, approve verifikasi, monitoring revenue |

---

## 3. Model Bisnis & Monetisasi

| Sumber Income | Mekanisme | Target |
|---|---|---|
| Subscription (SaaS) | Tier Free/Growth/Business, biaya bulanan/tahunan | Seller |
| Promoted/Boosted Listing | Biaya sekali bayar untuk visibilitas prioritas X hari | Seller |
| Verification Badge | Biaya sekali/berkala untuk badge terverifikasi | Seller |
| Lead Generation B2B *(fase 2)* | Pay-per-lead atau subscription akses RFQ | Buyer B2B |
| Affiliate Link-Out *(fase 2)* | Komisi dari partner alat seduh/logistik | — |

> **Catatan hukum**: Platform tidak menyelenggarakan sistem pembayaran transaksi kopi (bukan PJSP di bawah pengawasan Bank Indonesia). Payment gateway yang digunakan (Midtrans) **hanya** untuk transaksi biaya sewa lapak (subscription) dan boost iklan — bukan dana pembelian kopi.

---

## 4. Ruang Lingkup MVP (10–12 Minggu)

### 4.1 In-Scope

| Modul | Fitur |
|---|---|
| Seller Onboarding | Registrasi, profil toko, upload dokumen verifikasi |
| Listing Management | CRUD listing kopi, upload gambar, taste profile, kategori |
| Discovery | Browse, search, filter (kategori, daerah asal, harga, sertifikasi) |
| Contact Flow | Tombol WhatsApp click-to-chat, form inquiry B2B (RFQ) |
| Monetisasi | Subscription tier, boost listing, badge verifikasi (approval manual) |
| Analytics | Views & klik kontak per listing, dashboard sederhana |
| Admin Panel | Approve verifikasi, moderasi listing, riwayat transaksi |

### 4.2 Out-of-Scope (Fase 2+)

- Pay-per-lead marketplace B2B otomatis
- Sistem rating & review publik penuh
- In-app real-time chat
- Verifikasi dokumen otomatis (OCR/AI)
- Multi-bahasa & multi-currency (persiapan ekspor)
- Promoted search ranking berbasis algoritma

---

## 5. Functional Requirements (User Stories)

### 5.1 Seller

| ID | User Story | Kriteria Penerimaan |
|---|---|---|
| SL-01 | Sebagai seller, saya ingin mendaftar dan melengkapi profil toko | Form registrasi tersimpan dengan validasi wajib (nama toko, provinsi, kota, WA aktif) |
| SL-02 | Sebagai seller, saya ingin membuat listing kopi dengan detail taste profile | Listing tersimpan dengan kategori, harga, min. order qty, taste profile opsional |
| SL-03 | Sebagai seller, saya ingin melihat performa listing saya | Dashboard menampilkan views & klik kontak per listing |
| SL-04 | Sebagai seller, saya ingin berlangganan tier berbayar | Redirect ke Midtrans Snap, status subscription ter-update otomatis via webhook |
| SL-05 | Sebagai seller, saya ingin boost listing tertentu | Listing ditandai `is_boosted=true` dengan `boost_until` sesuai durasi dibeli |
| SL-06 | Sebagai seller, saya ingin badge terverifikasi | Upload dokumen → status `pending` → admin approve → `is_verified=true` |

### 5.2 Buyer

| ID | User Story | Kriteria Penerimaan |
|---|---|---|
| BY-01 | Sebagai buyer, saya ingin mencari kopi berdasarkan filter | Hasil filter sesuai kategori/daerah/harga/sertifikasi real-time |
| BY-02 | Sebagai buyer, saya ingin melihat detail rasa kopi | Halaman detail menampilkan taste profile (radar chart bila data tersedia) |
| BY-03 | Sebagai buyer, saya ingin menghubungi penjual langsung | Klik tombol → terbuka WhatsApp dengan pesan prefilled berisi ID listing |
| BY-04 | Sebagai buyer B2B, saya ingin mengirim RFQ terstruktur | Form inquiry tersimpan dan terkirim notifikasi ke seller |

### 5.3 Admin

| ID | User Story | Kriteria Penerimaan |
|---|---|---|
| AD-01 | Sebagai admin, saya ingin approve/reject verifikasi seller | Status berubah, seller menerima notifikasi email |
| AD-02 | Sebagai admin, saya ingin memoderasi laporan listing | Listing dengan laporan tervalidasi otomatis di-suspend sementara |
| AD-03 | Sebagai admin, saya ingin melihat riwayat transaksi | Daftar payment (subscription/boost) dengan status & referensi Midtrans |

---

## 6. Non-Functional Requirements

| Kategori | Requirement |
|---|---|
| Performance | LCP < 2.5s pada halaman katalog (mobile 4G) |
| Accessibility | WCAG 2.1 AA minimum (kontras warna, keyboard navigation, alt text) |
| Responsiveness | Mobile-first, breakpoint sesuai `DESIGN.md` |
| Security | RLS aktif di Supabase, validasi input server-side (Zod) di semua form |
| Availability | Target uptime 99% (bergantung pada Vercel/Supabase SLA) |
| SEO | Server-side rendering untuk halaman katalog & detail listing |

---

## 7. Success Metrics (KPI MVP)

| Metrik | Target 3 Bulan Pertama |
|---|---|
| Jumlah seller terdaftar | 50+ |
| Jumlah listing aktif | 150+ |
| Conversion rate (views → klik kontak) | ≥ 5% |
| Seller berlangganan tier berbayar | ≥ 15% dari total seller aktif |
| Retensi seller bulanan | ≥ 70% |

---

## 8. Risiko & Asumsi

| Risiko | Mitigasi |
|---|---|
| Seller enggan bayar subscription di awal | Freemium tier + trial period tier berbayar |
| Ketergantungan komunikasi via WhatsApp pihak ketiga | Sisipkan tracking parameter di link WA untuk tetap merekam lead |
| Perubahan regulasi KBLI/OSS RBA | Konsultasi berkala dengan konsultan legal saat scale-up |
| Tim kecil, waktu terbatas (mahasiswa) | MVP scope ketat, fitur kompleks (in-app chat, pay-per-lead) ditunda ke fase 2 |

---

## 9. Timeline Ringkas

Lihat detail fase pengerjaan teknis di `ARCHITECTURE.md`. Ringkasan:

| Minggu | Fokus |
|---|---|
| 0–1 | Setup & wireframe |
| 2–3 | Auth & seller onboarding |
| 4–5 | Listing CRUD & katalog publik |
| 6 | Contact flow |
| 7–8 | Monetisasi (subscription + boost) |
| 9–10 | Dashboard & admin panel |
| 11–12 | QA, responsive polish, deployment |

---

## 10. Dokumen Terkait

- `DESIGN.md` — Design system & UI/UX guidelines
- `ARCHITECTURE.md` — Arsitektur teknis & engineering guidelines
