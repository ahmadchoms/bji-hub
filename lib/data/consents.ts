import { getPool } from "@/lib/db/pool";
import { logger } from "@/lib/logger";
import { assertMockAllowed } from "@/lib/data/mock-guard";
import { ConsentDocument, CURRENT_VERSIONS } from "@/lib/legal/versions";

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
      return res.rows.length > 0;
    } catch (err) {
      assertMockAllowed("hasUserAcceptedLatest");
      logger.warn("consents.has_user_accepted_fallback", { error: (err as Error).message });
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
      return res.rows.map((r) => ({
        id: r.id,
        userId: r.user_id,
        document: r.document as ConsentDocument,
        version: r.version,
        acceptedAt: new Date(r.accepted_at).toISOString(),
        ipHash: r.ip_hash ?? null,
      }));
    } catch (err) {
      assertMockAllowed("getUserConsents");
      logger.warn("consents.get_user_consents_fallback", { error: (err as Error).message });
    }
  } else {
    assertMockAllowed("getUserConsents:no_pool");
  }

  return mockUserConsents.filter((c) => c.userId === userId);
}
