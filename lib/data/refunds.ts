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
  status: "pending" | "processed" | "failed" | "manual_required";
  providerRef: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export const mockRefunds: RefundRecord[] = [];

export async function createRefundRecord(data: {
  orderId: string;
  amount: number;
  reason: string;
  status: "pending" | "processed" | "failed" | "manual_required";
  providerRef?: string | null;
  createdBy?: string | null;
}): Promise<RefundRecord> {
  const pool = getPool();
  const id = `ref-${Date.now()}-${randomBytes(3).toString("hex")}`;
  const now = new Date().toISOString();

  const record: RefundRecord = {
    id,
    orderId: data.orderId,
    amount: data.amount,
    reason: data.reason,
    status: data.status,
    providerRef: data.providerRef ?? null,
    createdBy: data.createdBy ?? null,
    createdAt: now,
    updatedAt: now,
  };

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO public.refunds (
          id, order_id, amount, reason, status, provider_ref, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          record.id,
          record.orderId,
          record.amount,
          record.reason,
          record.status,
          record.providerRef,
          record.createdBy,
          record.createdAt,
          record.updatedAt,
        ],
      );
      return record;
    } catch (err) {
      logger.error("refund.insert_failed", err, { orderId: data.orderId });
      // Fall through to in-memory store if DB query fails
    }
  }

  mockRefunds.unshift(record);
  return record;
}

export async function getRefundByOrderId(orderId: string): Promise<RefundRecord | null> {
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT id, order_id as "orderId", amount, reason, status,
                provider_ref as "providerRef", created_by as "createdBy",
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

export function _resetMockRefundsForTest() {
  mockRefunds.length = 0;
}
