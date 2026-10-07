import { config } from "dotenv";
import { defineConfig } from "@prisma/config";

config({ path: [".env.local", ".env"], quiet: true });

const url = process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"];

if (!url && process.argv.some((arg) => arg === "migrate" || arg === "db")) {
  console.error(
    "\n[prisma.config] DATABASE_URL (or DIRECT_URL) is not set. Add it to .env.local or .env first.\n",
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url,
  },
});
