import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
    try {
      const { validateEnv } = await import("@/lib/env");
      validateEnv();
    } catch (err) {
      console.error("[CRITICAL BOOT ERROR] Environment validation failed:", err);
    }

    try {
      const { getSchemaStatus } = await import("@/lib/db/schema-check");
      const schemaStatus = await getSchemaStatus();
      if (!schemaStatus.ok && schemaStatus.missing && schemaStatus.missing.length > 0) {
        const { logger } = await import("@/lib/logger");
        logger.error("db.schema_behind", undefined, { missing: schemaStatus.missing });
        const { notifyAdmins } = await import("@/lib/data/notifications");
        notifyAdmins({
          title: "Peringatan Migrasi Skema Tertinggal",
          message: `Ditemukan ${schemaStatus.missing.length} migrasi database belum diterapkan: ${schemaStatus.missing.join(", ")}. Segera jalankan 'npx prisma migrate deploy'.`,
          type: "system",
          link: "/admin/maintenance",
        }).catch(() => {}); // ignore: non-blocking boot alert
      }
    } catch {
      // ignore: non-blocking boot check
    }
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;

