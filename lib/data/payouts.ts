import { Pool } from "pg";
import { PayoutRequest, PayoutStatus } from "@/types";
import { getOrdersBySeller } from "@/lib/data/orders";

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

// In-memory mock storage fallback for vitest & offline development
const mockBankDetails: Record<
  string,
  { bankName: string; bankAccountNumber: string; bankAccountHolder: string }
> = {
  "seller-1": {
    bankName: "BCA",
    bankAccountNumber: "8271039841",
    bankAccountHolder: "Klasik Preanger Roastery",
  },
};
const mockPayoutRequests: PayoutRequest[] = [];

export interface SellerBankDetails {
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
}

export async function getSellerBankDetails(
  sellerId: string,
): Promise<SellerBankDetails | null> {
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT bank_name, bank_account_number, bank_account_holder
         FROM public.seller_profiles
         WHERE id = $1 LIMIT 1`,
        [sellerId],
      );
      if (res.rows.length > 0 && res.rows[0].bank_name) {
        return {
          bankName: res.rows[0].bank_name,
          bankAccountNumber: res.rows[0].bank_account_number,
          bankAccountHolder: res.rows[0].bank_account_holder,
        };
      }
    } catch {
      // Fall through to mock
    }
  }

  return mockBankDetails[sellerId] ?? null;
}

export async function updateSellerBankDetails(
  sellerId: string,
  details: SellerBankDetails,
): Promise<boolean> {
  const pool = getPool();
  if (pool) {
    try {
      await pool.query(
        `UPDATE public.seller_profiles
         SET bank_name = $1, bank_account_number = $2, bank_account_holder = $3
         WHERE id = $4`,
        [
          details.bankName.trim(),
          details.bankAccountNumber.trim(),
          details.bankAccountHolder.trim(),
          sellerId,
        ],
      );
      mockBankDetails[sellerId] = details;
      return true;
    } catch (e) {
      console.error("Failed to update bank details in postgres:", e);
    }
  }

  mockBankDetails[sellerId] = details;
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
    } catch {
      // Fall through
    }
  }

  return mockPayoutRequests.filter((p) => p.sellerId === sellerId);
}

export async function createPayoutRequest(data: {
  sellerId: string;
  amount: number;
  bankDetails: SellerBankDetails;
  notes?: string;
}): Promise<PayoutRequest> {
  const pool = getPool();
  const id = `po-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
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
    try {
      await pool.query(
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
    } catch (e) {
      console.error("Failed to insert payout request to postgres:", e);
    }
  }

  mockPayoutRequests.unshift(newPayout);
  return newPayout;
}

export async function getSellerBalanceSummary(sellerId: string): Promise<{
  availableBalance: number;
  pendingBalance: number;
  totalWithdrawn: number;
  totalEarned: number;
}> {
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
    } catch {
      // Fall through
    }
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
      if (notes) {
        await pool.query(
          `UPDATE public.payout_requests
           SET status = $1, notes = $2, updated_at = $3
           WHERE id = $4`,
          [status, notes, now, payoutId],
        );
      } else {
        await pool.query(
          `UPDATE public.payout_requests
           SET status = $1, updated_at = $2
           WHERE id = $3`,
          [status, now, payoutId],
        );
      }
      return true;
    } catch {
      // Fall through
    }
  }

  const existing = mockPayoutRequests.find((p) => p.id === payoutId);
  if (existing) {
    existing.status = status;
    if (notes) existing.notes = notes;
    existing.updatedAt = now;
    return true;
  }
  return false;
}

