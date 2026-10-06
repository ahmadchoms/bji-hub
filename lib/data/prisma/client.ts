import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

const globalRef = globalThis as unknown as { __bijiPrisma?: PrismaClient };

/** Created on first use, so mock mode never needs a database. */
export function getPrisma(): PrismaClient {
  if (!globalRef.__bijiPrisma) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is not set (DATA_SOURCE=prisma needs a database).");
    globalRef.__bijiPrisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  }
  return globalRef.__bijiPrisma;
}
