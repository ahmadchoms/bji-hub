#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Publicly readable tables where anon select is intentionally permitted if RLS policy allows it
const PUBLIC_READ_TABLES = new Set([
  "listings",
  "coffee_origins",
  "producers",
  "taste_profiles",
  "listing_flavor_tags",
  "currency_rates",
]);

function parseArgs() {
  const args = process.argv.slice(2);
  let url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  let key = process.env.ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--url" && args[i + 1]) {
      url = args[++i];
    } else if (args[i] === "--key" && args[i + 1]) {
      key = args[++i];
    }
  }

  return { url: url.replace(/\/$/, ""), key };
}

function getTablesFromPrismaSchema() {
  const schemaPath = path.resolve(__dirname, "../prisma/schema.prisma");
  const content = fs.readFileSync(schemaPath, "utf8");
  const tables = [];
  const lines = content.split("\n");

  let currentModel = null;
  for (const line of lines) {
    const trimmed = line.trim();
    const modelMatch = trimmed.match(/^model\s+([A-Za-z0-9_]+)\s+\{/);
    if (modelMatch) {
      currentModel = modelMatch[1];
    } else if (trimmed.startsWith("@@map(")) {
      const mapMatch = trimmed.match(/@@map\("([^"]+)"\)/);
      if (mapMatch) {
        tables.push(mapMatch[1]);
        currentModel = null;
      }
    } else if (trimmed === "}" && currentModel) {
      // Model without @@map maps to lowercased or exact name
      tables.push(currentModel);
      currentModel = null;
    }
  }

  return [...new Set(tables)].sort();
}

async function verifyTableRLS(supabaseUrl, anonKey, table) {
  const endpoint = `${supabaseUrl}/rest/v1/${table}`;
  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    "Content-Type": "application/json",
  };

  // 1. Read check: GET /rest/v1/<table>?select=*&limit=1
  let readPass = false;
  let readDetail = "";
  try {
    const getRes = await fetch(`${endpoint}?select=*&limit=1`, {
      method: "GET",
      headers,
    });

    const status = getRes.status;
    let data = null;
    try {
      data = await getRes.json();
    } catch {
      data = null;
    }

    if (status === 401 || status === 403) {
      readPass = true;
      readDetail = `${status} (Blocked by RLS)`;
    } else if (status === 200 && Array.isArray(data) && data.length === 0) {
      readPass = true;
      readDetail = "200 [] (No rows returned)";
    } else if (status === 200 && PUBLIC_READ_TABLES.has(table)) {
      readPass = true;
      readDetail = `200 [${data?.length || 0} rows] (Public catalog allowed)`;
    } else {
      readPass = false;
      readDetail = `${status} Leaked data or unexpected status: ${JSON.stringify(data).slice(0, 50)}`;
    }
  } catch (err) {
    readPass = false;
    readDetail = `Fetch error: ${err.message}`;
  }

  // 2. Write check: empty POST /rest/v1/<table>
  let writePass = false;
  let writeDetail = "";
  try {
    const postRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        ...headers,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({}),
    });

    const status = postRes.status;
    // Accepted statuses indicating write succeeded: 200, 201, 204
    if (status === 200 || status === 201 || status === 204) {
      writePass = false;
      writeDetail = `${status} UNPROTECTED (Write succeeded!)`;
    } else {
      writePass = true;
      writeDetail = `${status} (Write rejected)`;
    }
  } catch (err) {
    // If request fails due to network/refused, write was not accepted
    writePass = true;
    writeDetail = `Error: ${err.message}`;
  }

  return {
    table,
    readPass,
    readDetail,
    writePass,
    writeDetail,
    ok: readPass && writePass,
  };
}

async function main() {
  const { url, key } = parseArgs();

  console.log("==========================================");
  console.log(" Supabase RLS & API Security Verifier (E5)");
  console.log("==========================================");

  if (!url || !key) {
    console.error("❌ Missing SUPABASE_URL or ANON_KEY.");
    console.error("Usage: node scripts/verify-rls.mjs --url <SUPABASE_URL> --key <ANON_KEY>");
    console.error("Or set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and ANON_KEY in environment.");
    process.exit(1);
  }

  console.log(`Target Supabase URL: ${url}`);
  console.log(`Anon Key present: ${key.slice(0, 8)}...${key.slice(-4)}`);

  const tables = getTablesFromPrismaSchema();
  console.log(`Found ${tables.length} tables in schema.prisma:\n${tables.join(", ")}\n`);

  console.log(
    "| Table | Read Security | Write Security | Status |"
  );
  console.log(
    "| :--- | :--- | :--- | :--- |"
  );

  let allPassed = true;
  for (const table of tables) {
    const res = await verifyTableRLS(url, key, table);
    if (!res.ok) allPassed = false;
    const icon = res.ok ? "✅ PASS" : "❌ FAIL";
    console.log(
      `| \`${res.table}\` | ${res.readDetail} | ${res.writeDetail} | ${icon} |`
    );
  }

  console.log("==========================================");
  if (allPassed) {
    console.log("✅ All tables passed RLS verification checks!");
    process.exit(0);
  } else {
    console.error("❌ One or more tables failed RLS verification checks!");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
