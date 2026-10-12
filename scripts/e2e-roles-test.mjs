#!/usr/bin/env node
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

console.log("\n=======================================================");
console.log("   AUTOMATED END-TO-END TEST: STEPS A, B, AND C        ");
console.log("=======================================================\n");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

async function request(path, role = "guest", options = {}) {
  const cookie = role === "guest" ? undefined : `biji-mock-session=${role}`;
  const res = await fetch(BASE + path, {
    redirect: "manual",
    ...options,
    headers: { ...(cookie ? { cookie } : {}), ...(options.headers || {}) },
  });
  const text = await res.text();
  return {
    status: res.status,
    text,
    location: res.headers.get("location") || "",
  };
}

// -------------------------------------------------------------------
// STEP A: BUYER FLOW (Catalog, Filter, Taste Radar, WhatsApp Lead)
// -------------------------------------------------------------------
console.log("--- [STEP A: BUYER / ROASTERY FLOW] ---");

const homeRes = await request("/");
assert(homeRes.status === 200, "Beranda & Katalog dapat diakses (HTTP 200)");
assert(homeRes.text.includes("Filter"), "Komponen filter katalog ter-render");

// Cari slug produk dari homepage
const productMatch = homeRes.text.match(/\/product\/([a-z0-9-]+)/);
const sampleSlug = productMatch ? productMatch[1] : null;
assert(Boolean(sampleSlug), `Ditemukan produk di katalog: /product/${sampleSlug}`);

if (sampleSlug) {
  const prodRes = await request(`/product/${sampleSlug}`);
  assert(prodRes.status === 200, `Halaman detail /product/${sampleSlug} (HTTP 200)`);
  assert(
    prodRes.text.includes("Template Chat B2B Langsung"),
    "B2B Negotiation Box (WhatsApp selector) aktif"
  );
  assert(
    prodRes.text.includes("Cetak Cupping Spec Sheet"),
    "Tombol Cetak Cupping Spec Sheet aktif"
  );
  assert(
    prodRes.text.includes("Minta Sampel Cupping"),
    "Modal Permintaan Sampel 100g aktif"
  );
  assert(
    prodRes.text.includes("Radar") || prodRes.text.includes("Acidity") || prodRes.text.includes("Score"),
    "Komponen Taste Profile & Skor Cupping ter-render"
  );
}

// Test Empty State Fallback (Filter mustahil)
const emptyRes = await request("/?q=kopi-luwak-antartika-yang-tidak-ada-12345");
assert(
  emptyRes.text.includes("Tidak Ada Biji Kopi yang Cocok"),
  "Empty state katalog tampil dengan fallback tombol reset & sourcing WA"
);

// -------------------------------------------------------------------
// STEP B: SELLER FLOW (Dashboard, Onboarding Card, Billing & Boost)
// -------------------------------------------------------------------
console.log("\n--- [STEP B: SELLER / PETANI FLOW] ---");

const dashRes = await request("/dashboard", "seller");
assert(dashRes.status === 200, "Seller Dashboard dapat diakses (HTTP 200)");
assert(
  dashRes.text.includes("Ringkasan") || dashRes.text.includes("Produk Aktif"),
  "Seller Dashboard overview & statistik toko tampil (HTTP 200)"
);
assert(
  dashRes.text.includes("Dilihat") && dashRes.text.includes("Klik Kontak"),
  "Metrik analitik kunjungan & kontak tampil"
);

const listingRes = await request("/dashboard/listing", "seller");
assert(listingRes.status === 200, "Seller listing table aktif (HTTP 200)");

const billingRes = await request("/dashboard/billing", "seller");
assert(billingRes.status === 200, "Seller billing & boost aktif (HTTP 200)");
assert(
  billingRes.text.includes("Boost") || billingRes.text.includes("Paket"),
  "Paket langganan & opsi Boost listing terpasang"
);

// -------------------------------------------------------------------
// STEP C: ADMIN FLOW (Moderasi & Verifikasi KYC)
// -------------------------------------------------------------------
console.log("\n--- [STEP C: ADMIN PLATFORM FLOW] ---");

const adminRes = await request("/admin", "admin");
assert(adminRes.status === 200, "Admin Overview dapat diakses (HTTP 200)");

const modRes = await request("/admin/moderation", "admin");
assert(modRes.status === 200, "Admin Moderation panel aktif (HTTP 200)");

const verifRes = await request("/admin/verification", "admin");
assert(verifRes.status === 200, "Admin KYC Verification panel aktif (HTTP 200)");

const txRes = await request("/admin/transactions", "admin");
assert(txRes.status === 200, "Admin Transactions ledger aktif (HTTP 200)");

// -------------------------------------------------------------------
// SECURITY CHECK: Role Access Guard
// -------------------------------------------------------------------
console.log("\n--- [SECURITY & ACCESS GUARD CHECK] ---");
const unauthorizedSeller = await request("/admin", "seller");
assert(
  unauthorizedSeller.status === 307 ||
    unauthorizedSeller.location.startsWith("/login") ||
    unauthorizedSeller.text.includes("NEXT_REDIRECT"),
  "Seller dilarang masuk ke panel /admin (Akses dialihkan ke login)"
);

const unauthorizedGuest = await request("/dashboard", "guest");
assert(
  unauthorizedGuest.status === 307 ||
    unauthorizedGuest.location.startsWith("/login") ||
    unauthorizedGuest.text.includes("NEXT_REDIRECT"),
  "Guest dilarang masuk ke /dashboard tanpa login (Akses dialihkan ke login)"
);

console.log("\n=======================================================");
console.log(`   TEST RESULT: ${passed} PASSED, ${failed} FAILED`);
console.log("=======================================================\n");

if (failed > 0) process.exit(1);
