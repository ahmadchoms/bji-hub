import { logger } from "@/lib/logger";
import { randomUUID } from "crypto";
import { getPool } from "@/lib/db/pool";

export interface AuditLogRecord {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  targetId: string | null;
  targetType: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export const mockAuditLogs: AuditLogRecord[] = [];

export async function recordAuditLog(data: {
  actorId: string;
  actorRole: string;
  action: string;
  targetId?: string | null;
  targetType?: string | null;
  details?: unknown;
  ipAddress?: string | null;
}): Promise<AuditLogRecord> {
  const pool = getPool();
  const id = randomUUID();
  const now = new Date().toISOString();
  const stringifiedDetails =
    data.details !== undefined && data.details !== null
      ? typeof data.details === "string"
        ? data.details
        : JSON.stringify(data.details)
      : null;

  const record: AuditLogRecord = {
    id,
    actorId: data.actorId,
    actorRole: data.actorRole,
    action: data.action,
    targetId: data.targetId ?? null,
    targetType: data.targetType ?? null,
    details: stringifiedDetails,
    ipAddress: data.ipAddress ?? null,
    createdAt: now,
  };

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO public.audit_logs (
          id, actor_id, actor_role, action, target_id, target_type, details, ip_address, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          record.id,
          record.actorId,
          record.actorRole,
          record.action,
          record.targetId,
          record.targetType,
          record.details,
          record.ipAddress,
          record.createdAt,
        ],
      );
      return record;
    } catch (err) {
      logger.error("audit_log.insert_failed", err, { action: data.action, actorId: data.actorId });
      // Non-blocking for business continuity, but logged
    }
  }

  mockAuditLogs.unshift(record);
  return record;
}

export async function getAuditLogs(options?: {
  limit?: number;
  offset?: number;
  action?: string;
  actorId?: string;
}): Promise<AuditLogRecord[]> {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;
  const pool = getPool();

  if (pool) {
    try {
      const conditions: string[] = [];
      const values: (string | number)[] = [];

      if (options?.action) {
        values.push(options.action);
        conditions.push(`action = $${values.length}`);
      }

      if (options?.actorId) {
        values.push(options.actorId);
        conditions.push(`actor_id = $${values.length}`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
      values.push(limit);
      const limitParam = `$${values.length}`;
      values.push(offset);
      const offsetParam = `$${values.length}`;

      const res = await pool.query(
        `SELECT id, actor_id as "actorId", actor_role as "actorRole", action,
                target_id as "targetId", target_type as "targetType",
                details, ip_address as "ipAddress", created_at as "createdAt"
         FROM public.audit_logs
         ${whereClause}
         ORDER BY created_at DESC
         LIMIT ${limitParam} OFFSET ${offsetParam}`,
        values,
      );

      return res.rows.map((row) => ({
        ...row,
        createdAt: new Date(row.createdAt).toISOString(),
      }));
    } catch (err) {
      logger.error("audit_log.query_failed", err);
    }
  }

  let filtered = [...mockAuditLogs];
  if (options?.action) {
    filtered = filtered.filter((l) => l.action === options.action);
  }
  if (options?.actorId) {
    filtered = filtered.filter((l) => l.actorId === options.actorId);
  }

  return filtered.slice(offset, offset + limit);
}

export function _resetMockAuditLogsForTest() {
  mockAuditLogs.length = 0;
}
