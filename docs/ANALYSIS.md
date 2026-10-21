# Audit Teknis: `ahmadchoms/bji-hub` (Biji Hub / biji-corp)

**Stack:** Next.js 15.5 (App Router), React 19, Supabase Auth, Prisma 7 + `pg` (raw SQL), Midtrans, RajaOngkir, Resend, Zod, TanStack Query (terpasang).
**Metode:** clone `main`, baca manual: `actions/*`, `lib/auth/*`, `lib/data/*`, `app/api/*`, layout, checkout, cart, context, schema Prisma, `next.config.ts`.
**Batasan:** ini static review. Aplikasi tidak dijalankan dan tidak semua 79 client component dibaca. Temuan bertanda **[Terverifikasi di kode]** sudah kubaca langsung barisnya. Temuan bertanda **[Perlu uji]** masih perlu dikonfirmasi saat runtime.

---

## 0. Ringkasan Eksekutif

| Area | Skor | Catatan singkat |
|---|---|---|
| Autentikasi | 🔴 Kritis | Mock session bisa dipakai di production, "self-heal" password123, auto-confirm email |
| Otorisasi | 🔴 Kritis | Beberapa server action order tanpa cek auth/ownership; IDOR di halaman order & invoice |
| Transaksi/Pembayaran | 🔴 Kritis | Order bisa "ada" hanya di memori, stok oversell, webhook tidak idempoten, status bisa mundur |
| Race condition | 🔴 Tinggi | Stok dan saldo payout memakai pola read-then-write tanpa lock |
| Security umum | 🟠 Tinggi | Tidak ada CSP/HSTS, JSON-LD tidak di-escape, validasi URL gambar bolos |
| Error handling | 🟠 Tinggi | 88 `catch {}` kosong, banyak kegagalan ditelan diam-diam |
| Data fetching/state | 🟡 Sedang | TanStack Query terpasang tapi tidak dipakai; tidak ada hooks |
| UI/UX | 🟡 Sedang | Fondasi bagus (skeleton, error boundary, debounce), tapi feedback pembayaran menyesatkan |
| Testing | 🟡 Sedang | Unit test lumayan, tapi tidak ada test authz dan tidak ada e2e di repo |

**Prioritas perbaikan (kerjakan berurutan):**
1. Matikan mock session di production (C1, C2)
2. Hapus "self-heal password123" (C3)
3. Tambah auth dan ownership di semua server action order (C4)
4. Perbaiki alur transaksi: persist atau gagal, stok atomik, state machine, idempotency (C5–C8)
5. Lindungi `/order/success` dan `/order/invoice` (C9)

---

## 1. Temuan Kritis 🔴

### C1. Mock session cookie bisa dipakai untuk menjadi admin
**File:** `lib/auth/session.ts` (`getSession`)
**[Terverifikasi di kode]**

Alur `getSession()`: jika Supabase tidak mengembalikan user, kode jatuh ke bagian "Mock session fallback". Bagian itu membaca cookie `biji-mock-session` dan mempercayai isinya tanpa cek `NODE_ENV` atau `DATA_SOURCE`.

```ts
const raw = store.get(MOCK_SESSION_COOKIE)?.value;
if (!isRole(raw) || raw === "guest") return GUEST_SESSION;
return { role: raw, sellerId: raw === "seller" ? "seller-1" : null, ... }
```

`httpOnly` hanya mencegah JavaScript membaca cookie. Pengguna tetap bebas membuat cookie `biji-mock-session=admin` lewat DevTools, curl, atau extension.

**Dampak:** siapa pun bisa menjadi **admin** di production, lalu menyetujui payout, menyelesaikan dispute, dan memoderasi listing.

**Fix:**
```ts
const MOCK_ENABLED =
  process.env.NODE_ENV !== "production" && process.env.DATA_SOURCE === "mock";

// di getSession():
if (!MOCK_ENABLED) return GUEST_SESSION;
```
Bila perlu mock untuk demo, tanda tangani cookie dengan HMAC atau gunakan `iron-session`.

---

### C2. Login "fail-open" ke mock session saat Supabase error
**File:** `actions/auth.actions.ts` (`loginAction`, `registerAction`, `becomeSellerAction`)
**[Terverifikasi di kode]**

Seluruh blok Supabase dibungkus `try { ... } catch { /* Fall through to mock session */ }`. Jika Supabase timeout, down, atau melempar exception, kode lanjut ke:

```ts
const role = mockRoleFromEmail(parsed.data.email); // prefix "admin" => admin
await setMockSession(role);
```

**Dampak:** saat Supabase gangguan, **siapa pun yang login dengan email `admin@...` dan password apa saja** (yang lolos validasi Zod) mendapat sesi admin. Ini juga membuat respons fallback sulit dibedakan dari login sungguhan.

**Fix:** pada production, `catch` harus `return fail("Layanan autentikasi sedang bermasalah")`. Jadikan mock session hanya aktif bila `MOCK_ENABLED` (lihat C1).

---

### C3. "Self-heal" password `password123` = account takeover
**File:** `actions/auth.actions.ts` (`loginAction`)
**[Terverifikasi di kode]**

Jika login gagal, password yang dikirim adalah `"password123"`, dan email ada di tabel `User` Prisma, kode memakai **service role key** untuk mereset password akun itu menjadi `password123` (atau membuat akun baru dengan password itu), lalu mencoba login ulang.

**Dampak:** untuk **setiap email yang terdaftar** (termasuk admin), penyerang cukup login dengan `password123` dan langsung menguasai akunnya. Rate limit hanya 5 percobaan/menit/email dan in-memory (lihat S6).

**Fix:** hapus blok ini dari kode aplikasi. Pindahkan ke script seed terpisah (`scripts/sync-seed-users.mjs` sudah ada), jalankan manual, jangan pernah di request path.

---

### C4. Server action order tanpa autentikasi/otorisasi (IDOR)
**File:** `actions/order.actions.ts`
**[Terverifikasi di kode]**

Semua `"use server"` export adalah endpoint HTTP publik yang bisa dipanggil siapa saja, walau tombol UI-nya tersembunyi.

| Action | Cek auth? | Cek kepemilikan? | Dampak |
|---|---|---|---|
| `confirmOrderPaymentAction(orderId)` | ❌ | ❌ | **Siapa pun bisa menandai order "paid" tanpa bayar.** Memicu pengurangan stok dan email ke seller. (Tidak ada pemanggil di UI, tapi tetap terekspos.) |
| `updateShipmentTrackingAction` | ❌ | ❌ | Siapa pun bisa mengubah resi dan status menjadi "shipped" |
| `completeOrderAction` | ❌ | ❌ | Siapa pun bisa menyelesaikan order, sehingga dana masuk ke `availableBalance` seller |
| `disputeOrderAction` | ❌ | ❌ | Siapa pun bisa membuka dispute order orang lain |
| `cancelPendingOrderAction` | Hanya "bukan guest" | ❌ | Pengguna login mana pun bisa membatalkan order orang lain |
| `resumeOrderPaymentAction` | ❌ | ❌ | Membocorkan `snapToken`, `totalAmount`, `orderNumber` |
| `submitReviewAction` | ❌ | ❌ | Guest bisa review; order tidak diverifikasi "completed" dan milik pembeli |
| `trackShipmentAction`, `getShippingRatesAction` | ❌ | – | Menghabiskan kuota RajaOngkir |

Yang sudah benar: `resolveDisputeAction` (admin), `autoCompleteOrdersAction` (admin), `sellerResolveDisputeAction` (admin atau seller pemilik), dan seluruh `seller.actions.ts` / `payout.actions.ts` / `subscription.actions.ts` (memakai `requireSeller`).

**Fix:** buat helper terpusat.
```ts
async function requireOrderAccess(orderId: string, allow: Array<"buyer" | "seller" | "admin">) {
  const session = await getSession();
  const order = await getOrderById(orderId);
  if (!order) throw new ActionError("Pesanan tidak ditemukan");
  const isBuyer = !!session.userId && order.buyerId === session.userId;
  const isSeller = !!session.sellerId && order.sellerId === session.sellerId;
  const isAdmin = session.role === "admin";
  if (!((allow.includes("buyer") && isBuyer) ||
        (allow.includes("seller") && isSeller) ||
        (allow.includes("admin") && isAdmin))) {
    throw new ActionError("Tidak punya akses");
  }
  return { session, order };
}
```
Mapping: `confirmOrderPaymentAction` jadikan fungsi internal non-export (pembayaran hanya dikonfirmasi lewat webhook), `updateShipmentTracking` hanya seller pemilik, `completeOrder` dan `disputeOrder` hanya buyer pemilik, `cancelPending` hanya buyer pemilik atau admin.

---

### C5. Order "berhasil" padahal tidak tersimpan ke database
**File:** `lib/data/orders.ts` (`createOrder`, `updateOrderStatus`, `decrementListingStock`, dll.)
**[Terverifikasi di kode]**

Pola berulang: query Postgres dibungkus `try/catch`, lalu **fallback ke array in-memory** (`mockOrders`).

```ts
} catch (e) {
  console.error("Failed to insert order to postgres, using memory fallback:", e);
}
mockOrders.unshift(newOrder);
return newOrder;
```

**Dampak:** jika INSERT gagal (koneksi putus, unique violation karena `orderNumber` bentrok, constraint), user tetap menerima `snapToken` dan **membayar untuk order yang tidak ada di DB**. Di serverless (Vercel), memori hilang di invocation berikutnya, sehingga webhook tidak menemukan order (`getOrderById` → null). Uang sudah masuk, tapi order tidak ada. Pola yang sama ada di `createPayoutRequest` dan `decrementListingStock` (kegagalan DB dianggap sukses via mock).

**Fix:** di mode `prisma`/`postgres`, kegagalan DB harus melempar error dan membatalkan alur. Fallback memori hanya boleh aktif bila `DATA_SOURCE === "mock"`. Urutan yang aman: **simpan order dulu → baru minta snap token → update order dengan token**. Saat ini urutannya terbalik.

---

### C6. Webhook Midtrans: tidak idempoten, status bisa mundur, nominal tidak dicek
**File:** `app/api/webhooks/midtrans/route.ts`, `lib/data/orders.ts`
**[Terverifikasi di kode]**

Yang sudah baik: verifikasi signature SHA-512 dilakukan, dan jalur Payment (langganan/boost) memakai `$transaction`.

Masalah:
1. **Status regresi.** Notifikasi `pending` dipetakan ke `pending_payment` lalu langsung `updateOrderStatus(order.id, "pending_payment")`. Notifikasi yang telat atau tidak berurutan bisa **menimpa order `shipped`/`completed` menjadi `pending_payment`**. Notifikasi `expire`/`cancel` terlambat bisa membatalkan order yang sudah dibayar dan dikirim, lalu `updateOrderStatus` ikut menambah stok kembali.
2. **`gross_amount` tidak dibandingkan** dengan `order.totalAmount`.
3. **Tidak ada idempotency.** Notifikasi yang sama berkali-kali (Midtrans retry) memicu email ganda dan logika ganda.
4. Perbandingan signature memakai `===`, bukan `crypto.timingSafeEqual`.

**Fix:** buat state machine eksplisit dan update bersyarat di SQL.
```ts
const ALLOWED: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ["paid", "canceled"],
  paid: ["shipped", "disputed", "canceled"],
  shipped: ["completed", "disputed"],
  disputed: ["completed", "canceled", "shipped"],
  completed: [],
  canceled: [],
};

// SQL atomik:
// UPDATE orders SET status=$1 WHERE id=$2 AND status = ANY($3) RETURNING *
// rowCount === 0 → abaikan (sudah diproses / transisi tidak valid)
```
Cek `Number(body.gross_amount) === order.totalAmount`, dan tolak jika berbeda.

---

### C7. Stok: oversell dan double-decrement (race condition)
**File:** `actions/order.actions.ts`, `lib/data/orders.ts`
**[Terverifikasi di kode]**

- Stok **dicek saat checkout** tetapi **baru dikurangi saat status jadi `paid`**. Dua pembeli bisa checkout stok terakhir bersamaan, keduanya membayar, dan stok jadi minus.
- `updateOrderStatus` membaca `currentOrder.status !== "paid"` lalu memanggil `decrementListingStock`: **read-then-write non-atomik**. Tiga jalur bisa menandai paid hampir bersamaan: webhook, halaman `/order/success` (yang memutasi data saat render GET), dan `checkOrderPaymentStatusAction`. Hasilnya **stok terpotong 2–3 kali**.
- SQL memakai `GREATEST(0, COALESCE(stock, 100) - $1)`. Ini menyembunyikan oversell dan mengasumsikan stok default 100 jika NULL.
- `quickUpdateStockAction` **hanya mengubah `mockListings` (memori)** dan tidak menulis ke DB. Di production, update stok seller tidak tersimpan.
- Email low-stock di-hardcode ke `sellerEmail: "roastery@bijihub.id"`, bukan email seller sebenarnya.

**Fix:** satu fungsi transaksi.
```sql
-- dalam transaksi:
UPDATE listings SET stock = stock - $1
WHERE id = $2 AND stock >= $1
RETURNING stock;            -- rowCount 0 = stok kurang
```
Gabungkan dengan update status order yang bersyarat (C6) dalam **satu transaksi**, sehingga hanya satu pemanggil yang menang. Pertimbangkan reservasi stok saat checkout dengan TTL 15–30 menit.

---

### C8. Checkout: ongkir dari klien, multi-item rusak, order number rapuh
**File:** `actions/order.actions.ts` (`createCheckoutOrderAction`)
**[Terverifikasi di kode]**

- **`shippingCost` datang dari klien** (`z.number().min(0)`), tidak dihitung ulang di server. Penyerang bisa mengirim `0`. `shippingCourier` juga string bebas.
- **Multi-item cart:** `createOrder` hanya menyimpan **satu `listingId`** (listing utama) dan `itemPrice` rata-rata. Konsekuensinya:
  - `sellerId` order diambil dari listing utama, sehingga **cart multi-seller membayar semua ke satu seller**.
  - Stok hanya berkurang untuk listing utama.
  - Listing utama tidak divalidasi (stok/minOrder) bila tidak ada di `items`.
  - Skema Prisma sudah punya `OrderItem`, tapi kode raw SQL tidak memakainya.
- `orderNumber = ORD-${Date.now().toString().slice(-6)}-${random 3 digit}`: hanya ~900 variasi per jendela ±1 jam, rawan bentrok. Karena error INSERT ditelan (C5), bentrokan menghasilkan order hantu. Nomor ini juga **mudah ditebak** (lihat C9).
- Tidak ada **idempotency key**. Retry jaringan atau klik ganda membuat order ganda.
- `buyerEmail` default `"buyer@bijihub.com"` di klien dan `"pembeli@bijihub.com"` di halaman orders: akun tanpa email membuat order bocor lintas pengguna (lihat H3).
- `createMidtransSnapToken` gagal diam-diam (return `null`). Order tetap dibuat tanpa token, dan UI menampilkan toast sukses (lihat U1).

**Fix:** hitung ongkir di server (`calculateShippingRates` dengan `shippingCourier` sebagai id rate, bukan string). Gunakan `crypto.randomUUID()` atau ULID untuk nomor order. Simpan `order_items`. Pecah order per seller. Terima `idempotencyKey` dengan unique index.

---

### C9. Halaman `/order/success` dan `/order/invoice` tanpa auth: kebocoran PII
**File:** `app/(public)/order/success/page.tsx`, `app/(public)/order/invoice/page.tsx`
**[Terverifikasi di kode]**

Kedua halaman mengambil order lewat `?orderNumber=` / `?orderId=` / `?id=` **tanpa memeriksa session**. Order number mudah ditebak (C8). Halaman menampilkan nama, alamat, telepon, email, nominal, dan resi pembeli.

Halaman success juga **melakukan mutasi saat render GET** (update status ke `paid`/`canceled`) dan memanggil Midtrans tanpa timeout (`fetch` di `checkMidtransStatus` tidak memakai `AbortSignal`).

**Fix:** wajibkan session dan ownership (buyer/seller/admin) atau token akses acak per order (`?t=<signed token>`). Pindahkan sinkronisasi status ke webhook atau cron. Tambahkan `AbortSignal.timeout(5000)` pada semua `fetch` eksternal.

---

## 2. Temuan Tinggi 🟠

### H1. `user_metadata.role` dipercaya saat membuat user DB
`getSession()` dan `loginAction` memakai `user.user_metadata?.role` untuk membuat baris `User` jika belum ada. **`user_metadata` bisa diubah oleh user sendiri** lewat `supabase.auth.updateUser()` memakai anon key dari browser. Selama baris DB belum dibuat (mis. user lewat jalur `signUp`, bukan Admin API), seorang user bisa mengisi `role: "admin"` lalu login. Gunakan `app_metadata` (hanya bisa ditulis server) atau jangan pernah mengambil role dari metadata. Selalu `BUYER` saat insert pertama.

### H2. Auto-confirm email lewat service role
`loginAction` mengonfirmasi email yang belum terverifikasi otomatis (`email_confirm: true`), dan `registerAction` membuat user dengan `email_confirm: true`. **Verifikasi kepemilikan email hilang.** Orang bisa mendaftar dengan email korban. Karena `getOrdersByBuyer` mencocokkan `buyer_email`, ini membuka celah pembacaan order. Pencarian user memakai `admin.auth.admin.listUsers()` **tanpa paginasi** (hanya halaman pertama), jadi rusak untuk >50 user dan boros. Gunakan verifikasi email Supabase standar.

### H3. Kebocoran order lintas pengguna via email
`getOrdersByBuyer` memakai `buyer_id = $1 OR buyer_email = $1 OR ...`. Siapa pun yang mendaftar dengan email yang sama dengan `buyerEmail` di order guest bisa melihat order itu. Fallback `userEmail = "pembeli@bijihub.com"` membuat semua akun tanpa email melihat daftar order yang sama. Cocokkan hanya berdasarkan `buyer_id`. Tautkan order guest lewat token klaim yang dikirim ke email.

### H4. Race condition saldo payout
`requestPayoutAction`: `getSellerBalanceSummary` (baca) → bandingkan → `createPayoutRequest` (tulis), **tanpa transaksi atau lock**. Dua request paralel dari seller yang sama bisa sama-sama lolos dan menarik dana melebihi saldo. Selain itu:
- Saldo dihitung ulang dari seluruh order di aplikasi (O(n), tanpa paginasi).
- `updatePayoutStatus` tanpa state machine: payout `processed` bisa diubah ke `rejected` lalu saldo kembali dan bisa ditarik lagi.
- `updatePayoutStatus` mengembalikan `true` walau 0 baris ter-update.
- Dana dianggap "available" saat order `completed`, tetapi dispute setelah itu dan refund tidak dibalik dari saldo.

Fix: `SELECT ... FOR UPDATE` pada baris seller atau tabel ledger (`wallet_entries`) append-only dengan constraint `balance >= 0`, dalam satu transaksi.

### H5. JSON-LD tanpa escape (stored XSS)
`app/(public)/product/[slug]/page.tsx` dan `store/[slug]/page.tsx` memakai `dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}` dengan `listing.title`, `description`, dan `businessName` yang diisi seller. `JSON.stringify` **tidak meng-escape `</script>`**. Judul `</script><script>...` mengeksekusi JavaScript di setiap pengunjung. Fix:
```ts
const safe = JSON.stringify(jsonLd).replace(/</g, "\\u003c");
```

### H6. Validasi URL gambar bisa dilewati
- `isOwnedImageUrl` memakai `url.startsWith(NEXT_PUBLIC_SUPABASE_URL)`. URL `https://abc.supabase.co.evil.com/x.png` lolos jika `NEXT_PUBLIC_SUPABASE_URL=https://abc.supabase.co`. Tambahkan `/` di akhir prefix dan cek path bucket (`/storage/v1/object/public/listings/uploads/<ownerId>/`).
- `evidenceUrl` (dispute) dan `imageUrl` (review) di `order.actions.ts` hanya `z.string()`, **tanpa validasi**, lalu dirender sebagai `<a href>` dan `<img src>`. Pakai `z.string().url()` plus `isOwnedImageUrl`, dan tolak skema selain `https:`.
- `createImageUploadAction` mengizinkan **guest** (`uploaderId = "uploads"`) memakai service role untuk membuat signed upload URL. Ekstensi diambil dari nama file klien (`filename.split(".").pop()`), bukan dari `contentType`. Wajibkan login, turunkan ekstensi dari `contentType`, dan rate limit.

### H7. Tidak ada middleware dan tidak ada defense-in-depth
Tidak ada `middleware.ts`. Auth hanya dicek di layout dan per action. Layout Next.js App Router **tidak dirender ulang pada navigasi client**, jadi pengecekan di layout saja tidak cukup. Setiap `page.tsx` dan action wajib cek sendiri (sebagian sudah, sebagian belum, lihat C4). Tambahkan middleware untuk refresh sesi Supabase (`@supabase/ssr` merekomendasikannya) dan guard awal `/admin` dan `/dashboard`.

### H8. `getSession()` menulis ke DB di setiap request
Setiap pemanggilan melakukan `prisma.user.upsert(...)` dengan `update: {}`. Ini write per request (pada halaman yang memanggilnya berkali-kali, jadi berkali-kali per render), menambah beban dan race pada first-login. Gunakan `findUnique`, dan buat user di callback register atau trigger Supabase. Bungkus dengan `React.cache()` agar satu request hanya sekali.

### H9. Header keamanan belum lengkap
`next.config.ts` memiliki `nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`. Belum ada:
- **Content-Security-Policy** (penting karena ada Midtrans Snap script dan JSON-LD)
- **Strict-Transport-Security**
- `X-XSS-Protection` sudah usang, aman dihapus
- `remotePatterns: "*.supabase.co"` terlalu lebar; batasi ke host project Anda

### H10. Cron endpoint terbuka jika `CRON_SECRET` kosong
Kedua cron (`sync-payments`, `auto-complete-orders`) memakai pola `if (cronSecret && header !== ...)`. Jika env tidak di-set, **endpoint terbuka untuk publik**. Balik logikanya: tolak jika secret tidak ada. Gunakan perbandingan konstan-waktu. `sync-payments` juga tidak punya try/catch per item, jadi satu kegagalan menghentikan seluruh batch, dan hanya menyinkronkan tabel `Payment`, bukan `Order`.

---

## 3. Temuan Sedang 🟡

### M1. Error handling: 88 `catch {}` kosong
Pola `catch { // ignore }` / `// Fall through` tersebar di `actions`, `lib`, `app`. Contoh dampak: gagal kirim email, gagal update profil Supabase, gagal Midtrans, gagal DB, semuanya tidak terlihat. Tambahkan logger terstruktur (mis. `pino` atau Sentry) dan bedakan **error yang boleh diabaikan** dari **error yang harus menggagalkan operasi**.

### M2. Wrapper `ActionResult` bagus, tapi tidak konsisten
`lib/action-result.ts` (`ok`/`fail`) adalah pola yang baik. Namun `requireRole`/`requireSeller` memakai `redirect()` di dalam server action. Pada pemanggilan dari client, ini bisa berujung pada `NEXT_REDIRECT` yang tidak tertangani rapi. Untuk action, kembalikan `fail("Sesi berakhir", { code: "UNAUTHENTICATED" })` dan biarkan client mengarahkan. Gunakan `redirect()` hanya di page/layout.

### M3. TanStack Query terpasang tapi tidak dipakai
`Providers` membuat `QueryClient`, tetapi tidak ada `useQuery`/`useMutation` di seluruh repo (0 hasil). Fetch di client dilakukan lewat `useEffect + setTimeout` (checkout shipping) dan `useTransition`. Pilihan: (a) pakai Query untuk shipping rates, status pembayaran (polling), wishlist sync, dan beri retry/backoff; atau (b) hapus dependency agar bundle lebih kecil. Kini hanya biaya tanpa manfaat.

### M4. Tidak ada custom hooks
Tidak ada folder `hooks/`. Logika berulang (debounce, localStorage sync, handler server action + toast) ada langsung di komponen. Ekstrak `useServerAction`, `useDebouncedValue`, `useLocalStorageState`, `useSnapPayment`.

### M5. Context & state klien
- `CompareProvider` menyimpan **seluruh objek `ListingWithRelations`** di localStorage: data cepat basi (harga/stok lama), ukuran besar, tidak tervalidasi saat `JSON.parse`, tidak sinkron antar-tab, dan `value` context tidak di-memoize sehingga semua konsumer re-render pada tiap perubahan. Simpan hanya `id` lalu fetch data segar.
- `lib/cart.ts` sudah memakai `useSyncExternalStore` (bagus) dan event `biji-cart-changed`, tetapi `JSON.parse(raw)` tidak divalidasi Zod. Data rusak atau dimanipulasi bisa menyebabkan crash. Tambahkan event `storage` untuk sinkron antar-tab.
- Harga di cart tersimpan di localStorage. Aman selama server menghitung ulang (memang begitu untuk `price`, tidak untuk ongkir, lihat C8).

### M6. Profil pembeli di cookie tidak bertanda tangan
`updateBuyerProfileAction`: `JSON.parse(existingCookieRaw)` **tanpa try/catch**; cookie yang rusak membuat action melempar 500. Input `addresses` tidak divalidasi Zod (panjang array/string tak terbatas) dan ditulis ke `user_metadata` Supabase, yang ikut masuk JWT dan cookie sesi. Array besar bisa membengkakkan cookie melewati batas 4KB dan merusak sesi. Wishlist juga disimpan di `user_metadata`. Pindahkan alamat dan wishlist ke tabel (`UserAddress` sudah ada di schema Prisma tetapi tidak dipakai di action).

### M7. Dua stack DB sekaligus
Kode memakai **Prisma** (session, subscription, katalog) dan **`pg` raw SQL** (`orders`, `payouts`) bersamaan, ditambah repository mock. Akibatnya: dua pool koneksi di lingkungan serverless (risiko kehabisan koneksi di pgbouncer), tidak ada transaksi lintas keduanya, skema bisa melenceng (raw SQL memakai kolom `"businessName"` camelCase di satu tabel dan snake_case di tabel lain), dan pool tidak punya handler `error`. Satukan ke Prisma (model `Order`, `OrderItem` sudah ada).

### M8. Query tanpa paginasi/batas
`getAllOrders()`, `getOrdersBySeller()`, `getOrdersByBuyer()`, `getAllPayoutRequests()` mengambil semua baris. Tambahkan `LIMIT/OFFSET` atau cursor.

### M9. Script migrasi dijalankan saat build
`"build": "node scripts/migrate-origins-and-crop-year.mjs && prisma generate && next build"`. Migrasi data berjalan **setiap build** terhadap DB yang tersambung, termasuk preview deployment. Pisahkan ke langkah deploy (`prisma migrate deploy`) dan pastikan idempoten.

### M10. Rate limiter in-memory dan mudah dilewati
`lib/rate-limit.ts` memakai `Map` per instance. Di serverless, setiap instance punya hitungan sendiri, jadi limit praktis tidak berlaku. Kunci login hanya `email` (bisa dipakai untuk **mengunci korban** dengan sengaja, bukan membatasi penyerang). `x-forwarded-for` di `/api/track` bisa dipalsukan. Pakai Upstash Redis atau `@vercel/firewall`, dan kombinasikan kunci IP + email. Map juga tidak pernah dibersihkan (memory leak pelan, komentar "auto-pruning" tidak sesuai implementasi).

### M11. Env tidak benar-benar divalidasi
`lib/env.ts` mendefinisikan skema Zod, tetapi hampir seluruh kode membaca `process.env.*` langsung. Semua variabel `optional()`, jadi tidak ada fail-fast di production. Tambahkan `superRefine`: bila `NODE_ENV=production` maka `DATABASE_URL`, `MIDTRANS_SERVER_KEY`, `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` wajib. Terdapat juga ketidakkonsistenan nama: `.env.example` memakai `MIDTRANS_CLIENT_KEY`, `env.ts` memakai `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`, dan variabel RajaOngkir tidak ada di skema.

---

## 4. Shipping (RajaOngkir)

**Baik:** `AbortSignal.timeout(3500)` pada semua panggilan eksternal, cache ID destinasi, dan fallback matriks domestik saat API gagal, sehingga checkout tidak mati total.

**Perlu diperbaiki:**
1. **Ongkir tidak diverifikasi saat order** (C8).
2. `getShippingRatesAction` dan `trackShipmentAction` publik tanpa auth/rate limit, sehingga kuota RajaOngkir bisa dihabiskan.
3. `cachedDestinationIds` adalah `Map` modul tanpa batas ukuran dan TTL.
4. Fallback matriks **diam-diam** menghasilkan tarif perkiraan. User tidak diberi tahu bahwa tarif adalah estimasi. Tambahkan flag `isEstimate` di `ShippingRate` dan tampilkan label di UI.
5. Efek debounce checkout sudah benar (cleanup + flag `canceled`), tetapi `try/finally` tanpa `catch`: error jaringan menghasilkan daftar kurir kosong tanpa pesan. Tampilkan state error + tombol "Coba lagi".
6. Berat (`weightGrams`) berasal dari klien dan tidak divalidasi di server.

---

## 5. Fetch Data, CRUD, Loading/Error

| Aspek | Status |
|---|---|
| Validasi input Zod di action | ✅ Mayoritas ada (`auth`, `listing`, `payout`, `boost`, `inquiry`) |
| CRUD listing seller | ✅ Cek kepemilikan benar (`existing.sellerId !== sellerId`), batas listing per paket, validasi gambar |
| Revalidasi cache | ✅ `revalidatePath` konsisten |
| `loading.tsx` | 🟡 Hanya `admin/`, `dashboard/`, `product/[slug]`, `store/[slug]`. Halaman `orders`, `profile`, `wishlist`, `cart`, `checkout`, `order/success` tidak punya skeleton |
| `error.tsx` | 🟡 Ada di `(public)`, `(admin)`, `(seller)`, ditambah `global-error.tsx` dan `not-found.tsx`. Cukup baik |
| Empty state | ✅ Ada komponen `empty-state`, `error-state`, `route-error` |
| Optimistic update | ❌ Tidak ada (wishlist, stok cepat, toggle status) |
| `toggleListingStatusAction` | 🟡 Menulis ke Prisma lalu juga ke `mockListings`, dan kegagalan DB ditelan. Bisa mengembalikan sukses tanpa perubahan di DB |
| `saveListingAction` | 🟡 Cek batas listing (`totalListings >= maxListings`) lalu `createListing` tidak atomik, sehingga bisa melewati batas dengan request paralel |
| `submitInquiryAction` | 🟡 Rate limit per `buyerContact` (mudah diganti-ganti). Tidak ada CAPTCHA |

---

## 6. UI/UX

**Kelebihan:** skeleton khusus katalog, error boundary berlapis, debounce 350 ms pada ongkir, tombol disabled saat `isPending`, toast Sonner, tema, font display, halaman 404 per rute, `robots.ts` dan `sitemap.ts`, `lang="id"`.

**Masalah:**
- **U1.** Jika `snapToken` kosong (Midtrans gagal/offline), UI masuk cabang "Mock or offline fallback" dan menampilkan toast **"Pesanan berhasil dibuat!"** lalu mengarahkan ke halaman sukses. User mengira sudah beres padahal belum ada cara membayar. Tampilkan error dan tombol "Coba bayar lagi" (action `resumeOrderPaymentAction` sudah ada).
- **U2.** `onClose` Snap langsung `router.push` ke halaman sukses, tetapi `onError` tidak. Pada jaringan putus saat popup terbuka, user terjebak tanpa petunjuk. Tambahkan state "Pembayaran belum selesai" dan polling status (TanStack Query `refetchInterval`).
- **U3.** **Cart dikosongkan sebelum pembayaran selesai** (`removeFromCart` dipanggil sebelum `snap.pay`). Jika user menutup popup atau pembayaran gagal, keranjang hilang. Kosongkan setelah `onSuccess`/`onPending`.
- **U4.** `window.snap` dimuat dengan `strategy="afterInteractive"` di root layout **dan** `lazyOnload` di layout dashboard, jadi script dimuat ganda di dashboard, dan checkout bisa dipanggil sebelum script siap. Muat sekali di layout checkout dan tunggu kesiapan (`onLoad`).
- **U5.** Aksesibilitas belum bisa dinilai penuh (tidak semua komponen dibaca). Hal yang perlu dicek manual: fokus dan label pada `dialog`/`sheet` modal (Base UI cukup baik), `aria-live` untuk toast/validasi, kontras teks `neutral-500` di atas `neutral-50`, dan target sentuh tombol qty `w-7 h-7` (28 px, di bawah 44 px yang direkomendasikan).
- **U6.** Ukuran font `text-[11px]`/`text-xs` dipakai luas di dashboard; periksa keterbacaan di layar kecil.
- **U7.** Halaman sukses menampilkan "Dana Aman Terlindungi" dan "Pembayaran Ditahan" padahal logika escrow baru berupa saldo di aplikasi (bukan rekening escrow). Pastikan klaim sesuai ketentuan layanan dan hukum setempat.

---

## 7. Network Interruption & Race Condition (rangkuman skenario)

| Skenario | Perilaku saat ini | Risiko |
|---|---|---|
| Putus koneksi setelah `createCheckoutOrderAction` sukses, sebelum Snap terbuka | Cart sudah kosong, order `pending_payment` ada, tidak ada indikator | User kehilangan cart, bingung |
| Klik "Bayar" dua kali / retry otomatis | Dua order, dua token | Order ganda |
| Webhook + halaman sukses + polling bersamaan | Tiga penulis status tanpa kunci | Stok dikurangi berkali-kali (C7) |
| Webhook datang terlambat/urutan terbalik | Status ditimpa mundur | Order terkirim menjadi `pending_payment` (C6) |
| DB putus saat checkout | Order hanya di memori | Uang masuk, order hilang (C5) |
| Supabase down saat login | Login mock aktif | Pengambilalihan akun admin (C2) |
| Dua request payout paralel | Keduanya lolos cek saldo | Penarikan melebihi saldo (H4) |
| Dua seller buat listing paralel pada batas paket | Keduanya lolos | Melewati kuota paket |
| Upload gambar putus di tengah | `uploadImage` melempar error dengan pesan jelas | ✅ Baik, tapi tidak ada retry/resume dan file yatim tidak dibersihkan |

---

## 8. Testing & Kualitas Kode

- ✅ Ada Vitest (rate limit, cart, wishlist, midtrans, email, kontrak data, skema), skrip `smoke`, `e2e-roles-test`, `deploy-check`.
- ❌ Tidak ada test **otorisasi** untuk action order (inilah sebabnya C4 lolos). Test action memaksa `DATA_SOURCE=mock`, sehingga jalur DB sungguhan (transaksi, race) tidak teruji.
- ❌ Script `test:e2e` memanggil Playwright, tetapi tidak ada `playwright.config` atau folder e2e di repo.
- 🟡 Banyak cast `as unknown as { sellerId?: string }` pada `Session` padahal tipe sudah memuat `sellerId`/`userId`. Hapus cast agar type safety kembali.
- 🟡 Duplikasi besar: mapper baris→`Order` ditulis ulang 4× di `lib/data/orders.ts`. Ekstrak `mapOrderRow()`.
- 🟡 Dua file `.mjs` migrasi + fallback mock di setiap fungsi data membuat jalur kode berlipat dan sulit diuji.
- 🟡 Kode mati/ekspos berlebih: `confirmOrderPaymentAction` tidak dipanggil UI tetapi tetap berupa endpoint publik.

---

## 9. Rencana Perbaikan Bertahap

### Fase 1: hentikan pendarahan (hari ini)
- [ ] Gate mock session dengan `NODE_ENV !== "production"` (C1)
- [ ] Hapus fail-open `catch → mock session` (C2)
- [ ] Hapus blok "self-heal password123" dan auto-confirm email (C3, H2)
- [ ] Tambah auth + ownership di `order.actions.ts` (C4); jadikan `confirmOrderPaymentAction` internal
- [ ] Wajibkan session/ownership di `/order/success` dan `/order/invoice` (C9)
- [ ] Escape `<` pada JSON-LD (H5)
- [ ] Tolak cron bila `CRON_SECRET` kosong (H10)
- [ ] **Rotasi** `SUPABASE_SERVICE_ROLE_KEY`, `MIDTRANS_SERVER_KEY`, dan password seed jika pernah dipakai di production

### Fase 2: integritas transaksi (minggu ini)
- [ ] State machine order + update bersyarat (C6)
- [ ] Transaksi tunggal untuk paid + kurangi stok (C7)
- [ ] Hapus fallback memori di mode DB; gagal = error (C5)
- [ ] Hitung ongkir server-side, simpan `order_items`, pecah per seller, idempotency key, ID order acak (C8)
- [ ] Ledger saldo + lock untuk payout (H4)
- [ ] Validasi `gross_amount` dan `timingSafeEqual` di webhook (C6)

### Fase 3: kualitas & skala (2–4 minggu)
- [ ] Middleware Supabase + CSP + HSTS (H7, H9)
- [ ] Satukan ke Prisma; hapus `pg` Pool (M7)
- [ ] Rate limit terdistribusi (M10); `env.ts` fail-fast (M11)
- [ ] Putuskan nasib TanStack Query dan hooks (M3, M4); polling status pembayaran
- [ ] Perbaiki UX pembayaran (U1–U4); `loading.tsx` untuk halaman yang kurang
- [ ] Test otorisasi, test race (jalankan DB nyata), Playwright e2e untuk checkout
- [ ] Logger terstruktur/Sentry; ganti `catch {}` kosong (M1)

---

## 10. Hal yang Sudah Baik (pertahankan)

- Pola `ActionResult` (`ok`/`fail`) dan validasi Zod di sebagian besar action
- `safeNextPath` mencegah open redirect setelah login
- Verifikasi signature Midtrans, dan jalur Payment memakai `$transaction`
- Pengecekan kepemilikan listing di aksi seller; `requireRole(["admin"])` di aksi admin
- Deteksi tipe file lewat magic bytes (`detectImageType`) dan kompresi gambar di klien
- Timeout eksternal di shipping, fallback tarif, debounce, dan flag `canceled` di effect
- Struktur route group (`(public)`, `(seller)`, `(admin)`) rapi, `error.tsx`/`not-found.tsx` berlapis
- Header keamanan dasar, `poweredByHeader: false`, index DB yang masuk akal pada schema Prisma
- Cart memakai `useSyncExternalStore`
- Dokumentasi `docs/PRD.md`, `DESIGN.md`, `ARCHITECTURE.md`