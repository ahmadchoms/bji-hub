import { logger } from "@/lib/logger";
import { randomBytes } from "crypto";
import { getPool } from "@/lib/db/pool";
import { assertMockAllowed } from "@/lib/data/mock-guard";
import { PayoutRequest, PayoutStatus } from "@/types";
import { getOrdersBySeller } from "@/lib/data/orders";

// In-memory mock storage fallback for vitest & offline development
const mockBankDetails: Record<
  string,
  {
    bankName: string;
    bankAccountNumber: string;
    bankAccountHolder: string;
    bankUpdatedAt?: string | null;
  }
> = {
  "seller-1": {
    bankName: "BCA",
    bankAccountNumber: "8271039841",
    bankAccountHolder: "Klasik Preanger Roastery",
    bankUpdatedAt: null,
  },
};
const mockPayoutRequests: PayoutRequest[] = [];

export interface SellerBankDetails {
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  bankUpdatedAt?: string | null;
}

export type AtomicPayoutResult =
  | { ok: true; payout: PayoutRequest }
  | { ok: false; reason: string };

export async function getSellerBankDetails(
  sellerId: string,
): Promise<SellerBankDetails | null> {
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT bank_name, bank_account_number, bank_account_holder, bank_updated_at
         FROM public.seller_profiles
         WHERE id = $1 LIMIT 1`,
        [sellerId],
      );
      if (res.rows.length > 0 && res.rows[0].bank_name) {
        return {
          bankName: res.rows[0].bank_name,
          bankAccountNumber: res.rows[0].bank_account_number,
          bankAccountHolder: res.rows[0].bank_account_holder,
          bankUpdatedAt: res.rows[0].bank_updated_at
            ? new Date(res.rows[0].bank_updated_at).toISOString()
            : null,
        };
      }
      return null;
    } catch (err) {
      assertMockAllowed("getSellerBankDetails");
      logger.warn("payout.get_bank_details_fallback", { sellerId, error: (err as Error).message });
    }
  } else {
    assertMockAllowed("getSellerBankDetails:no_pool");
  }

  return mockBankDetails[sellerId] ?? null;
}

export async function updateSellerBankDetails(
  sellerId: string,
  details: SellerBankDetails,
): Promise<boolean> {
  const pool = getPool();
  const bankUpdatedAt =
    details.bankUpdatedAt !== undefined
      ? details.bankUpdatedAt
      : new Date().toISOString();
  if (pool) {
    try {
      await pool.query(
        `UPDATE public.seller_profiles
         SET bank_name = $1, bank_account_number = $2, bank_account_holder = $3, bank_updated_at = $5
         WHERE id = $4`,
        [
          details.bankName.trim(),
          details.bankAccountNumber.trim(),
          details.bankAccountHolder.trim(),
          sellerId,
          bankUpdatedAt,
        ],
      );
      mockBankDetails[sellerId] = {
        ...details,
        bankUpdatedAt,
      };
      return true;
    } catch (e) {
      logger.error("payout.update_bank_details_failed", e, { sellerId });
      return false;
    }
  }

  mockBankDetails[sellerId] = {
    ...details,
    bankUpdatedAt,
  };
  return true;
}

export async function getPayoutRequestsBySeller(
  sellerId: string,
): Promise<PayoutRequest[]> {
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT * FROM public.payout_requests
         WHERE seller_id = $1
         ORDER BY created_at DESC`,
        [sellerId],
      );
      return res.rows.map((row) => ({
        id: row.id,
        sellerId: row.seller_id,
        amount: Number(row.amount),
        bankName: row.bank_name,
        bankAccountNumber: row.bank_account_number,
        bankAccountHolder: row.bank_account_holder,
        status: row.status as PayoutStatus,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (err) {
      assertMockAllowed("getPayoutRequestsBySeller");
      logger.warn("payout.get_by_seller_fallback", { sellerId, error: (err as Error).message });
    }
  } else {
    assertMockAllowed("getPayoutRequestsBySeller:no_pool");
  }

  return mockPayoutRequests.filter((p) => p.sellerId === sellerId);
}

export async function createPayoutRequestAtomic(data: {
  sellerId: string;
  amount: number;
  bankDetails: SellerBankDetails;
  notes?: string;
}): Promise<AtomicPayoutResult> {
  const pool = getPool();
  const id = `po-${Date.now()}-${randomBytes(3).toString("hex")}`;
  const now = new Date().toISOString();

  const newPayout: PayoutRequest = {
    id,
    sellerId: data.sellerId,
    amount: data.amount,
    bankName: data.bankDetails.bankName,
    bankAccountNumber: data.bankDetails.bankAccountNumber,
    bankAccountHolder: data.bankDetails.bankAccountHolder,
    status: "pending",
    notes: data.notes ?? null,
    createdAt: now,
    updatedAt: now,
  };

  if (pool) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `SELECT id FROM public.seller_profiles WHERE id = $1 FOR UPDATE`,
        [data.sellerId],
      );

      const aggRes = await client.query(
        `SELECT
          COALESCE((SELECT SUM(subtotal) FROM public.orders WHERE seller_id = $1 AND status = 'completed'), 0) AS earned,
          COALESCE((SELECT SUM(amount) FROM public.payout_requests WHERE seller_id = $1 AND status IN ('pending', 'processed')), 0) AS withdrawn`,
        [data.sellerId],
      );

      const earned = Number(aggRes.rows[0]?.earned || 0);
      const withdrawn = Number(aggRes.rows[0]?.withdrawn || 0);
      const available = earned - withdrawn;

      if (data.amount > available) {
        await client.query("ROLLBACK");
        return {
          ok: false,
          reason: `Saldo siap ditarik tidak mencukupi (Saldo tersedia: Rp ${Math.max(0, available).toLocaleString("id-ID")})`,
        };
      }

      await client.query(
        `INSERT INTO public.payout_requests (
          id, seller_id, amount, bank_name, bank_account_number, bank_account_holder, status, notes, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          id,
          data.sellerId,
          data.amount,
          data.bankDetails.bankName,
          data.bankDetails.bankAccountNumber,
          data.bankDetails.bankAccountHolder,
          "pending",
          data.notes ?? null,
          now,
          now,
        ],
      );

      await client.query("COMMIT");
      return { ok: true, payout: newPayout };
    } catch (e) {
      await client.query("ROLLBACK");
      logger.error("payout.atomic_create_failed", e);
      throw e;
    } finally {
      client.release();
    }
  }

  // In-memory mock check
  const summary = await getSellerBalanceSummary(data.sellerId);
  if (data.amount > summary.availableBalance) {
    return {
      ok: false,
      reason: `Saldo siap ditarik tidak mencukupi (Saldo tersedia: Rp ${Math.max(0, summary.availableBalance).toLocaleString("id-ID")})`,
    };
  }

  mockPayoutRequests.unshift(newPayout);
  return { ok: true, payout: newPayout };
}

export async function createPayoutRequest(data: {
  sellerId: string;
  amount: number;
  bankDetails: SellerBankDetails;
  notes?: string;
}): Promise<PayoutRequest> {
  const res = await createPayoutRequestAtomic(data);
  if (!res.ok) {
    throw new Error(res.reason);
  }
  return res.payout;
}

export async function getSellerBalanceSummary(sellerId: string): Promise<{
  availableBalance: number;
  pendingBalance: number;
  totalWithdrawn: number;
  totalEarned: number;
}> {
  const pool = getPool();
  if (pool) {
    try {
      const aggRes = await pool.query(
        `SELECT
          COALESCE((SELECT SUM(subtotal) FROM public.orders WHERE seller_id = $1 AND status = 'completed'), 0) AS earned,
          COALESCE((SELECT SUM(subtotal) FROM public.orders WHERE seller_id = $1 AND status IN ('paid', 'shipped')), 0) AS pending,
          COALESCE((SELECT SUM(amount) FROM public.payout_requests WHERE seller_id = $1 AND status IN ('pending', 'processed')), 0) AS withdrawn`,
        [sellerId],
      );

      const totalEarned = Number(aggRes.rows[0]?.earned || 0);
      const pendingBalance = Number(aggRes.rows[0]?.pending || 0);
      const totalWithdrawn = Number(aggRes.rows[0]?.withdrawn || 0);
      const availableBalance = Math.max(0, totalEarned - totalWithdrawn);

      return {
        availableBalance,
        pendingBalance,
        totalWithdrawn,
        totalEarned,
      };
    } catch (e) {
      logger.error("payout.query_balance_failed", e);
      throw e;
    }
  }

  const orders = await getOrdersBySeller(sellerId);
  const payouts = await getPayoutRequestsBySeller(sellerId);

  // Pending balance: orders paid or in transit
  const pendingBalance = orders
    .filter((o) => o.status === "paid" || o.status === "shipped")
    .reduce((sum, o) => sum + Number(o.subtotal), 0);

  // Total completed orders earnings
  const totalEarned = orders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + Number(o.subtotal), 0);

  // Withdrawn or in progress
  const totalWithdrawn = payouts
    .filter((p) => p.status === "pending" || p.status === "processed")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const availableBalance = Math.max(0, totalEarned - totalWithdrawn);

  return {
    availableBalance,
    pendingBalance,
    totalWithdrawn,
    totalEarned,
  };
}

export async function getAllPayoutRequests(): Promise<
  (PayoutRequest & { sellerName?: string; whatsappNumber?: string })[]
> {
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT p.*, s."businessName" as seller_name, s."whatsappNumber" as whatsapp_number
         FROM public.payout_requests p
         LEFT JOIN public.seller_profiles s ON p.seller_id = s.id
         ORDER BY p.created_at DESC`,
      );
      return res.rows.map((row) => ({
        id: row.id,
        sellerId: row.seller_id,
        sellerName: row.seller_name,
        whatsappNumber: row.whatsapp_number,
        amount: Number(row.amount),
        bankName: row.bank_name,
        bankAccountNumber: row.bank_account_number,
        bankAccountHolder: row.bank_account_holder,
        status: row.status as PayoutStatus,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (err) {
      assertMockAllowed("getAllPayoutRequests");
      logger.warn("payout.get_all_fallback", { error: (err as Error).message });
    }
  } else {
    assertMockAllowed("getAllPayoutRequests:no_pool");
  }

  return mockPayoutRequests.map((p) => ({
    ...p,
    sellerName: "Klasik Preanger Roastery",
    whatsappNumber: "081234567890",
  }));
}

export async function updatePayoutStatus(
  payoutId: string,
  status: PayoutStatus,
  notes?: string,
): Promise<boolean> {
  const pool = getPool();
  const now = new Date().toISOString();

  if (pool) {
    try {
      const res = await pool.query(
        `UPDATE public.payout_requests
         SET status = $1, notes = COALESCE($2, notes), updated_at = $3
         WHERE id = $4 AND status = 'pending'`,
        [status, notes ?? null, now, payoutId],
      );
      return (res.rowCount ?? 0) > 0;
    } catch (e) {
      logger.error("payout.update_status_failed", e, { payoutId });
      throw e;
    }
  }

  const existing = mockPayoutRequests.find(
    (p) => p.id === payoutId && p.status === "pending",
  );
  if (existing) {
    existing.status = status;
    if (notes) existing.notes = notes;
    existing.updatedAt = now;
    return true;
  }
  return false;
}

