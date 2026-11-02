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

// Explicit allowed uncalled exports with mandatory reason comments (J7)
const ALLOWED_EXCEPTIONS = {
  saveGreenBeanSpecsAction: "Green bean specifications update action, wired in Task J3",
  getSellerRoastBatchesAction: "Exposed for seller batch overview and future analytics integrations",
  addRoastBatchAction: "Exposed for seller roast batch creation workflows",
  deleteRoastBatchAction: "Exposed for seller batch deletion workflows",
  getOrderInvoiceDataAction: "Exposed for client invoice generation and PDF exports",
  getConversationsAction: "Exposed for messaging polling and realtime UI",
  getMessagesAction: "Exposed for message thread loading",
  sendMessageAction: "Exposed for direct chat message sending",
  suspendSellerAction: "Administrative action for moderation and trust operations",
  unsuspendSellerAction: "Administrative action for moderation restoration",
  confirmOrderPaymentAction: "Manual admin confirmation for direct wire transfers",
  updateCoffeeOriginAction: "Exposed for origin catalog editorial maintenance",
};

// Validate that every exception has an informative rationale
for (const [name, reason] of Object.entries(ALLOWED_EXCEPTIONS)) {
  if (!reason || typeof reason !== "string" || reason.trim().length < 5) {
    console.error(`[Invariant Violation] ALLOWED_EXCEPTIONS entry '${name}' must have a valid explanatory rationale.`);
    process.exit(1);
  }
}

const uncalled = [];

for (const file of actionFiles) {
  const content = fs.readFileSync(file, "utf8");
  // Find all named exported functions
  const matches = content.matchAll(/export\s+async\s+function\s+([a-zA-Z0-9_]+)\s*\(/g);
  for (const match of matches) {
    const fnName = match[1];
    if (fnName in ALLOWED_EXCEPTIONS) continue;

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
