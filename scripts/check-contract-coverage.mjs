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
    } else if (file.endsWith(".ts") && !file.endsWith(".test.ts") && !file.endsWith(".spec.ts")) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const sourceFiles = [...walk("lib"), ...walk("actions")];
const rawSqlFiles = [];

for (const file of sourceFiles) {
  const normalized = file.replace(/\\/g, "/");
  if (
    normalized === "lib/db/pool.ts" ||
    normalized === "lib/data/prisma/client.ts" ||
    normalized.startsWith("lib/test/")
  )
    continue;
  const content = fs.readFileSync(file, "utf8");
  if (content.includes("getPool()") || content.includes("pool.query")) {
    rawSqlFiles.push(normalized);
  }
}

const contractTestPath = "lib/data/sql-contract.integration.test.ts";
if (!fs.existsSync(contractTestPath)) {
  console.error(`Missing contract test file: ${contractTestPath}`);
  process.exit(1);
}

const contractContent = fs.readFileSync(contractTestPath, "utf8");
const missing = [];

for (const file of rawSqlFiles) {
  // Check if base filename or relative path is imported/referenced in contract test
  const baseName = path.basename(file, ".ts");
  if (!contractContent.includes(baseName)) {
    missing.push(file);
  }
}

if (missing.length > 0) {
  console.error(
    "Contract test coverage check failed. The following raw SQL modules are not covered in " +
      contractTestPath +
      ":\n" +
      missing.map((f) => " - " + f).join("\n")
  );
  process.exit(1);
}

console.log(
  `Contract test coverage verified: all ${rawSqlFiles.length} raw SQL modules are covered in integration contract tests.`
);
