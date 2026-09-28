# ARCHITECTURE.md — Technical Architecture & Engineering Guidelines
## [Nama Platform] — Direktori & Marketplace Kopi Indonesia

| Field | Value |
|---|---|
| Versi Dokumen | 1.0 |
| Stack | Next.js 15 (App Router) + TypeScript + Prisma + Supabase + Midtrans |

---

## 1. High-Level Architecture

```
                        ┌─────────────────────────────┐
                        │        Client (Browser)      │
                        │  Next.js App Router (RSC)    │
                        └───────────────┬───────────────┘
                                        │
                        ┌───────────────▼───────────────┐
                        │     Vercel (Next.js Runtime)   │
                        │  Server Components / Actions   │
                        │  Route Handlers (/api/*)       │
                        └───────┬───────────────┬────────┘
                                │               │
                ┌───────────────▼───┐   ┌───────▼────────────┐
                │   Supabase          │   │   Midtrans Snap     │
                │ - Postgres (Prisma) │   │ - Subscription pay  │
                │ - Auth               │   │ - Boost listing pay │
                │ - Storage (images)   │   │ - Webhook callback   │
                └──────────────────────┘   └──────────────────────┘
```

**Prinsip arsitektur**:
- Gunakan **Server Components** sebagai default untuk data fetching (SEO-friendly, mengurangi JS bundle).
- **Server Actions** untuk mutasi data (create/update listing, submit inquiry) — hindari membuat REST API terpisah kecuali dibutuhkan oleh webhook eksternal (Midtrans).
- **Route Handler** (`app/api/webhooks/midtrans/route.ts`) khusus untuk menerima callback pihak ketiga.
- **Client Components** hanya untuk interaktivitas (filter, form, chart) — di-mark eksplisit dengan `'use client'`.

---

## 2. Folder Structure

```
├── app/
│   ├── (public)/
│   │   ├── page.tsx                    # Landing
│   │   ├── katalog/page.tsx
│   │   ├── produk/[slug]/page.tsx
│   │   ├── toko/[slug]/page.tsx
│   │   ├── harga/page.tsx
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (seller)/
│   │   └── dashboard/
│   │       ├── page.tsx
│   │       ├── listing/page.tsx
│   │       ├── analytics/page.tsx
│   │       ├── billing/page.tsx
│   │       ├── profil/page.tsx
│   │       └── inquiry/page.tsx
│   ├── (admin)/
│   │   └── admin/
│   │       ├── page.tsx
│   │       ├── verifikasi/page.tsx
│   │       ├── moderasi/page.tsx
│   │       └── transaksi/page.tsx
│   ├── api/
│   │   └── webhooks/
│   │       └── midtrans/route.ts
│   └── layout.tsx
├── components/
│   ├── ui/                             # shadcn/ui primitives
│   ├── catalog/                        # ListingCard, FilterBar, dst.
│   ├── dashboard/                      # AnalyticsChart, ListingTable, dst.
│   └── shared/                         # Navbar, Footer, EmptyState, ErrorState
├── lib/
│   ├── prisma.ts                       # Prisma client singleton
│   ├── supabase/
│   │   ├── client.ts                   # Browser client
│   │   └── server.ts                   # Server client
│   ├── midtrans.ts                     # Midtrans client wrapper
│   ├── validations/                    # Skema Zod (shared client-server)
│   │   ├── listing.schema.ts
│   │   ├── seller-profile.schema.ts
│   │   └── inquiry.schema.ts
│   └── utils.ts
├── actions/                            # Server Actions
│   ├── listing.actions.ts
│   ├── subscription.actions.ts
│   ├── inquiry.actions.ts
│   └── verification.actions.ts
├── types/
│   └── index.ts                        # Shared TypeScript types
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── middleware.ts                       # Auth/role route protection
```

---

## 3. Data Layer

### 3.1 Prisma Schema (Ringkasan Mapping ERD)

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String?  @map("password_hash")
  role         Role     @default(BUYER)
  createdAt    DateTime @default(now()) @map("created_at")
  sellerProfile SellerProfile?

  @@map("users")
}

enum Role {
  BUYER
  SELLER
  ADMIN
}

model SellerProfile {
  id             String   @id @default(uuid())
  userId         String   @unique @map("user_id")
  user           User     @relation(fields: [userId], references: [id])
  businessName   String   @map("business_name")
  province       String
  city           String
  address        String
  whatsappNumber String   @map("whatsapp_number")
  isVerified     Boolean  @default(false) @map("is_verified")
  tier           String   @default("free")
  createdAt      DateTime @default(now()) @map("created_at")

  listings      Listing[]
  subscriptions Subscription[]
  payments      Payment[]

  @@map("seller_profiles")
}

model Category {
  id       String    @id @default(uuid())
  name     String
  slug     String    @unique
  listings Listing[]

  @@map("categories")
}

model Listing {
  id          String    @id @default(uuid())
  sellerId    String    @map("seller_id")
  seller      SellerProfile @relation(fields: [sellerId], references: [id])
  categoryId  String    @map("category_id")
  category    Category  @relation(fields: [categoryId], references: [id])
  title       String
  price       Decimal
  unit        String
  minOrderQty Int       @default(1) @map("min_order_qty")
  status      String    @default("active")
  isBoosted   Boolean   @default(false) @map("is_boosted")
  boostUntil  DateTime? @map("boost_until")
  createdAt   DateTime  @default(now()) @map("created_at")

  tasteProfile TasteProfile?
  images       ListingImage[]
  events       AnalyticsEvent[]
  inquiries    Inquiry[]
  payments     Payment[]

  @@map("listings")
}

model TasteProfile {
  id            String   @id @default(uuid())
  listingId     String   @unique @map("listing_id")
  listing       Listing  @relation(fields: [listingId], references: [id])
  originRegion  String   @map("origin_region")
  processMethod String   @map("process_method") // Wash / Natural / Honey
  roastLevel    String   @map("roast_level")
  flavorNotes   String   @map("flavor_notes")
  acidityScore  Decimal  @map("acidity_score")
  bodyScore     Decimal  @map("body_score")
  roastDate     DateTime @map("roast_date")

  @@map("taste_profiles")
}

model ListingImage {
  id        String  @id @default(uuid())
  listingId String  @map("listing_id")
  listing   Listing @relation(fields: [listingId], references: [id])
  url       String
  sortOrder Int     @default(0) @map("sort_order")

  @@map("listing_images")
}

model Subscription {
  id        String   @id @default(uuid())
  sellerId  String   @map("seller_id")
  seller    SellerProfile @relation(fields: [sellerId], references: [id])
  tier      String
  status    String
  startedAt DateTime @map("started_at")
  expiresAt DateTime @map("expires_at")
  payments  Payment[]

  @@map("subscriptions")
}

model Payment {
  id               String        @id @default(uuid())
  sellerId         String        @map("seller_id")
  seller           SellerProfile @relation(fields: [sellerId], references: [id])
  subscriptionId   String?       @map("subscription_id")
  subscription     Subscription? @relation(fields: [subscriptionId], references: [id])
  listingId        String?       @map("listing_id")
  listing          Listing?      @relation(fields: [listingId], references: [id])
  type             String        // "subscription" | "boost" | "verification"
  amount           Decimal
  status           String
  midtransOrderId  String        @map("midtrans_order_id")
  paidAt           DateTime?     @map("paid_at")

  @@map("payments")
}

model AnalyticsEvent {
  id        String   @id @default(uuid())
  listingId String   @map("listing_id")
  listing   Listing  @relation(fields: [listingId], references: [id])
  eventType String   @map("event_type") // "view" | "contact_click"
  createdAt DateTime @default(now()) @map("created_at")

  @@map("analytics_events")
}

model Inquiry {
  id            String   @id @default(uuid())
  listingId     String   @map("listing_id")
  listing       Listing  @relation(fields: [listingId], references: [id])
  buyerName     String   @map("buyer_name")
  buyerContact  String   @map("buyer_contact")
  quantity      String
  message       String
  createdAt     DateTime @default(now()) @map("created_at")

  @@map("inquiries")
}
```

### 3.2 Migration Workflow

```bash
npx prisma migrate dev --name init          # development
npx prisma migrate deploy                    # production (CI/CD)
npx prisma generate                          # regenerate client setiap schema berubah
```

### 3.3 Row Level Security (Supabase)

- Aktifkan RLS pada seluruh tabel yang diakses langsung dari client (jika ada akses langsung Supabase client di luar Prisma/server, misal untuk Storage).
- Prisma umumnya mengakses DB via `service_role`/direct connection dari server — RLS tetap wajib aktif sebagai defense-in-depth jika ada query langsung dari edge/client.
- Kebijakan minimum: seller hanya bisa `UPDATE`/`DELETE` listing miliknya sendiri; buyer hanya bisa `INSERT` pada tabel `inquiries` dan `analytics_events`.

---

## 4. Authentication & Authorization

| Role | Akses |
|---|---|
| `BUYER` (termasuk guest) | Browse katalog, kirim inquiry, generate analytics event (view/klik) |
| `SELLER` | Semua akses buyer + kelola listing, dashboard, billing miliknya sendiri |
| `ADMIN` | Semua akses + moderasi, approve verifikasi, lihat seluruh data transaksi |

- Auth provider: **Supabase Auth** (email/password + Google OAuth).
- Session divalidasi di `middleware.ts` untuk proteksi route `(seller)` dan `(admin)`.
- Role disimpan di tabel `users.role`, disinkronkan ke Supabase custom claims/JWT saat login untuk pengecekan cepat di middleware tanpa query DB tambahan.

```ts
// middleware.ts (ringkasan logika)
// 1. Ambil session dari Supabase
// 2. Jika path dimulai /dashboard → wajib role SELLER
// 3. Jika path dimulai /admin → wajib role ADMIN
// 4. Redirect ke /login jika tidak memenuhi syarat
```

---

## 5. Server Actions & Validation Convention

- Setiap Server Action **wajib** divalidasi menggunakan skema Zod yang sama dengan form client (React Hook Form + `zodResolver`), diletakkan di `lib/validations/`.
- Pola standar setiap action: `input validation → authorization check → DB mutation → revalidasi cache (revalidatePath/revalidateTag) → return typed result`.

```ts
// actions/listing.actions.ts
'use server';

import { z } from 'zod';
import { listingSchema } from '@/lib/validations/listing.schema';
import { prisma } from '@/lib/prisma';
import { getCurrentSeller } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function createListing(input: z.infer<typeof listingSchema>) {
  const seller = await getCurrentSeller();
  if (!seller) {
    return { success: false as const, error: 'Unauthorized' };
  }

  const parsed = listingSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten() };
  }

  const listing = await prisma.listing.create({
    data: { ...parsed.data, sellerId: seller.id },
  });

  revalidatePath('/dashboard/listing');
  revalidatePath('/katalog');

  return { success: true as const, data: listing };
}
```

**Aturan wajib untuk semua Server Action**: selalu mengembalikan tipe union `{ success: true; data: T } | { success: false; error: unknown }` — tidak pernah melempar exception mentah ke client.

---

## 6. State Management

| Kebutuhan | Solusi |
|---|---|
| Server state (data listing, analytics, dsb.) | TanStack Query — untuk client component yang butuh refetch/cache (mis. dashboard realtime-ish) |
| Form state | React Hook Form |
| Global UI state ringan (modal, sidebar toggle) | React Context sederhana — hindari menambah dependency (Zustand) kecuali kompleksitas UI meningkat signifikan |
| Data awal halaman (SSR) | Diambil langsung di Server Component, di-passing sebagai `initialData` ke TanStack Query di client jika perlu revalidasi lanjutan |

---

## 7. Payment Integration (Midtrans Snap)

### 7.1 Flow Subscription/Boost

```
Seller klik "Berlangganan" / "Boost Listing"
        │
        ▼
Server Action buat Payment (status: pending) + generate Snap Token
        │
        ▼
Client render Snap popup (midtrans-client SDK)
        │
        ▼
Buyer selesai bayar di Midtrans
        │
        ▼
Midtrans kirim webhook → /api/webhooks/midtrans
        │
        ▼
Verifikasi signature → update Payment.status
        │
        ├─ type=subscription → update Subscription.status & expiresAt
        └─ type=boost        → update Listing.isBoosted & boostUntil
```

### 7.2 Webhook Handler

```ts
// app/api/webhooks/midtrans/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyMidtransSignature } from '@/lib/midtrans';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const body = await req.json();

  const isValid = verifyMidtransSignature(body);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const payment = await prisma.payment.findUnique({
    where: { midtransOrderId: body.order_id },
  });

  if (!payment) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
  }

  const status = body.transaction_status === 'settlement' ? 'paid' : 'failed';

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status, paidAt: status === 'paid' ? new Date() : null },
  });

  // Update entitas terkait sesuai payment.type di sini (subscription/boost)

  return NextResponse.json({ received: true });
}
```

> **Wajib**: verifikasi signature Midtrans di setiap webhook untuk mencegah spoofing. Jangan pernah mempercayai payload webhook tanpa validasi.

---

## 8. Image Upload Flow (Supabase Storage)

```
Client (form listing) → upload file ke Supabase Storage bucket "listing-images"
        │
        ▼
Dapatkan public URL
        │
        ▼
Simpan URL ke tabel ListingImage via Server Action
```

- Batas ukuran file: maks 2MB per gambar, format `jpg/png/webp`.
- Kompresi/resize dilakukan client-side sebelum upload (mis. `browser-image-compression`) untuk menghemat bandwidth & storage quota free tier.

---

## 9. Environment Variables

```bash
# Database
DATABASE_URL=
DIRECT_URL=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Midtrans
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
MIDTRANS_IS_PRODUCTION=false

# Email
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=
```

> `SUPABASE_SERVICE_ROLE_KEY` dan `MIDTRANS_SERVER_KEY` **tidak boleh** pernah di-expose ke client — hanya digunakan di Server Action/Route Handler.

---

## 10. Error Handling Convention

| Layer | Pendekatan |
|---|---|
| Form (client) | Validasi Zod real-time via `react-hook-form` resolver, pesan error inline di bawah field |
| Server Action | Try-catch wajib, return `{ success: false, error }` — tidak melempar exception ke client |
| Route Handler (webhook) | Return HTTP status code sesuai kondisi (400/401/404/500), log error ke console/observability tool |
| UI (async data) | Setiap komponen yang fetch data wajib punya 3 state: `loading` (skeleton), `error` (pesan + retry button), `empty` (ilustrasi + CTA relevan) |

---

## 11. Testing Strategy

| Jenis | Tools | Cakupan |
|---|---|---|
| Unit test | Vitest | Fungsi utilitas, skema Zod, kalkulasi (mis. subscription expiry) |
| Integration test | Vitest + Prisma test DB | Server Actions (create listing, submit inquiry) |
| E2E test | Playwright | Alur kritis: registrasi seller → buat listing → buyer klik kontak → subscription payment |

Prioritas untuk MVP dengan waktu terbatas: fokus E2E pada **alur income** (subscription & boost payment) dan **alur inti buyer** (search → contact).

---

## 12. Deployment & CI/CD

```yaml
# .github/workflows/ci.yml (ringkasan)
name: CI
on: [pull_request]
jobs:
  test:
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx prisma generate
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test
```

- **Preview deployment**: otomatis via Vercel setiap PR dibuka.
- **Production deployment**: merge ke `main` → auto-deploy Vercel + `prisma migrate deploy` dijalankan sebagai build step atau GitHub Action terpisah sebelum deploy.

---

## 13. Security Checklist

- [ ] RLS aktif di semua tabel Supabase
- [ ] Semua Server Action memvalidasi role/kepemilikan data sebelum mutasi
- [ ] Signature verification aktif di webhook Midtrans
- [ ] Rate limiting pada endpoint publik rawan spam (registrasi, form inquiry) — gunakan middleware sederhana berbasis IP/session
- [ ] Environment variable sensitif tidak pernah di-commit ke repo (`.env` masuk `.gitignore`)
- [ ] Sanitasi input teks bebas (deskripsi listing, pesan inquiry) untuk mencegah XSS saat dirender

---

## 14. Coding Conventions

- **TypeScript strict mode** aktif (`strict: true` di `tsconfig.json`) — tidak ada `any` implisit.
- **Komponen**: satu tanggung jawab per komponen, maksimal ~150 baris — pecah menjadi sub-komponen jika lebih.
- **Naming**: `PascalCase` untuk komponen, `camelCase` untuk fungsi/variabel, `kebab-case` untuk nama file non-komponen.
- **Tidak ada placeholder code** (`// TODO: implement`) yang masuk ke branch `main` — gunakan issue tracker untuk fitur belum selesai.
- **Setiap komponen async/data-fetching wajib mengimplementasikan** state loading, error, dan empty sesuai `DESIGN.md` §3.3.

---

## 15. Dokumen Terkait

- `PRD.md` — Product Requirement Document
- `DESIGN.md` — Design system & UI/UX guidelines
