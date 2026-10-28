import { Pool } from "pg";
import { logger } from "@/lib/logger";
import { randomBytes } from "crypto";

let poolInstance: Pool | null = null;

function getPool(): Pool | null {
  if (process.env.DATA_SOURCE === "mock") return null;
  const conn = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!conn) return null;
  if (!poolInstance) {
    poolInstance = new Pool({ connectionString: conn });
  }
  return poolInstance;
}

export interface RefundRecord {
  id: string;
  orderId: string;
  amount: number;
  reason: string;
  status: "pending" | "processed" | "failed" | "manual_required" | "voided";
  providerRef: string | null;
  createdBy: string | null;
  attempts: number;
  failureReason: string | null;
  resolvedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export const mockRefunds: RefundRecord[] = [];

export async function createRefundRecord(data: {
  id?: string;
  orderId: string;
  amount: number;
  reason: string;
  status: "pending" | "processed" | "failed" | "manual_required" | "voided";
  providerRef?: string | null;
  createdBy?: string | null;
  attempts?: number;
  failureReason?: string | null;
  resolvedBy?: string | null;
}): Promise<RefundRecord> {
  const pool = getPool();
  const id = data.id || `ref-${Date.now()}-${randomBytes(3).toString("hex")}`;
  const now = new Date().toISOString();

  const record: RefundRecord = {
    id,
    orderId: data.orderId,
    amount: data.amount,
    reason: data.reason,
    status: data.status,
    providerRef: data.providerRef ?? null,
    createdBy: data.createdBy ?? null,
    attempts: data.attempts ?? 0,
    failureReason: data.failureReason ?? null,
    resolvedBy: data.resolvedBy ?? null,
    createdAt: now,
    updatedAt: now,
  };

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO public.refunds (
          id, order_id, amount, reason, status, provider_ref, created_by, attempts, failure_reason, resolved_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          record.id,
          record.orderId,
          record.amount,
          record.reason,
          record.status,
          record.providerRef,
          record.createdBy,
          record.attempts,
          record.failureReason,
          record.resolvedBy,
          record.createdAt,
          record.updatedAt,
        ],
      );
      return record;
    } catch (err) {
      logger.error("refund.insert_failed", err, { orderId: data.orderId });
      // In DB mode, do not swallow DB errors or silently fall back to mock memory (AUDIT N1)
      throw err;
    }
  }

  mockRefunds.unshift(record);
  return record;
}

export async function updateRefundStatus(
  id: string,
  updates: {
    status: "pending" | "processed" | "failed" | "manual_required" | "voided";
    providerRef?: string | null;
    failureReason?: string | null;
    attempts?: number;
    resolvedBy?: string | null;
  },
): Promise<RefundRecord | null> {
  const pool = getPool();
  const now = new Date().toISOString();
  if (pool) {
    try {
      const res = await pool.query(
        `UPDATE public.refunds
         SET status = $1,
             provider_ref = COALESCE($2, provider_ref),
             failure_reason = COALESCE($3, failure_reason),
             attempts = COALESCE($4, attempts),
             resolved_by = COALESCE($5, resolved_by),
             updated_at = $6
         WHERE id = $7
         RETURNING id, order_id as "orderId", amount, reason, status,
                   provider_ref as "providerRef", created_by as "createdBy",
                   attempts, failure_reason as "failureReason", resolved_by as "resolvedBy",
                   created_at as "createdAt", updated_at as "updatedAt"`,
        [
          updates.status,
          updates.providerRef ?? null,
          updates.failureReason ?? null,
          updates.attempts !== undefined ? updates.attempts : null,
          updates.resolvedBy ?? null,
          now,
          id,
        ],
      );
      if (res.rows.length > 0) {
        return {
          ...res.rows[0],
          amount: Number(res.rows[0].amount),
        };
      }
      return null;
    } catch (err) {
      logger.error("refund.update_failed", err, { id });
      throw err;
    }
  }

  const record = mockRefunds.find((r) => r.id === id);
  if (record) {
    record.status = updates.status;
    if (updates.providerRef !== undefined) record.providerRef = updates.providerRef;
    if (updates.failureReason !== undefined) record.failureReason = updates.failureReason;
    if (updates.attempts !== undefined) record.attempts = updates.attempts;
    if (updates.resolvedBy !== undefined) record.resolvedBy = updates.resolvedBy;
    record.updatedAt = now;
    return { ...record };
  }
  return null;
}

export async function getRefundByOrderId(orderId: string): Promise<RefundRecord | null> {
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT id, order_id as "orderId", amount, reason, status,
                provider_ref as "providerRef", created_by as "createdBy",
                attempts, failure_reason as "failureReason", resolved_by as "resolvedBy",
                created_at as "createdAt", updated_at as "updatedAt"
         FROM public.refunds
         WHERE order_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [orderId],
      );
      if (res.rows.length > 0) {
        return {
          ...res.rows[0],
          amount: Number(res.rows[0].amount),
        };
      }
      return null;
    } catch (err) {
      logger.warn("refund.query_failed", { orderId, error: String(err) });
    }
  }

  return mockRefunds.find((r) => r.orderId === orderId) || null;
}

export async function getPendingOrFailedRefunds(maxAttempts = 5): Promise<RefundRecord[]> {
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT id, order_id as "orderId", amount, reason, status,
                provider_ref as "providerRef", created_by as "createdBy",
                attempts, failure_reason as "failureReason", resolved_by as "resolvedBy",
                created_at as "createdAt", updated_at as "updatedAt"
         FROM public.refunds
         WHERE status IN ('pending', 'failed') AND attempts < $1
         ORDER BY created_at ASC`,
        [maxAttempts],
      );
      return res.rows.map((row) => ({
        ...row,
        amount: Number(row.amount),
      }));
    } catch (err) {
      logger.error("refund.query_pending_failed", err);
      throw err;
    }
  }

  return mockRefunds
    .filter(
      (r) =>
        (r.status === "pending" || r.status === "failed") &&
        (r.attempts ?? 0) < maxAttempts,
    )
    .map((r) => ({ ...r }));
}

export async function getAllRefunds(): Promise<RefundRecord[]> {
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT id, order_id as "orderId", amount, reason, status,
                provider_ref as "providerRef", created_by as "createdBy",
                attempts, failure_reason as "failureReason", resolved_by as "resolvedBy",
                created_at as "createdAt", updated_at as "updatedAt"
         FROM public.refunds
         ORDER BY created_at DESC`,
      );
      return res.rows.map((row) => ({
        ...row,
        amount: Number(row.amount),
      }));
    } catch (err) {
      logger.error("refund.get_all_failed", err);
      throw err;
    }
  }

  return [...mockRefunds];
}

export function _resetMockRefundsForTest() {
  mockRefunds.length = 0;
}
