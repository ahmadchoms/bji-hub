import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

const globalRef = globalThis as unknown as {
  __bijiPrisma?: PrismaClient;
  __bijiPool?: Pool;
};

/**
 * Singleton PrismaClient with connection pooling optimized for Vercel/serverless.
 */
export function getPrisma(): PrismaClient {
  if (!globalRef.__bijiPrisma) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set (DATA_SOURCE=prisma needs a database).");
    }

    const pool =
      globalRef.__bijiPool ??
      new Pool({
        connectionString,
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });
    globalRef.__bijiPool = pool;

    globalRef.__bijiPrisma = new PrismaClient({
      adapter: new PrismaPg(pool),
    });
  }
  return globalRef.__bijiPrisma;
}
