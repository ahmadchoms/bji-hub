import { z } from "zod";
import { logger } from "@/lib/logger";

const productionSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL wajib diisi di production"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL harus berupa URL valid"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY wajib diisi"),
  MIDTRANS_SERVER_KEY: z.string().min(1, "MIDTRANS_SERVER_KEY wajib diisi"),
  MIDTRANS_CLIENT_KEY: z.string().min(1, "MIDTRANS_CLIENT_KEY wajib diisi"),
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL harus berupa URL valid"),
});

export function validateEnv(): boolean {
  // Never crash during vitest test suite or when running in local mock development
  if (process.env.NODE_ENV === "test" || process.env.DATA_SOURCE === "mock") {
    return true;
  }

  if (process.env.NODE_ENV === "production" && process.env.DATA_SOURCE === "prisma") {
    const result = productionSchema.safeParse(process.env);
    if (!result.success) {
      const issues = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
      logger.error("Environment validation failed at boot", undefined, { issues });
      throw new Error(`CRITICAL: Server configuration error. Missing required environment variables: ${issues}`);
    }
  }

  return true;
}
