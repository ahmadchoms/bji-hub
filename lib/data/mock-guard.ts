import { logger } from "@/lib/logger";

/**
 * Ensures fallback to mock data is strictly forbidden in production or whenever DATA_SOURCE !== "mock".
 * Audit #8 Rule 7.
 */
export function isMockAllowed(): boolean {
  return process.env.DATA_SOURCE === "mock";
}

export function assertMockAllowed(context: string): void {
  if (!isMockAllowed()) {
    const error = new Error(`Database failure: mock fallback is disabled when DATA_SOURCE !== "mock" (${context})`);
    logger.error("mock.disallowed_fallback", error);
    throw error;
  }
}
