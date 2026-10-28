import { after } from "next/server";
import { logger } from "@/lib/logger";

/**
 * Executes a background task reliably after the response has been sent to the client (A1).
 * Uses Next.js 15 native `after()` to prevent serverless lambdas from terminating
 * before transactional emails or audit records are dispatched.
 * Gracefully falls back if executed outside request lifecycle (e.g. CLI, vitest).
 */
export function runAfterResponse(task: () => Promise<unknown> | unknown): void {
  try {
    if (typeof after === "function") {
      after(async () => {
        try {
          await task();
        } catch (err) {
          logger.error("after_response.task_failed", err);
        }
      });
      return;
    }
  } catch {
    // Outside request context (e.g. testing)
  }

  // Fallback for tests/CLI
  Promise.resolve().then(async () => {
    try {
      await task();
    } catch (err) {
      logger.error("after_response.fallback_task_failed", err);
    }
  });
}
