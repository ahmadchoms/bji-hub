import pg from "pg";
const { Client } = pg;

function parseArgs() {
  const args = process.argv.slice(2);
  let email = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--email" && args[i + 1]) {
      email = args[i + 1];
      i++;
    } else if (args[i].startsWith("--email=")) {
      email = args[i].split("=")[1];
    }
  }
  return email;
}

async function main() {
  const email = parseArgs();
  if (!email) {
    console.error("Error: --email <email> is required.");
    console.error("Usage: npm run admin:promote -- --email=user@example.com");
    process.exit(1);
  }

  const connString = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!connString) {
    console.error("Error: DATABASE_URL or DIRECT_URL is required to promote admin.");
    process.exit(1);
  }

  const client = new Client({ connectionString: connString });
  await client.connect();

  try {
    const res = await client.query(
      `UPDATE "users" SET role = 'ADMIN' WHERE lower(email) = lower($1) RETURNING id, email, role`,
      [email.trim()]
    );

    if (res.rowCount === 0) {
      console.error(`User with email "${email}" not found.`);
      process.exit(1);
    }

    console.log(`Successfully promoted ${res.rowCount} user(s) to ADMIN:`, res.rows);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Promote admin failed:", err);
  process.exit(1);
});
