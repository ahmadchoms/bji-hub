import { getPool } from "@/lib/db/pool";
import { logger } from "@/lib/logger";
import { assertMockAllowed } from "@/lib/data/mock-guard";
import { ConsentDocument, CURRENT_VERSIONS } from "@/lib/legal/versions";
import { createHmac } from "node:crypto";

export function hashIp(ip: string): string {
  const secret = process.env.COOKIE_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production" && process.env.DATA_SOURCE !== "mock") {
      logger.warn("consents.cookie_secret_missing", { message: "COOKIE_SECRET wajib diisi di production untuk HMAC IP consent, using fallback salt" });
      return createHmac("sha256", "biji-legal-salt-fallback-prod").update(ip).digest("hex").slice(0, 32);
    }
    return createHmac("sha256", "biji-legal-salt-dev").update(ip).digest("hex").slice(0, 32);
  }
  return createHmac("sha256", secret).update(ip).digest("hex").slice(0, 32);
}

export interface UserConsentRecord {
  id: string;
  userId: string;
  document: ConsentDocument;
  version: string;
  acceptedAt: string;
  ipHash: string | null;
}

export const mockUserConsents: UserConsentRecord[] = [];

export async function recordUserConsent(data: {
  userId: string;
  document: ConsentDocument;
  version?: string;
  ipHash?: string | null;
}): Promise<UserConsentRecord> {
  const version = data.version || CURRENT_VERSIONS[data.document];
  const pool = getPool();
  const now = new Date().toISOString();

  if (pool) {
    try {
      const res = await pool.query(
        `INSERT INTO public.user_consents (
          user_id, document, version, accepted_at, ip_hash
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, document, version)
        DO UPDATE SET accepted_at = $4, ip_hash = $5
        RETURNING id, user_id, document, version, accepted_at, ip_hash`,
        [data.userId, data.document, version, now, data.ipHash ?? null],
      );

      const r = res.rows[0];
      return {
        id: r.id,
        userId: r.user_id,
        document: r.document as ConsentDocument,
        version: r.version,
        acceptedAt: new Date(r.accepted_at).toISOString(),
        ipHash: r.ip_hash ?? null,
      };
    } catch (err) {
      logger.warn("consents.record_user_consent_error", { error: (err as Error).message });
      const msg = (err as Error)?.message?.toLowerCase() || "";
      if (
        msg.includes("does not exist") ||
        msg.includes("undefined_table") ||
        msg.includes("foreign key") ||
        msg.includes("violates foreign key constraint")
      ) {
        const id = `temp-${Date.now()}`;
        const record: UserConsentRecord = {
          id,
          userId: data.userId,
          document: data.document,
          version,
          acceptedAt: now,
          ipHash: data.ipHash ?? null,
        };
        const existingIdx = mockUserConsents.findIndex(
          (c) => c.userId === data.userId && c.document === data.document && c.version === version,
        );
        if (existingIdx >= 0) {
          mockUserConsents[existingIdx] = record;
        } else {
          mockUserConsents.push(record);
        }
        return record;
      }
      throw err;
    }
  }

  const existingIdx = mockUserConsents.findIndex(
    (c) => c.userId === data.userId && c.document === data.document && c.version === version,
  );

  if (existingIdx >= 0) {
    mockUserConsents[existingIdx].acceptedAt = now;
    mockUserConsents[existingIdx].ipHash = data.ipHash ?? null;
    return { ...mockUserConsents[existingIdx] };
  }

  const id = `uc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const record: UserConsentRecord = {
    id,
    userId: data.userId,
    document: data.document,
    version,
    acceptedAt: now,
    ipHash: data.ipHash ?? null,
  };
  mockUserConsents.push(record);
  return record;
}

export async function hasUserAcceptedLatest(
  userId: string,
  document: ConsentDocument,
): Promise<boolean> {
  const latestVersion = CURRENT_VERSIONS[document];
  const pool = getPool();

  if (pool) {
    try {
      const res = await pool.query(
        `SELECT 1 FROM public.user_consents
         WHERE user_id = $1 AND document = $2 AND version = $3
         LIMIT 1`,
        [userId, document, latestVersion],
      );
      if (res.rows.length > 0) return true;
    } catch (err) {
      logger.warn("consents.has_user_accepted_fallback", { error: (err as Error).message });
      const msg = (err as Error)?.message?.toLowerCase() || "";
      if (msg.includes("does not exist") || msg.includes("undefined_table")) {
        return true;
      }
      assertMockAllowed("hasUserAcceptedLatest");
    }
  } else {
    assertMockAllowed("hasUserAcceptedLatest:no_pool");
  }

  return mockUserConsents.some(
    (c) => c.userId === userId && c.document === document && c.version === latestVersion,
  );
}

export async function getUserConsents(userId: string): Promise<UserConsentRecord[]> {
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT id, user_id, document, version, accepted_at, ip_hash
         FROM public.user_consents
         WHERE user_id = $1
         ORDER BY accepted_at DESC`,
        [userId],
      );
      if (res.rows.length > 0) {
        return res.rows.map((r) => ({
          id: r.id,
          userId: r.user_id,
          document: r.document as ConsentDocument,
          version: r.version,
          acceptedAt: new Date(r.accepted_at).toISOString(),
          ipHash: r.ip_hash ?? null,
        }));
      }
    } catch (err) {
      assertMockAllowed("getUserConsents");
      logger.warn("consents.get_user_consents_fallback", { error: (err as Error).message });
    }
  } else {
    assertMockAllowed("getUserConsents:no_pool");
  }

  return mockUserConsents.filter((c) => c.userId === userId);
}
