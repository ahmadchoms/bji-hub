export const MOCK_SESSION_COOKIE = "biji-mock-session";

/**
 * Mock auth hanya boleh aktif di dev/test, atau di production jika
 * DATA_SOURCE=mock DAN ALLOW_MOCK_AUTH=true diisi secara eksplisit (mode demo).
 */
export function isMockAuthAllowed(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return (
    process.env.DATA_SOURCE === "mock" && process.env.ALLOW_MOCK_AUTH === "true"
  );
}
