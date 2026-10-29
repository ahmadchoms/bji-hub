import fs from "fs";
import path from "path";

console.log("Checking UI accessibility rules...");
let failed = false;

function walk(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      if (file !== "node_modules" && file !== ".next" && file !== ".git") {
        walk(full, fileList);
      }
    } else if (file.endsWith(".tsx")) {
      fileList.push(full);
    }
  }
  return fileList;
}

const files = [...walk("app"), ...walk("components")];

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");

  // Rule 1: Text size <= 11px
  if (/text-\[1[01]px\]/.test(content)) {
    console.error(`❌ Found text size <= 11px in ${file} (use text-xs >= 12px)`);
    failed = true;
  }

  // Rule 2: Low contrast text-neutral-500
  if (/text-neutral-500/.test(content)) {
    console.error(`❌ Found low-contrast text-neutral-500 in ${file} (use text-neutral-600)`);
    failed = true;
  }

  // Rule 3: Small buttons without coarse pointer expansion
  const buttonMatches = content.match(/<button[^>]*>/gs) || [];
  for (const btn of buttonMatches) {
    if (/\b(h-7|h-8|size-7|size-8)\b/.test(btn) && !btn.includes("coarse:")) {
      console.error(`❌ Found button with small touch target lacking coarse variant in ${file}:\n   ${btn.replace(/\s+/g, " ").slice(0, 80)}`);
      failed = true;
    }
  }
}

// Rule 4: CI check for legacy logger.error("...", { pattern
function walkAll(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      if (file !== "node_modules" && file !== ".next" && file !== ".git") {
        walkAll(full, fileList);
      }
    } else if (file.endsWith(".tsx") || file.endsWith(".ts")) {
      fileList.push(full);
    }
  }
  return fileList;
}

const allSourceFiles = [
  ...walkAll("actions"),
  ...walkAll("app"),
  ...walkAll("components"),
  ...walkAll("lib"),
];

for (const file of allSourceFiles) {
  if (file.includes(".test.") || file.endsWith("logger.ts")) continue;
  const content = fs.readFileSync(file, "utf8");
  if (/logger\.error\(\s*["'][^"']+["']\s*,\s*\{/.test(content)) {
    console.error(`❌ Found legacy logger.error(msg, context) in ${file}; pass error as 2nd arg`);
    failed = true;
  }
}

if (failed) {
  console.error("\nUI rule check failed.");
  process.exit(1);
} else {
  console.log(`✅ All UI accessibility rules passed across ${files.length} tsx files!`);
}
