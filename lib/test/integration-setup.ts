import { execSync } from "child_process";
import { Pool } from "pg";

const testDbUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
if (!testDbUrl) {
  throw new Error("TEST_DATABASE_URL or DATABASE_URL must be provided for integration tests.");
}

// Invariant: Test database URL must end with _test or contain /biji_test
if (!testDbUrl.endsWith("_test") && !testDbUrl.includes("/biji_test")) {
  throw new Error(
    "TEST_DATABASE_URL must target a test database (ending in _test or /biji_test). Target was: " +
      testDbUrl
  );
}

// Ensure DATA_SOURCE is prisma for real DB execution
process.env.DATA_SOURCE = "prisma";
process.env.DATABASE_URL = testDbUrl;
delete process.env.DIRECT_URL;

// Ensure target test database exists
try {
  const urlObj = new URL(testDbUrl);
  const dbName = urlObj.pathname.slice(1);
  const defaultDbUrl = testDbUrl.replace("/" + dbName, "/postgres");
  const adminPool = new Pool({ connectionString: defaultDbUrl });
  try {
    const checkDb = await adminPool.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
    if (checkDb.rows.length === 0) {
      await adminPool.query(`CREATE DATABASE "${dbName}"`);
    }
  } catch {
    // Ignore if already created or no root privileges
  } finally {
    await adminPool.end();
  }
} catch {
  // If parsing fails, proceed
}

// Ensure migrations applied
const pool = new Pool({ connectionString: testDbUrl });
try {
  const res = await pool.query("SELECT to_regclass('public._prisma_migrations') as tbl");
  if (!res.rows[0]?.tbl) {
    execSync("npx prisma migrate deploy", {
      env: { ...process.env, DATABASE_URL: testDbUrl },
      stdio: "inherit",
    });
  }
} finally {
  await pool.end();
}
