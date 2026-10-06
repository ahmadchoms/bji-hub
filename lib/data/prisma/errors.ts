export function hasErrorCode(error: unknown, code: string): boolean {
  return typeof error === "object" && error !== null && (error as { code?: unknown }).code === code;
}

/** Prisma: unique constraint failed. */
export const isUniqueViolation = (error: unknown): boolean => hasErrorCode(error, "P2002");

/** Prisma: record to update or delete does not exist. */
export const isNotFound = (error: unknown): boolean => hasErrorCode(error, "P2025");
