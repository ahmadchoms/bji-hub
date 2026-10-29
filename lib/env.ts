import { z } from "zod";
import { logger } from "@/lib/logger";

const productionSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL wajib diisi di production"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL harus berupa URL valid"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY wajib diisi"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_MODE: z.enum(["enabled", "disabled"]).optional().default("enabled"),
  MIDTRANS_SERVER_KEY: z.string().min(1, "MIDTRANS_SERVER_KEY wajib diisi"),
  MIDTRANS_CLIENT_KEY: z.string().min(1, "MIDTRANS_CLIENT_KEY wajib diisi"),
  MIDTRANS_IS_PRODUCTION: z.enum(["true", "false"]).optional(),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  PAYMENT_PROVIDER: z.enum(["midtrans", "mock"]).optional().default("midtrans"),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  HEALTH_CHECK_TOKEN: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
});

export function validateEnv(): boolean {
  // Never crash during vitest test suite or local development
  if (process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development") {
    return true;
  }

  if (process.env.NODE_ENV === "production") {
    // Auto-fallback: infer DATA_SOURCE if not explicitly set in Vercel
    const dataSource = process.env.DATA_SOURCE?.trim() || (process.env.DATABASE_URL ? "prisma" : undefined);

    if (!dataSource) {
      const msg = "CRITICAL: DATA_SOURCE atau DATABASE_URL wajib diisi di production";
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

      // Non-fatal warnings: Log clearly without crashing the storefront
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        logger.warn("env.missing_service_role_key", {
          warning: "SUPABASE_SERVICE_ROLE_KEY belum diisi. Operasi hapus akun dan admin auth akan terbatas.",
        });
      }

      if (!process.env.CRON_SECRET) {
        logger.warn("env.missing_cron_secret", {
          warning: "CRON_SECRET belum diisi. Endpoint maintenance dan deep health check akan terbatas.",
        });
      }

      if (!process.env.RESEND_API_KEY && process.env.EMAIL_MODE !== "disabled") {
        logger.warn("env.missing_resend_api_key", {
          warning: "RESEND_API_KEY belum diisi. Pengiriman email transaksi berjalan dalam mode mock.",
        });
      }

      // SEC-4: Notify admins once per cold start if operational env keys are omitted
      const missingKeys = [
        !process.env.SUPABASE_SERVICE_ROLE_KEY ? "SUPABASE_SERVICE_ROLE_KEY" : null,
        !process.env.CRON_SECRET ? "CRON_SECRET" : null,
        !process.env.RESEND_API_KEY && process.env.EMAIL_MODE !== "disabled" ? "RESEND_API_KEY" : null,
      ].filter(Boolean) as string[];

      if (missingKeys.length > 0) {
        import("@/lib/data/notifications")
          .then(({ notifyAdmins }) => {
            notifyAdmins({
              title: "Konfigurasi Lingkungan Belum Lengkap (Degraded)",
              message: `Variabel operasional berikut belum diatur: ${missingKeys.join(", ")}. Beberapa fitur admin/cron akan berjalan terbatas.`,
              type: "system",
              link: "/admin/maintenance",
            }).catch(() => {});
          })
          .catch(() => {});
      }
    }
  }

  return true;
}
