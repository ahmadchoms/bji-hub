# DESIGN.md — Design System & UI/UX Guidelines
## [Nama Platform] — Direktori & Marketplace Kopi Indonesia

| Field | Value |
|---|---|
| Versi Dokumen | 2.0 |
| Target Audiens | Gen-Z & Gen-Alpha (buyer B2C), profesional kedai kopi (buyer B2B), petani/roaster (seller) |
| Prinsip Desain | Specialty coffee editorial, warm, data-dense, mobile-first, trustworthy |

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
| `secondary-50` | `#FBF3E9` | Background card alternatif, placeholder gambar |

#### Accent (Forest Green — sinyal organik/terverifikasi/eco)
| Token | HEX | Penggunaan |
|---|---|---|
| `accent-700` | `#1E4B36` | Teks di atas accent-100 |
| `accent-500` | `#2F6D4F` | Badge "Verified", tag "Organik" |
| `accent-100` | `#DCEEE3` | Background badge accent |

#### Neutral (Krem/Kertas — dasar layout)
| Token | HEX | Penggunaan |
|---|---|---|
| `neutral-900` | `#1F1815` | Teks utama (headings, body) |
| `neutral-700` | `#4A403A` | Teks sekunder/caption |
| `neutral-500` | `#8C8078` | Placeholder, teks disabled |
| `neutral-300` | `#D8CFC5` | Border default — garis rambut 1px |
| `neutral-100` | `#F0E9E1` | Background section |
| `neutral-50` | `#FAF6F1` | Background halaman (page bg) — "warm paper" |

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

> **Kontras**: seluruh kombinasi teks-di-atas-background wajib diverifikasi minimum rasio 4.5:1 (WCAG AA).

### 1.2 Logo & Iconography
- Logo utama menggunakan `primary-600` di atas `surface-base`, dan versi monokrom putih di atas `primary-600`.
- **Icon Budget**: maksimal 3 ikon berbeda terlihat per viewport. Ikon hanya untuk fungsi ambigu tanpa label (search, menu, close, WhatsApp, external link, sort/filter). Tidak ada ikon di heading, list item, button label, atau badge.

---

## 2. Typography System

### 2.1 Font Selection

| Peran | Font | Alasan |
|---|---|---|
| Display/Heading | **Fraunces** (Google Fonts) | Serif hangat & editorial — kesan artisanal/specialty coffee |
| Body/UI | **Plus Jakarta Sans** (Google Fonts) | Sans-serif geometris, mudah dibaca di layar kecil |
| Angka/Harga/Data | **Space Grotesk** (Google Fonts) | Tabular figures tegas — harga, statistik, skor |

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

## 3. Design Direction — Specialty Coffee Editorial

Referensi: label kopi spesialti, cupping sheet, menu roastery independen, majalah editorial. Bukan startup landing page.

### 3.1 Core Principles
- **Typography carries the design**: headline Fraunces besar dengan kontras ukuran kuat melawan body Jakarta Sans yang kecil dan rapat.
- **Flat, solid colors on warm paper** (`neutral-50`). Struktur dari garis rambut 1px (`neutral-300`), whitespace, dan alignment — bukan shadow atau fill.
- **Radius kecil dan konsisten**: 2-6px. Tidak ada `rounded-2xl/3xl`. Tidak ada pill-everything.
- **Layout asimetris, left-aligned, editorial**: variasi ritme section. Setiap section tidak boleh mengikuti pola "heading center + subtitle + grid identik".
- **Photography-led**: gambar produk adalah visual hero, dengan aspect ratio dan crop nyata. Placeholder: solid `secondary-50` dengan nama origin dalam Fraunces.
- **Data-dense**: katalog bisa berupa daftar spec-sheet (kolom sejajar: image, nama, origin, proses, sangrai, harga, MOQ) di desktop, kolaps ke row stacked di mobile.
- **Cupping sheet style**: radar/gauge garis tipis, skor tabular, flavor notes italic comma-separated dalam Fraunces — bukan colored chip.
- **Homepage is a storefront**: visitors see search, filters, category tabs, result count, and products before any explanatory content. No hero, spotlight banner, marketing CTA, fake metrics, testimonial, or stats strip.
- **Navigation stays compact**: logo, `Jual Kopi`, login/register, and mobile menu only. Platform explanation lives on `/tentang`.

### 3.2 Button Styles

| Variant | Background | Teks | Penggunaan |
|---|---|---|---|
| `primary` | `primary-600`, hover `primary-700` | putih | CTA utama |
| `secondary` | transparan, border `primary-600` | `primary-600` | Aksi sekunder |
| `ghost` | transparan | `neutral-700` | Aksi tersier |

**Ukuran**: `sm` (32px), `md` (40px), `lg` (48px). Flat solid, small radius, no shadow, clear focus ring.

### 3.3 Homepage Product-First Feed & Listing Card

Homepage dimulai dengan katalog, bukan hero marketing. Urutan wajib:

1. Navbar compact: logo, `Jual Kopi`, login, daftar.
2. Search dan filter dalam satu section border-bottom.
3. Tab kategori berbasis URL parameter.
4. Result meta dan filter aktif sebagai teks biasa.
5. Grid listing 2 kolom mobile, 3 kolom tablet, 4 kolom desktop.
6. Footer minimal satu baris link.

```
┌─────────────────────────────┐
│ [Gambar 1:1, object-cover]  │
│                             │
│ Nama Kopi (h2 Fraunces)     │
│ ORIGIN · PROSES · SANGRAI   │ ← mono caption; tambah “· Iklan” bila aktif
│ Rp XX.XXX / unit            │ ← Space Grotesk, tabular
│ Min. order X unit           │ ← hanya jika qty > 1
│ Roastery · Terverifikasi    │
└─────────────────────────────┘
```

- Seluruh card adalah satu link ke detail produk.
- Placeholder gambar: `secondary-50` dengan nama origin dalam Fraunces.
- Radius maksimal 4px. Border hairline `neutral-300`, tanpa shadow.
- Hover hanya underline pada nama produk atau perubahan border.
- Tidak ada tombol WhatsApp, quick view, heart, rating, ikon, atau badge pada card.
- Listing boosted aktif diurutkan paling depan dan ditandai teks `Iklan` pada metadata.

### 3.4 Flavor Profile — Cupping Sheet

- Thin-line radar/gauge dengan warna `primary-600`.
- Tabular scores dalam Space Grotesk.
- Flavor notes: italic comma-separated text dalam Fraunces — bukan colored chip.
- Border: 1px `neutral-300`. Tidak ada shadow.

### 3.5 Form Inputs

| Elemen | Spesifikasi |
|---|---|
| Input text/number | Height 40px, border `neutral-300`, focus `primary-600`, radius 2px |
| Label | `text-xs`, `neutral-700`, di atas input |
| Helper text | `text-xs`, `neutral-500`, di bawah input |
| Error state | Border `status-error`, pesan `text-xs` warna `status-error` |

---

## 4. Anti-Slop Rules (Design Guardrails)

### 4.1 Forbidden Patterns
- **Ikon**: tidak ada ikon di heading, list item, button label, badge, stat card, feature card, atau nav item. Budget: max 3 ikon fungsional per viewport.
- **Warna & effects**: tidak ada gradient (`bg-gradient-*`, `bg-clip-text`), backdrop-blur, glassmorphism, glow, sparkles, colored shadows, grain overlays.
- **Layout**: tidak ada card-dalam-card, bento grid, 3 feature card identik, 4-column KPI identik, centered hero dengan pill badge, numbered steps 1-2-3, 3 equal pricing cards, footer 4 column generic.
- **Motion**: tidak ada fade-in-up, staggered entrance, `hover:scale-*`, `hover:-translate-y-*`, pulsing/bouncing. Hover = color/underline change only. Skeleton shimmer hanya saat loading.
- **Typography**: tidak ada semua `font-semibold`, tidak ada semua ukuran sama. Heading harus berbeda ukuran/weight/font dari level berikutnya.
- **Copy**: tidak ada "Revolusi/Transformasi/Tingkatkan/Seamless", triads, rhetorical questions, em-dash berlebihan, exclamation mark, emoji dekoratif. Copy harus spesifik, konkret, bahasa Indonesia natural seperti roaster bicara.
- **Badge**: max 1 badge per listing row/card. Sisanya plain text metadata.

### 4.2 Allowed Patterns
- **Loading/empty/error states**: typographic — satu kalimat jujur dalam Fraunces + satu text-link action. Tidak ada icon-in-circle.
- **Dashboard**: typographic summary line, bare chart dengan hairline axes tanpa card wrapper, text-only sidebar dengan active item ditandai border-left atau underline.
- **Tabel**: hairline rows, tabular figures, right-aligned numbers. Tidak ada zebra stripes + hover highlight + row icons.
- **Dropdown/dialog/sheet**: shadow hanya untuk floating layers.

---

## 5. Responsive Design Standards

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
1. **Katalog grid**: 1 kolom (base) → 2 kolom (`sm:`) → 3 kolom (`lg:`). Tidak ada 4 kolom identik.
2. **Navigasi**: hamburger menu di bawah `md:`, horizontal nav di atas `md:`.
3. **Dashboard seller/admin**: sidebar collapse menjadi bottom nav/drawer di bawah `lg:`.
4. **Touch target minimum**: 44×44px untuk semua elemen interaktif di breakpoint mobile (WCAG 2.1).
5. **Tabel data**: di bawah `md:`, tabel berubah menjadi stacked row per baris.
6. **Gambar**: gunakan `next/image` dengan `sizes` yang sesuai breakpoint.

---

## 6. Dokumen Terkait

- `PRD.md` — Product Requirement Document
- `ARCHITECTURE.md` — Arsitektur teknis & engineering guidelines
