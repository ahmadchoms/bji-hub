#!/usr/bin/env node
import pg from "pg";

const KEY_TABLES = [
  "users",
  "seller_profiles",
  "listings",
  "orders",
  "order_items",
  "payout_requests",
  "refunds",
  "reviews",
  "roast_batches",
  "producer_sellers",
  "vouchers",
  "conversations",
  "currency_rates",
  "user_consents",
];

function parseArgs() {
  const args = process.argv.slice(2);
  let source = process.env.SOURCE_DATABASE_URL || "";
  let target = process.env.TARGET_DATABASE_URL || "";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--source" && args[i + 1]) source = args[++i];
    else if (args[i] === "--target" && args[i + 1]) target = args[++i];
  }

  return { source, target };
}

async function getTableRowCounts(connectionString) {
  const client = new pg.Client({
    connectionString,
    statement_timeout: 15000,
  });

  await client.connect();
  const counts = {};

  try {
    for (const table of KEY_TABLES) {
      try {
        const res = await client.query(`SELECT COUNT(*)::bigint AS count FROM public."${table}"`);
        counts[table] = Number(res.rows[0].count);
      } catch (err) {
        counts[table] = `ERROR: ${err.message.split("\n")[0]}`;
      }
    }
  } finally {
    await client.end();
  }

  return counts;
}

async function main() {
  const { source, target } = parseArgs();

  console.log("==================================================");
  console.log(" Database Restore Row-Count Verifier (E2 / WS-E)");
  console.log("==================================================");

  if (!source || !target) {
    console.error("❌ Missing required connection strings.");
    console.error("Usage: node scripts/compare-row-counts.mjs --source <SOURCE_DB_URL> --target <RESTORED_DB_URL>");
    console.error("Or set SOURCE_DATABASE_URL and TARGET_DATABASE_URL environment variables.");
    process.exit(1);
  }

  console.log("Reading row counts from source database...");
  const sourceCounts = await getTableRowCounts(source);

  console.log("Reading row counts from restored target database...");
  const targetCounts = await getTableRowCounts(target);

  console.log("\n| Table | Source Rows | Restored Rows | Diff | Status |");
  console.log("| :--- | :--- | :--- | :--- | :--- |");

  let discrepancies = 0;

  for (const table of KEY_TABLES) {
    const s = sourceCounts[table];
    const t = targetCounts[table];

    if (typeof s === "number" && typeof t === "number") {
      const diff = t - s;
      const ok = diff === 0;
      if (!ok) discrepancies++;
      const status = ok ? "✅ MATCH" : "❌ MISMATCH";
      console.log(`| \`${table}\` | ${s} | ${t} | ${diff > 0 ? "+" + diff : diff} | ${status} |`);
    } else {
      discrepancies++;
      console.log(`| \`${table}\` | ${s} | ${t} | N/A | ❌ ERROR |`);
    }
  }

  console.log("==================================================");
  if (discrepancies === 0) {
    console.log("✅ Restore drill successful! 100% table counts match perfectly with source.");
    process.exit(0);
  } else {
    console.error(`❌ Found ${discrepancies} table discrepancies between source and restored database.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
