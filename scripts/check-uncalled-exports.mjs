import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SKIP_DIRS = new Set(["node_modules", ".next", "dist", ".git", "generated"]);

function collectFiles(dir, exts = [".ts", ".tsx"]) {
  const files = [];
  function walk(current) {
    if (!fs.existsSync(current)) return;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (exts.some((ext) => entry.name.endsWith(ext))) {
        files.push(full);
      }
    }
  }
  walk(dir);
  return files;
}

const actionFiles = collectFiles(path.join(ROOT, "actions")).filter(
  (f) => !f.includes(".test.") && !f.includes(".spec.")
);

// Collect all consumer code outside of tests
const consumerFiles = [
  ...collectFiles(path.join(ROOT, "app")),
  ...collectFiles(path.join(ROOT, "components")),
  ...collectFiles(path.join(ROOT, "actions")),
  ...collectFiles(path.join(ROOT, "lib")),
].filter((f) => !f.includes(".test.") && !f.includes(".spec."));

const consumerCode = consumerFiles
  .map((f) => fs.readFileSync(f, "utf8"))
  .join("\n");

// Explicit allowed uncalled exports (e.g. Next.js server actions called dynamically or exported for API/cron/contracts)
const ALLOWED_EXCEPTIONS = new Set([
  "saveGreenBeanSpecsAction",
  "getSellerRoastBatchesAction",
  "addRoastBatchAction",
  "deleteRoastBatchAction",
  "getOrderInvoiceDataAction",
  "getConversationsAction",
  "getMessagesAction",
  "sendMessageAction",
  "suspendSellerAction",
  "unsuspendSellerAction",
  "confirmOrderPaymentAction",
  "updateCoffeeOriginAction",
]);

const uncalled = [];

for (const file of actionFiles) {
  const content = fs.readFileSync(file, "utf8");
  // Find all named exported functions
  const matches = content.matchAll(/export\s+async\s+function\s+([a-zA-Z0-9_]+)\s*\(/g);
  for (const match of matches) {
    const fnName = match[1];
    if (ALLOWED_EXCEPTIONS.has(fnName)) continue;

    // Count occurrences in consumer files
    // If the function only appears once (its own declaration), it has no callers
    const regex = new RegExp(`\\b${fnName}\\b`, "g");
    const count = (consumerCode.match(regex) || []).length;

    // 1 definition in its own file + 0 call sites = 1 total count
    if (count <= 1) {
      uncalled.push({
        file: path.relative(ROOT, file).replace(/\\/g, "/"),
        fn: fnName,
      });
    }
  }
}

if (uncalled.length > 0) {
  console.error(`[ERROR] Found ${uncalled.length} action exports without active UI/server callers:`);
  for (const u of uncalled) {
    console.error(`  - ${u.file}: ${u.fn}`);
  }
  process.exit(1);
} else {
  console.log("✅ All action exports are referenced and connected to active callers!");
}
