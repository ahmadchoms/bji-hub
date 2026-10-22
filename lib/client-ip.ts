import { headers } from "next/headers";

/**
 * Extracts client IP from standard proxy, load balancer, and CDN headers.
 * Safely parses the first IP in x-forwarded-for, x-real-ip, or cf-connecting-ip.
 */
export async function getClientIp(): Promise<string> {
  try {
    const headerList = await headers();
    const forwardedFor = headerList.get("x-forwarded-for");
    if (forwardedFor) {
      const first = forwardedFor.split(",")[0]?.trim();
      if (first) return first;
    }
    const realIp = headerList.get("x-real-ip")?.trim();
    if (realIp) return realIp;
    const cfIp = headerList.get("cf-connecting-ip")?.trim();
    if (cfIp) return cfIp;
  } catch {
    // ignore: headers() might throw outside request lifecycle (e.g. CLI or tests)
  }
  return "127.0.0.1";
}
