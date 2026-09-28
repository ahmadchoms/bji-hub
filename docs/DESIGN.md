# DESIGN.md — Design System & UI/UX Guidelines
## [Nama Platform] — Direktori & Marketplace Kopi Indonesia

| Field | Value |
|---|---|
| Versi Dokumen | 1.0 |
| Target Audiens | Gen-Z & Gen-Alpha (buyer B2C), profesional kedai kopi (buyer B2B), petani/roaster (seller) |
| Prinsip Desain | Warm, earthy, modern, dipercaya (trustworthy), mobile-first |

---

## 1. Brand Visual Identity

### 1.1 Color Palette

Palet dibangun di sekitar warna primer **Warm Roasted Brown**, merepresentasikan kehangatan biji kopi sangrai, dipadukan dengan warna netral krem/kertas dan aksen hijau organik untuk elemen kepercayaan (verified/organic).

#### Primary
| Token | HEX | Penggunaan |
|---|---|---|
| `primary-900` | `#2E150C` | Teks di atas primary-100/50, hover state gelap |
| `primary-700` | `#3D1D10` | Hover/active button primary |
| `primary-600` | `#512615` | **Primary brand color** — tombol utama, header, logo |
| `primary-400` | `#7A4A34` | Border aktif, ikon sekunder |
| `primary-100` | `#EFDFD5` | Background badge/pill ringan |
| `primary-50` | `#F8F1EC` | Background section terang bernuansa coklat |

#### Secondary (Caramel/Latte — turunan warna susu kopi)
| Token | HEX | Penggunaan |
|---|---|---|
| `secondary-700` | `#8A5A2E` | Hover state elemen sekunder |
| `secondary-500` | `#C08552` | Aksen sekunder, ikon kategori, garis pemisah dekoratif |
| `secondary-200` | `#E8C9A6` | Background highlight ringan |
| `secondary-50` | `#FBF3E9` | Background card alternatif |

#### Accent (Forest Green — sinyal organik/terverifikasi/eco)
| Token | HEX | Penggunaan |
|---|---|---|
| `accent-700` | `#1E4B36` | Teks di atas accent-100 |
| `accent-500` | `#2F6D4F` | Badge "Verified", tag "Organik", CTA sekunder |
| `accent-100` | `#DCEEE3` | Background badge accent |

#### Neutral (Krem/Kertas — dasar layout)
| Token | HEX | Penggunaan |
|---|---|---|
| `neutral-900` | `#1F1815` | Teks utama (headings, body) |
| `neutral-700` | `#4A403A` | Teks sekunder/caption |
| `neutral-500` | `#8C8078` | Placeholder, teks disabled |
| `neutral-300` | `#D8CFC5` | Border default |
| `neutral-100` | `#F0E9E1` | Background section |
| `neutral-50` | `#FAF6F1` | Background halaman (page bg) |

#### Surface
| Token | HEX | Penggunaan |
|---|---|---|
| `surface-base` | `#FFFFFF` | Card, modal, input background |
| `surface-alt` | `#FAF6F1` | Background halaman |
| `surface-overlay` | `rgba(31, 24, 21, 0.6)` | Modal overlay/backdrop |

#### Status
| Token | HEX | Penggunaan |
|---|---|---|
| `status-success` | `#2F855A` | Sukses (pembayaran berhasil, verifikasi disetujui) |
| `status-warning` | `#D97706` | Peringatan (subscription akan berakhir) |
| `status-error` | `#DC2626` | Error/gagal (validasi form, pembayaran gagal) |
| `status-info` | `#2563EB` | Informasi netral (notifikasi umum) |

> **Kontras**: seluruh kombinasi teks-di-atas-background wajib diverifikasi minimum rasio 4.5:1 (WCAG AA) — gunakan token `-900`/`-700` untuk teks di atas `-100`/`-50`, jangan sebaliknya.

### 1.2 Logo & Iconography
- Ikon menggunakan gaya *outline*, konsisten satu keluarga (rekomendasi: [Lucide Icons](https://lucide.dev), sudah kompatibel dengan `shadcn/ui`).
- Logo utama menggunakan `primary-600` di atas `surface-base`, dan versi monokrom putih di atas `primary-600` untuk dark section.

---

## 2. Typography System

### 2.1 Font Selection

| Peran | Font | Alasan |
|---|---|---|
| Display/Heading | **Fraunces** (Google Fonts) | Serif hangat & sedikit editorial — memberi kesan artisanal/specialty coffee, tetap terasa modern untuk Gen-Z |
| Body/UI | **Plus Jakarta Sans** (Google Fonts) | Sans-serif geometris, sangat mudah dibaca di layar kecil, populer di produk digital modern |
| Angka/Harga/Data | **Space Grotesk** (Google Fonts) | Karakter geometris tegas — cocok untuk harga, statistik dashboard, dan skor taste profile |

```css
/* next/font/google */
import { Fraunces, Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-display', weight: ['500', '600', '700'] });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-sans', weight: ['400', '500', '600'] });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-mono', weight: ['500', '700'] });
```

### 2.2 Type Scale (Mobile-First)

| Token | Mobile (base) | Desktop (`lg:`) | Font | Weight | Line Height |
|---|---|---|---|---|---|
| `text-display-xl` | 32px / 2rem | 48px / 3rem | Fraunces | 600 | 1.15 |
| `text-display-lg` | 28px / 1.75rem | 36px / 2.25rem | Fraunces | 600 | 1.2 |
| `text-h1` | 24px / 1.5rem | 30px / 1.875rem | Fraunces | 600 | 1.25 |
| `text-h2` | 20px / 1.25rem | 24px / 1.5rem | Fraunces | 500 | 1.3 |
| `text-h3` | 18px / 1.125rem | 20px / 1.25rem | Plus Jakarta Sans | 600 | 1.35 |
| `text-body-lg` | 16px / 1rem | 18px / 1.125rem | Plus Jakarta Sans | 400 | 1.6 |
| `text-body` | 14px / 0.875rem | 16px / 1rem | Plus Jakarta Sans | 400 | 1.6 |
| `text-caption` | 12px / 0.75rem | 13px / 0.8125rem | Plus Jakarta Sans | 400 | 1.5 |
| `text-price` | 18px / 1.125rem | 22px / 1.375rem | Space Grotesk | 700 | 1.2 |
| `text-stat` | 24px / 1.5rem | 32px / 2rem | Space Grotesk | 700 | 1.1 |

---

## 3. Component Blueprint & UI Rules

### 3.1 Layout Grid

| Breakpoint | Kolom Grid | Margin/Padding Halaman | Gap |
|---|---|---|---|
| Mobile (< 640px) | 4 kolom | 16px | 12px |
| Tablet (640–1024px) | 8 kolom | 24px | 16px |
| Desktop (≥ 1024px) | 12 kolom | 32px (max-width container: 1280px) | 24px |

### 3.2 Button Styles

| Variant | Background | Teks | Penggunaan |
|---|---|---|---|
| `primary` | `primary-600`, hover `primary-700` | putih | CTA utama (Hubungi Penjual, Simpan Listing, Bayar) |
| `secondary` | transparan, border `primary-600` | `primary-600` | Aksi sekunder (Edit, Batal) |
| `accent` | `accent-500`, hover `accent-700` | putih | Aksi terkait verifikasi/badge |
| `ghost` | transparan | `neutral-700` | Aksi tersier (Lihat semua, Kembali) |
| `danger` | `status-error` | putih | Hapus listing, tolak verifikasi |

**Ukuran**: `sm` (32px height, `text-caption`), `md` (40px height, `text-body`, default), `lg` (48px height, `text-body-lg`).

**State wajib untuk semua button**: `default`, `hover`, `focus-visible` (ring 2px `primary-400`), `disabled` (opacity 40%, `cursor-not-allowed`), `loading` (spinner + label "Memproses...", button non-interaktif).

### 3.3 Card — Katalog Kopi

Struktur wajib kartu listing pada grid katalog:

```
┌─────────────────────────────┐
│ [Gambar 4:3, object-cover]  │ ← badge "Boosted"/"Verified" overlay pojok kiri atas
│                              │
│ Kategori (caption, secondary)│
│ Nama Kopi (h3)               │
│ Asal Daerah (caption, icon)  │
│ Rp XX.XXX / unit (text-price)│
│ Min. order: X kg (caption)   │
│ [Tombol Hubungi Penjual]     │
└─────────────────────────────┘
```

- Radius: `12px`, shadow ringan (`0 1px 3px rgba(31,24,21,0.08)`), hover: elevasi shadow naik + scale `1.01` (transisi 150ms).
- **Wajib ada 3 state**: `loading` (skeleton shimmer sesuai bentuk card), `empty` (ilustrasi + teks "Belum ada listing di kategori ini"), `error` (ikon + teks "Gagal memuat data" + tombol coba lagi).

### 3.4 Radar Chart — Flavor Profile

Menampilkan skor rasa dari `TASTE_PROFILE` menggunakan `recharts` `RadarChart`.

**Axis yang didukung** (bergantung data yang tersedia di skema saat ini):
- `acidity_score` (0–5)
- `body_score` (0–5)

> **Catatan desain penting**: skema MVP saat ini hanya menyimpan 2 skor numerik (`acidity_score`, `body_score`). Radar chart idealnya membutuhkan ≥ 3 axis agar bentuknya informatif secara visual. Untuk MVP:
> - Jika hanya 2 skor tersedia → tampilkan sebagai **dual horizontal bar/gauge** (bukan radar) untuk keterbacaan lebih baik.
> - `flavor_notes` ditampilkan sebagai **chip/tag list** terpisah di bawah chart (misal: "Floral", "Citrus", "Caramel").
> - Radar chart penuh (5 axis: Acidity, Body, Sweetness, Aroma, Aftertaste) direkomendasikan sebagai **peningkatan skema fase 2** — tambahkan `sweetness_score`, `aroma_score`, `aftertaste_score` ke `TASTE_PROFILE` saat itu.

```tsx
// Component: FlavorRadarChart.tsx
// Fallback otomatis: render radar jika axis >= 3, else render dual gauge.
```

Warna chart: garis & fill radar menggunakan `secondary-500` dengan opacity fill 20%, grid menggunakan `neutral-300`.

### 3.5 Form Inputs

| Elemen | Spesifikasi |
|---|---|
| Input text/number | Height 44px (touch-friendly), border `neutral-300`, focus border `primary-600` + ring 2px `primary-100`, radius `8px` |
| Label | `text-caption`, `neutral-700`, wajib di atas input (bukan placeholder-only) |
| Helper text | `text-caption`, `neutral-500`, muncul di bawah input |
| Error state | Border `status-error`, pesan error `text-caption` warna `status-error` di bawah input, ikon peringatan di dalam input (kanan) |
| Required marker | Asterisk merah kecil setelah label (`<span class="text-status-error">*</span>`) |
| Select/Dropdown | Konsisten dengan input text, gunakan komponen `Select` dari shadcn/ui |
| Textarea | Min-height 96px, resize vertical only |

**Validasi**: semua form wajib menampilkan pesan error inline (bukan alert/toast saja) menggunakan schema Zod yang sama antara client (React Hook Form) dan server (Server Action).

---

## 4. Responsive Design Standards

Mobile-first — style default menyasar mobile, breakpoint menambahkan/override ke atas.

| Breakpoint | Min-width | Tailwind Prefix | Target Device |
|---|---|---|---|
| Base | 0px | *(tanpa prefix)* | Mobile kecil |
| `sm` | 640px | `sm:` | Mobile besar/phablet |
| `md` | 768px | `md:` | Tablet portrait |
| `lg` | 1024px | `lg:` | Tablet landscape/laptop kecil |
| `xl` | 1280px | `xl:` | Desktop |
| `2xl` | 1536px | `2xl:` | Desktop besar |

### Aturan Wajib
1. **Katalog grid**: 1 kolom (base) → 2 kolom (`sm:`) → 3 kolom (`lg:`) → 4 kolom (`xl:`).
2. **Navigasi**: hamburger menu di bawah `md:`, horizontal nav di atas `md:`.
3. **Dashboard seller/admin**: sidebar collapse menjadi bottom nav/drawer di bawah `lg:`.
4. **Touch target minimum**: 44×44px untuk semua elemen interaktif di breakpoint mobile (sesuai WCAG 2.1).
5. **Tabel data (admin)**: di bawah `md:`, tabel berubah menjadi stacked card per baris — bukan horizontal scroll sebagai solusi utama.
6. **Gambar**: gunakan `next/image` dengan `sizes` yang sesuai breakpoint agar tidak over-fetch di mobile.

---

## 5. Dokumen Terkait

- `PRD.md` — Product Requirement Document
- `ARCHITECTURE.md` — Arsitektur teknis & engineering guidelines
