import { config } from "dotenv";

config({ path: [".env.local", ".env"], quiet: true });
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { seedDatabase } from "./seed-data";

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Refusing to wipe and seed a production database.");
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const counts = await seedDatabase(prisma);
    console.log("Seeded:", counts);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
