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
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;

