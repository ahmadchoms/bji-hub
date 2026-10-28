import { z } from "zod";
import { logger } from "@/lib/logger";

const productionSchema = z
  .object({
    DATABASE_URL: z.string().min(1, "DATABASE_URL wajib diisi di production"),
    NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL harus berupa URL valid"),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY wajib diisi"),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY wajib diisi di production"),
    CRON_SECRET: z.string().min(1, "CRON_SECRET wajib diisi di production"),
    RESEND_API_KEY: z.string().optional(),
    EMAIL_MODE: z.enum(["enabled", "disabled"]).optional().default("enabled"),
    MIDTRANS_SERVER_KEY: z.string().min(1, "MIDTRANS_SERVER_KEY wajib diisi"),
    MIDTRANS_CLIENT_KEY: z.string().min(1, "MIDTRANS_CLIENT_KEY wajib diisi"),
    MIDTRANS_IS_PRODUCTION: z.enum(["true", "false"]).optional(),
    NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL harus berupa URL valid"),
    PAYMENT_PROVIDER: z.enum(["midtrans", "mock"]).optional().default("midtrans"),
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().optional(),
    NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
    HEALTH_CHECK_TOKEN: z.string().optional(),
    SENTRY_AUTH_TOKEN: z.string().optional(),
  })
  .refine(
    (data) => {
      // S7: In production, RESEND_API_KEY is mandatory unless explicitly opted out with EMAIL_MODE=disabled
      if (data.EMAIL_MODE !== "disabled" && (!data.RESEND_API_KEY || data.RESEND_API_KEY.trim() === "")) {
        return false;
      }
      return true;
    },
    {
      message: "RESEND_API_KEY wajib diisi di production (atau set EMAIL_MODE=disabled jika sengaja tanpa email)",
      path: ["RESEND_API_KEY"],
    },
  );

export function validateEnv(): boolean {
  // Never crash during vitest test suite or local development
  if (process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development") {
    return true;
  }

  if (process.env.NODE_ENV === "production") {
    const dataSource = process.env.DATA_SOURCE?.trim();
    if (!dataSource) {
      const msg = "CRITICAL: DATA_SOURCE wajib diisi di production";
      logger.error(msg);
      throw new Error(msg);
    }

    if (dataSource === "mock") {
      if (process.env.ALLOW_MOCK_AUTH !== "true") {
        const msg = "CRITICAL: DATA_SOURCE=mock di production dilarang tanpa ALLOW_MOCK_AUTH=true";
        logger.error(msg);
        throw new Error(msg);
      }
      return true;
    }

    if (dataSource === "prisma") {
      const result = productionSchema.safeParse(process.env);
      if (!result.success) {
        const issues = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
        logger.error("Environment validation failed at boot", undefined, { issues });
        throw new Error(`CRITICAL: Server configuration error. Missing required environment variables: ${issues}`);
      }
    }
  }

  return true;
}
