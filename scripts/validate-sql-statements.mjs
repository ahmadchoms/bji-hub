import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import pg from "pg";

const ROOT = process.cwd();
const SKIP_DIRS = new Set(["node_modules", "generated", ".next", "e2e"]);
const SQL_START = /^\s*(SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM|WITH)\b/i;
const IGNORABLE = new Set(["42P18", "42P08", "42725"]); // Parameter types ambiguous / polymorphic function: not a schema failure

function collect(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) collect(full, out);
    } else if (/\.tsx?$/.test(entry.name) && !/\.(test|spec)\./.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const files = ["lib", "actions", "app"].flatMap((d) => collect(path.join(ROOT, d)));
const statements = [];

for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const visit = (node) => {
    let text = null;
    let dynamic = false;
    if (ts.isNoSubstitutionTemplateLiteral(node) || ts.isStringLiteral(node)) {
      text = node.text;
    } else if (ts.isTemplateExpression(node)) {
      dynamic = true;
      text = node.head.text + node.templateSpans.map((s) => "/*DYN*/" + s.literal.text).join("");
    }
    if (text && SQL_START.test(text) && /public\./i.test(text)) {
      statements.push({
        file,
        dynamic,
        sql: text,
        line: sf.getLineAndCharacterOfPosition(node.getStart()).line + 1,
      });
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
}

const dbUrl = process.env.DATABASE_URL || process.env.TEST_DATABASE_URL;

if (!dbUrl) {
  console.log(`Pernyataan SQL ditemukan: ${statements.length}`);
  console.log("ℹ️  Lewati PREPARE SQL: DATABASE_URL / TEST_DATABASE_URL tidak disetel.");
  process.exit(0);
}

const client = new pg.Client({ connectionString: dbUrl });
try {
  await client.connect();
} catch (err) {
  console.warn("⚠️  Tidak dapat terhubung ke database untuk validasi SQL:", (err && err.message) || err);
  if (process.env.CI) {
    process.exit(1);
  }
  process.exit(0);
}

let ok = 0;
let skipped = 0;
const failures = [];
let n = 0;

for (const s of statements) {
  if (s.dynamic) {
    skipped++;
    continue;
  }
  try {
    await client.query("BEGIN");
    await client.query(`PREPARE s${n++} AS ${s.sql.replace(/;\s*$/, "")}`);
    ok++;
  } catch (err) {
    if (IGNORABLE.has(err.code)) {
      skipped++;
    } else {
      failures.push({ ...s, code: err.code, message: err.message });
    }
  } finally {
    await client.query("ROLLBACK").catch(() => {});
  }
}

await client.end().catch(() => {});

console.log(`Pernyataan SQL: ${statements.length}, valid: ${ok}, dilewati: ${skipped}, gagal: ${failures.length}`);
for (const f of failures) {
  console.error(
    `- ${path.relative(ROOT, f.file)}:${f.line} [${f.code}] ${f.message}\n    ${f.sql.replace(/\s+/g, " ").slice(0, 160)}`
  );
}

process.exit(failures.length > 0 ? 1 : 0);
