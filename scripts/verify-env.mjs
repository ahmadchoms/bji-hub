#!/usr/bin/env node
import fs from "fs";
import path from "path";

const REQUIRED_VARS = [
  "DATABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "MIDTRANS_SERVER_KEY",
  "MIDTRANS_CLIENT_KEY",
  "MIDTRANS_IS_PRODUCTION",
  "NEXT_PUBLIC_APP_URL",
  "CRON_SECRET",
  "HEALTH_CHECK_TOKEN",
  "PAYOUT_ENC_KEY",
  "COOKIE_SECRET",
];

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, "utf8");
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

function validateEnvMap(env, envName) {
  const errors = [];
  const warnings = [];

  for (const key of REQUIRED_VARS) {
    if (!env[key] || env[key].trim() === "") {
      errors.push(`Missing required variable: ${key}`);
    }
  }

  // Validate PAYOUT_ENC_KEY is 32-byte base64
  if (env.PAYOUT_ENC_KEY) {
    try {
      const buf = Buffer.from(env.PAYOUT_ENC_KEY, "base64");
      if (buf.length !== 32) {
        errors.push(`PAYOUT_ENC_KEY must decode to exactly 32 bytes (got ${buf.length})`);
      }
    } catch {
      errors.push("PAYOUT_ENC_KEY is not valid base64");
    }
  }

  // Validate Midtrans is production / sandbox
  if (envName === "staging" && env.MIDTRANS_IS_PRODUCTION === "true") {
    warnings.push("Staging has MIDTRANS_IS_PRODUCTION=true (should be false for sandbox)");
  }
  if (envName === "production" && env.MIDTRANS_IS_PRODUCTION === "false") {
    warnings.push("Production has MIDTRANS_IS_PRODUCTION=false (should be true for live payments)");
  }

  // Validate URLs
  if (env.NEXT_PUBLIC_SUPABASE_URL && !env.NEXT_PUBLIC_SUPABASE_URL.startsWith("https://")) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL must start with https://");
  }
  if (env.DATABASE_URL && !env.DATABASE_URL.startsWith("postgresql://") && !env.DATABASE_URL.startsWith("postgres://")) {
    errors.push("DATABASE_URL must be a postgresql:// connection string");
  }

  return { errors, warnings };
}

function compareEnvironments(stagingEnv, prodEnv) {
  const sharedKeys = [];
  const sensitiveKeys = [
    "DATABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "MIDTRANS_SERVER_KEY",
    "CRON_SECRET",
    "HEALTH_CHECK_TOKEN",
    "PAYOUT_ENC_KEY",
  ];

  for (const key of sensitiveKeys) {
    if (stagingEnv[key] && prodEnv[key] && stagingEnv[key] === prodEnv[key]) {
      sharedKeys.push(key);
    }
  }

  return sharedKeys;
}

function main() {
  const args = process.argv.slice(2);
  let stagingPath = null;
  let prodPath = null;
  let targetEnv = process.env.TARGET_ENV || "current";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--staging" && args[i + 1]) stagingPath = args[++i];
    else if (args[i] === "--production" && args[i + 1]) prodPath = args[++i];
    else if (args[i] === "--env" && args[i + 1]) targetEnv = args[++i];
  }

  console.log("==================================================");
  console.log(" Environment Configuration Verifier (E1 / WS-E)");
  console.log("==================================================");

  if (stagingPath && prodPath) {
    console.log(`Checking Staging: ${stagingPath}`);
    console.log(`Checking Production: ${prodPath}\n`);

    const sEnv = parseEnvFile(stagingPath);
    const pEnv = parseEnvFile(prodPath);

    const sVal = validateEnvMap(sEnv, "staging");
    const pVal = validateEnvMap(pEnv, "production");
    const shared = compareEnvironments(sEnv, pEnv);

    console.log(`--- Staging Validation ---`);
    if (sVal.errors.length === 0) console.log("✅ Staging environment variables passed validation.");
    else sVal.errors.forEach((e) => console.error(`❌ [Staging] ${e}`));

    console.log(`\n--- Production Validation ---`);
    if (pVal.errors.length === 0) console.log("✅ Production environment variables passed validation.");
    else pVal.errors.forEach((e) => console.error(`❌ [Production] ${e}`));

    console.log(`\n--- Cross-Environment Isolation Check ---`);
    if (shared.length === 0) {
      console.log("✅ Zero key sharing detected! Staging and production keys are strictly isolated.");
    } else {
      console.error(`❌ SECURITY VIOLATION: Staging and Production share identical credentials for:`);
      shared.forEach((k) => console.error(`   - ${k}`));
    }

    if (sVal.errors.length > 0 || pVal.errors.length > 0 || shared.length > 0) {
      process.exit(1);
    }
    console.log("\n✅ All environment verification checks passed successfully!");
    return;
  }

  // Validate current environment
  const currentEnv = process.env;
  const res = validateEnvMap(currentEnv, targetEnv);

  console.log(`Checking current process environment for mode: '${targetEnv}'\n`);
  if (res.errors.length > 0) {
    console.error("❌ Environment validation failed with errors:");
    res.errors.forEach((e) => console.error(`   - ${e}`));
  } else {
    console.log("✅ All required environment variables are present and well-formed.");
  }

  if (res.warnings.length > 0) {
    console.warn("⚠️  Warnings:");
    res.warnings.forEach((w) => console.warn(`   - ${w}`));
  }

  if (res.errors.length > 0) process.exit(1);
}

main();
