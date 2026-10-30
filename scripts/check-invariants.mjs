import fs from "node:fs";
import path from "node:path";

function walk(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === "node_modules" || file === ".next" || file === "dist" || file === ".git") continue;
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath, fileList);
    } else if (file.endsWith(".ts") || file.endsWith(".tsx") || file.endsWith(".js") || file.endsWith(".mjs")) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const errors = [];
const sourceFiles = [
  ...walk("lib"),
  ...walk("actions"),
  ...walk("app"),
];

// Invariant 1: Single pg.Pool instance (only in lib/db/pool.ts and lib/data/prisma/client.ts)
for (const file of sourceFiles) {
  const normalized = file.replace(/\\/g, "/");
  if (normalized === "lib/db/pool.ts" || normalized === "lib/data/prisma/client.ts") continue;
  const content = fs.readFileSync(file, "utf8");
  if (content.includes("new Pool(")) {
    errors.push(`[Invariant Violation] Disallowed 'new Pool(' found in ${normalized}`);
  }
}

// Invariant 2: No invalid raw SQL identifiers
const invalidSqlPatterns = [
  { pattern: /l\.seller_id/g, name: 'l.seller_id (must be l."sellerId" or o.seller_id)' },
  { pattern: /public\.sellers\b/g, name: 'public.sellers (must be public.seller_profiles)' },
  { pattern: /u\.created_at\b/g, name: 'u.created_at (must be u."createdAt")' },
  { pattern: /s\.user_id\b/g, name: 's.user_id (must be s."userId")' },
];

for (const file of sourceFiles) {
  const content = fs.readFileSync(file, "utf8");
  for (const { pattern, name } of invalidSqlPatterns) {
    if (pattern.test(content)) {
      errors.push(`[Invariant Violation] Invalid SQL schema pattern '${name}' found in ${file}`);
    }
  }
}

// Invariant 3: No hacky casts on ListingOrderBy
for (const file of sourceFiles) {
  const content = fs.readFileSync(file, "utf8");
  if (content.includes("as unknown as Prisma.ListingOrderByWithRelationInput")) {
    errors.push(`[Invariant Violation] Disallowed 'as unknown as Prisma.ListingOrderByWithRelationInput' in ${file}`);
  }
}

// Invariant 4: No disallowed 'fallback to mock' outside mock-guard (Audit #8 Section 5.6)
for (const file of sourceFiles) {
  const normalized = file.replace(/\\/g, "/");
  if (normalized === "lib/data/mock-guard.ts" || normalized === "lib/auth/session.ts") continue;
  const content = fs.readFileSync(file, "utf8");
  if (/fallback to mock/i.test(content)) {
    errors.push(`[Invariant Violation] Disallowed 'fallback to mock' pattern in ${file}`);
  }
}

if (errors.length > 0) {
  console.error("Invariant checks failed:\n" + errors.join("\n"));
  process.exit(1);
}

console.log("All codebase invariants passed cleanly!");
