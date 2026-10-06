// Route and role smoke test. Run against a started app: BASE_URL=http://localhost:3000 node scripts/smoke.mjs
// Mock-only: it authenticates through the mock session cookie. Replace `cookieFor` when real auth exists.
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const cookieFor = (role) =>
  role === "guest" ? undefined : `biji-mock-session=${role}`;
const ROLES = ["guest", "buyer", "seller", "admin"];

async function get(path, role = "guest", init = {}) {
  const res = await fetch(BASE + path, {
    redirect: "manual",
    ...init,
    headers: {
      ...(cookieFor(role) ? { cookie: cookieFor(role) } : {}),
      ...(init.headers ?? {}),
    },
  });
  const body = init.method && init.method !== "GET" ? "" : await res.text();
  return {
    status: res.status,
    location: res.headers.get("location") ?? "",
    body,
  };
}

const visibleText = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");

// Pages with a loading.tsx stream a 200 response, so redirects arrive as an in-body NEXT_REDIRECT marker.
const redirectTarget = (r) =>
  (r.status >= 300 && r.status < 400
    ? r.location
    : r.body.match(/NEXT_REDIRECT;[a-z]+;([^;]+);/)?.[1]) ?? "";

function outcome(r) {
  if (r.status >= 300 && r.status < 400)
    return r.location.startsWith("/login") ? "login" : `redirect:${r.location}`;
  if (r.status === 200 && /NEXT_REDIRECT;[a-z]+;\/login/.test(r.body))
    return "login";
  return String(r.status);
}

const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok, detail });

// 1. Access matrix: expected outcome per role ("200", "login").
const PUBLIC = [
  "/",
  "/pricing",
  "/about",
  "/contact",
  "/terms",
  "/login",
  "/register",
];
const SELLER = [
  "/dashboard",
  "/dashboard/listing",
  "/dashboard/listing/create",
  "/dashboard/analytics",
  "/dashboard/billing",
  "/dashboard/profile",
  "/dashboard/inquiry",
];
const ADMIN = [
  "/admin",
  "/admin/verification",
  "/admin/moderation",
  "/admin/transactions",
];

for (const path of PUBLIC)
  for (const role of ROLES) {
    const r = await get(path, role);
    check(`${role} ${path} -> 200`, outcome(r) === "200", outcome(r));
  }
for (const path of SELLER)
  for (const role of ROLES) {
    const expected = role === "seller" ? "200" : "login";
    const r = await get(path, role);
    check(
      `${role} ${path} -> ${expected}`,
      outcome(r) === expected,
      outcome(r),
    );
  }
for (const path of ADMIN)
  for (const role of ROLES) {
    const expected = role === "admin" ? "200" : "login";
    const r = await get(path, role);
    check(
      `${role} ${path} -> ${expected}`,
      outcome(r) === expected,
      outcome(r),
    );
  }

// 2. Dynamic pages: find real slugs from the homepage, and a missing one.
const home = await get("/");
const product = home.body.match(/\/product\/([a-z0-9-]+)/)?.[1];
const store = home.body.match(/\/store\/([a-z0-9-]+)/)?.[1];
check("homepage links to a product", Boolean(product));
if (product) {
  const r = await get(`/product/${product}`);
  check(
    `product page /product/${product} -> 200`,
    r.status === 200,
    String(r.status),
  );
  check(
    "product page shows the direct-transaction notice",
    visibleText(r.body).includes("Transaksi dilakukan langsung dengan penjual"),
  );
}
if (store)
  check(
    `store page /store/${store} -> 200`,
    (await get(`/store/${store}`)).status === 200,
  );
check(
  "unknown product has noindex",
  /name="robots" content="noindex"/.test(
    (await get("/product/nope-nope")).body,
  ),
);
check("unknown URL -> 404", (await get("/tidak-ada-halaman")).status === 404);
const catalog = await get("/catalog?kategori=drip-bag");
check(
  "/catalog redirects to /?kategori=drip-bag",
  redirectTarget(catalog) === "/?kategori=drip-bag",
  redirectTarget(catalog),
);
const edit = await get("/dashboard/listing/not-mine/edit", "seller");
check(
  "editing a listing that does not exist -> not found (404 or streamed noindex)",
  edit.status === 404 || /name="robots" content="noindex"/.test(edit.body),
  String(edit.status),
);

// 3. Content per role.
const pageText = async (path, role) =>
  visibleText((await get(path, role)).body);
const must = async (path, role, ...needles) => {
  const t = await pageText(path, role);
  for (const n of needles)
    check(`${role} ${path} contains "${n}"`, t.includes(n));
};
await must("/", "guest", "Cari", "produk");
await must("/", "guest", "Masuk", "Jual Kopi");
await must("/", "seller", "Dashboard", "Keluar");
await must("/", "admin", "Admin", "Keluar");
const headerText = async (role) =>
  [...(await get("/", role)).body.matchAll(/<header[\s\S]*?<\/header>/g)]
    .map((m) => visibleText(m[0]))
    .join(" ");
check(
  "admin navbar has no Jual Kopi button",
  !(await headerText("admin")).includes("Jual Kopi"),
);
check(
  "guest navbar has Jual Kopi and Masuk",
  /Jual Kopi/.test(await headerText("guest")) &&
    /Masuk/.test(await headerText("guest")),
);
check(
  "seller navbar has Dashboard and Keluar",
  /Dashboard/.test(await headerText("seller")) &&
    /Keluar/.test(await headerText("seller")),
);
await must("/pricing", "guest", "Gratis", "Growth", "Business");
await must(
  "/dashboard",
  "seller",
  "Ringkasan",
  "Dilihat",
  "Klik Kontak",
  "Paket",
);
await must(
  "/dashboard/billing",
  "seller",
  "Paket Saya",
  "Boost Listing",
  "Riwayat Pembayaran",
);
await must("/dashboard/analytics", "seller", "Analitik", "Per listing");
await must("/dashboard/listing/create", "seller", "Foto Produk", "Pilih foto");
await must("/dashboard/profile", "seller", "Profil");
await must("/admin", "admin", "Total Seller", "Total Pendapatan");
await must("/admin/verification", "admin", "Verifikasi");

// 4. No page may render broken values.
const BROKEN = ["undefined", "NaN", "[object Object]", "Invalid Date", "null"];
for (const [path, role] of [
  ["/", "guest"],
  ["/pricing", "guest"],
  ["/dashboard", "seller"],
  ["/dashboard/billing", "seller"],
  ["/dashboard/analytics", "seller"],
  ["/dashboard/listing", "seller"],
  ["/dashboard/inquiry", "seller"],
  ["/admin", "admin"],
  ["/admin/transactions", "admin"],
  ["/admin/moderation", "admin"],
  ...(product ? [[`/product/${product}`, "guest"]] : []),
]) {
  const t = await pageText(path, role);
  const hit = BROKEN.filter((w) =>
    new RegExp(`\\b${w.replace(/[[\]]/g, "\\$&")}\\b`).test(t),
  );
  check(
    `${role} ${path} has no broken values`,
    hit.length === 0,
    hit.join(", "),
  );
}

// 5. API surface.
const track = (body) =>
  get("/api/track", "guest", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
check(
  "POST /api/track with a bad payload -> 400",
  (await track({ nope: 1 })).status === 400,
);
check(
  "GET unknown stored image -> 404",
  (await get("/api/mock-storage/nope")).status === 404,
);
check(
  "PUT stored image without a session -> 401",
  (await get("/api/mock-storage/nope", "guest", { method: "PUT", body: "x" }))
    .status === 401,
);

const failed = results.filter((r) => !r.ok);
console.log(
  `${results.length - failed.length}/${results.length} checks passed`,
);
for (const f of failed)
  console.log(`FAIL  ${f.name}${f.detail ? `  (got: ${f.detail})` : ""}`);
process.exit(failed.length === 0 ? 0 : 1);
