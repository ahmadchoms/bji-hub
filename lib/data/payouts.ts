import { logger } from "@/lib/logger";
import { randomBytes } from "crypto";
import { getPool } from "@/lib/db/pool";
import { assertMockAllowed } from "@/lib/data/mock-guard";
import {
  encryptField,
  decryptField,
  maskAccountNumber,
} from "@/lib/crypto/field-encryption";
import { PayoutRequest, PayoutBatch, PayoutStatus, Order } from "@/types";
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
          bankAccountNumber: maskAccountNumber(res.rows[0].bank_account_number),
          bankAccountHolder: res.rows[0].bank_account_holder,
          bankUpdatedAt: res.rows[0].bank_updated_at
            ? new Date(res.rows[0].bank_updated_at).toISOString()
            : null,
        };
      }
      return null;
    } catch (err) {
      logger.error("payout.get_bank_details_error", err as Error, { sellerId });
      throw err;
    }
  } else {
    assertMockAllowed("getSellerBankDetails:no_pool");
  }

  const mock = mockBankDetails[sellerId];
  if (!mock) return null;
  return {
    ...mock,
    bankAccountNumber: maskAccountNumber(mock.bankAccountNumber),
  };
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
  const encryptedAcc = encryptField(details.bankAccountNumber.trim());
  if (pool) {
    try {
      await pool.query(
        `UPDATE public.seller_profiles
         SET bank_name = $1, bank_account_number = $2, bank_account_holder = $3, bank_updated_at = $5
         WHERE id = $4`,
        [
          details.bankName.trim(),
          encryptedAcc,
          details.bankAccountHolder.trim(),
          sellerId,
          bankUpdatedAt,
        ],
      );
      mockBankDetails[sellerId] = {
        ...details,
        bankAccountNumber: encryptedAcc,
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
        bankAccountNumber: maskAccountNumber(row.bank_account_number),
        bankAccountHolder: row.bank_account_holder,
        status: row.status as PayoutStatus,
        notes: row.notes,
        proofUrl: row.proof_url ?? null,
        processedBy: row.processed_by ?? null,
        processedAt: row.processed_at ? new Date(row.processed_at).toISOString() : null,
        batchId: row.batch_id ?? null,
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
  batchId?: string;
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
    batchId: data.batchId ?? null,
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
          COALESCE((
            SELECT SUM(subtotal - CASE WHEN discount_funded_by = 'seller' THEN discount_amount ELSE 0 END)
            FROM public.orders
            WHERE seller_id = $1 AND status = 'completed'
          ), 0) AS earned,
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
          id, seller_id, amount, bank_name, bank_account_number, bank_account_holder, status, notes, batch_id, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          id,
          data.sellerId,
          data.amount,
          data.bankDetails.bankName,
          encryptField(data.bankDetails.bankAccountNumber),
          data.bankDetails.bankAccountHolder,
          "pending",
          data.notes ?? null,
          data.batchId ?? null,
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
          COALESCE((
            SELECT SUM(subtotal - CASE WHEN discount_funded_by = 'seller' THEN discount_amount ELSE 0 END)
            FROM public.orders
            WHERE seller_id = $1 AND status = 'completed'
          ), 0) AS earned,
          COALESCE((
            SELECT SUM(subtotal - CASE WHEN discount_funded_by = 'seller' THEN discount_amount ELSE 0 END)
            FROM public.orders
            WHERE seller_id = $1 AND status IN ('paid', 'shipped')
          ), 0) AS pending,
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

  const orderNetRevenue = (o: Order) =>
    Number(o.subtotal) - (o.discountFundedBy === "seller" ? Number(o.discountAmount || 0) : 0);

  // Pending balance: orders paid or in transit
  const pendingBalance = orders
    .filter((o) => o.status === "paid" || o.status === "shipped")
    .reduce((sum, o) => sum + orderNetRevenue(o), 0);

  // Total completed orders earnings
  const totalEarned = orders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + orderNetRevenue(o), 0);

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
        bankAccountNumber: maskAccountNumber(row.bank_account_number),
        bankAccountHolder: row.bank_account_holder,
        status: row.status as PayoutStatus,
        notes: row.notes,
        proofUrl: row.proof_url ?? null,
        processedBy: row.processed_by ?? null,
        processedAt: row.processed_at ? new Date(row.processed_at).toISOString() : null,
        batchId: row.batch_id ?? null,
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
  proofUrl?: string,
  processedBy?: string,
): Promise<boolean> {
  if (status === "processed" && !proofUrl) {
    throw new Error("Bukti transfer wajib diunggah sebelum menandai pencairan selesai");
  }

  const pool = getPool();
  const now = new Date().toISOString();

  if (pool) {
    try {
      const res = await pool.query(
        `UPDATE public.payout_requests
         SET status = $1,
             notes = COALESCE($2, notes),
             proof_url = COALESCE($3, proof_url),
             processed_by = COALESCE($4, processed_by),
             processed_at = CASE WHEN $1 = 'processed' THEN $5::timestamp ELSE processed_at END,
             updated_at = $5
         WHERE id = $6 AND status = 'pending'`,
        [status, notes ?? null, proofUrl ?? null, processedBy ?? null, now, payoutId],
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
    if (proofUrl) existing.proofUrl = proofUrl;
    if (processedBy) existing.processedBy = processedBy;
    if (status === "processed") existing.processedAt = now;
    existing.updatedAt = now;
    return true;
  }
  return false;
}

export async function getOrCreateOpenPayoutBatch(scheduledFor?: string): Promise<{
  id: string;
  scheduledFor: string;
  status: string;
}> {
  const pool = getPool();
  const sched = scheduledFor || new Date().toISOString().slice(0, 10);
  if (pool) {
    const existing = await pool.query(
      `SELECT id, scheduled_for::text as scheduled_for, status
       FROM public.payout_batches
       WHERE status = 'open' AND scheduled_for >= $1::date
       ORDER BY scheduled_for ASC LIMIT 1`,
      [sched],
    );
    if (existing.rows.length > 0) return existing.rows[0];
    const ins = await pool.query(
      `INSERT INTO public.payout_batches (scheduled_for, status)
       VALUES ($1::date, 'open')
       RETURNING id, scheduled_for::text as scheduled_for, status`,
      [sched],
    );
    return ins.rows[0];
  }
  return { id: "mock-batch-1", scheduledFor: sched, status: "open" };
}

export async function getAllPayoutBatches(): Promise<
  (PayoutBatch & { payoutCount: number; totalAmount: number })[]
> {
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT b.id, b.scheduled_for::text as scheduled_for, b.status, b.created_by, b.created_at::text as created_at,
                COUNT(p.id)::int as payout_count,
                COALESCE(SUM(p.amount), 0)::numeric as total_amount
         FROM public.payout_batches b
         LEFT JOIN public.payout_requests p ON p.batch_id = b.id
         GROUP BY b.id
         ORDER BY b.scheduled_for DESC`,
      );
      return res.rows.map((r) => ({
        id: r.id,
        scheduledFor: r.scheduled_for,
        status: r.status as "open" | "processing" | "done",
        createdBy: r.created_by,
        createdAt: r.created_at,
        payoutCount: Number(r.payout_count),
        totalAmount: Number(r.total_amount),
      }));
    } catch (err) {
      assertMockAllowed("getAllPayoutBatches");
      logger.warn("payout.get_batches_fallback", { error: (err as Error).message });
    }
  }
  return [
    {
      id: "mock-batch-1",
      scheduledFor: new Date().toISOString().slice(0, 10),
      status: "open",
      createdBy: null,
      createdAt: new Date().toISOString(),
      payoutCount: mockPayoutRequests.length,
      totalAmount: mockPayoutRequests.reduce((s, p) => s + p.amount, 0),
    },
  ];
}

export async function runWeeklyAutoPayoutSweep(): Promise<{
  processedSellers: number;
  createdPayouts: number;
  totalAmount: number;
}> {
  const pool = getPool();
  const minAmount = Number(process.env.PAYOUT_MIN_AMOUNT || 50000);
  let processedSellers = 0;
  let createdPayouts = 0;
  let totalAmount = 0;

  if (pool) {
    const sellersRes = await pool.query(
      `SELECT id, bank_name, bank_account_number, bank_account_holder, bank_updated_at
       FROM public.seller_profiles
       WHERE auto_payout = TRUE AND bank_name IS NOT NULL AND bank_account_number IS NOT NULL`,
    );

    const batch = await getOrCreateOpenPayoutBatch();

    for (const s of sellersRes.rows) {
      processedSellers++;
      // Check 24-hour cooldown
      if (s.bank_updated_at) {
        const elapsed = Date.now() - new Date(s.bank_updated_at).getTime();
        if (elapsed < 24 * 60 * 60 * 1000) continue;
      }

      // Check if already has a pending payout
      const pendingCheck = await pool.query(
        `SELECT 1 FROM public.payout_requests WHERE seller_id = $1 AND status = 'pending' LIMIT 1`,
        [s.id],
      );
      if (pendingCheck.rows.length > 0) continue;

      const balance = await getSellerBalanceSummary(s.id);
      if (balance.availableBalance >= minAmount) {
        let decAcc = s.bank_account_number;
        try {
          if (decAcc && decAcc.startsWith("v1.")) {
            decAcc = decryptField(decAcc);
          }
        } catch {
          // keep
        }

        const res = await createPayoutRequestAtomic({
          sellerId: s.id,
          amount: balance.availableBalance,
          bankDetails: {
            bankName: s.bank_name,
            bankAccountNumber: decAcc,
            bankAccountHolder: s.bank_account_holder,
          },
          notes: "Auto payout terjadwal (mingguan)",
          batchId: batch.id,
        });

        if (res.ok) {
          createdPayouts++;
          totalAmount += balance.availableBalance;
        }
      }
    }
  }

  return { processedSellers, createdPayouts, totalAmount };
}

export interface PayoutExportRow {
  id: string;
  createdAt: string;
  sellerName: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  amount: number;
  notes: string;
  status: string;
}

export async function getPayoutBatchExportRows(batchId?: string): Promise<PayoutExportRow[]> {
  const pool = getPool();
  if (pool) {
    const query = batchId
      ? `SELECT p.*, s."businessName" as seller_name FROM public.payout_requests p LEFT JOIN public.seller_profiles s ON p.seller_id = s.id WHERE p.batch_id = $1 ORDER BY p.created_at ASC`
      : `SELECT p.*, s."businessName" as seller_name FROM public.payout_requests p LEFT JOIN public.seller_profiles s ON p.seller_id = s.id WHERE p.status = 'pending' ORDER BY p.created_at ASC`;
    const params = batchId ? [batchId] : [];
    const res = await pool.query(query, params);

    return res.rows.map((r) => {
      let rawAcc = r.bank_account_number;
      try {
        if (rawAcc && rawAcc.startsWith("v1.")) {
          rawAcc = decryptField(rawAcc);
        }
      } catch {
        // keep fallback
      }
      return {
        id: r.id,
        createdAt: new Date(r.created_at).toISOString(),
        sellerName: r.seller_name || "Mitra Roastery",
        bankName: r.bank_name,
        accountNumber: rawAcc,
        accountHolder: r.bank_account_holder,
        amount: Number(r.amount),
        notes: r.notes || "",
        status: r.status,
      };
    });
  }

  return mockPayoutRequests.map((p) => ({
    id: p.id,
    createdAt: p.createdAt,
    sellerName: "Klasik Preanger Roastery",
    bankName: p.bankName,
    accountNumber: p.bankAccountNumber,
    accountHolder: p.bankAccountHolder,
    amount: p.amount,
    notes: p.notes || "",
    status: p.status,
  }));
}

function csvCell(value: unknown): string {
  let text = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`; // netralkan rumus (H3 Formula Injection Prevention)
  }
  return `"${text.replace(/"/g, '""')}"`;
}

export function generatePayoutBatchCsv(rows: PayoutExportRow[]): string {
  const header = [
    "ID",
    "Tanggal",
    "Penjual",
    "Nama Bank",
    "Nomor Rekening",
    "Nama Pemilik",
    "Jumlah (Rp)",
    "Catatan",
    "Status",
  ];
  const csvLines = [header.map(csvCell).join(",")];

  for (const r of rows) {
    const line = [
      r.id,
      r.createdAt,
      r.sellerName,
      r.bankName,
      r.accountNumber,
      r.accountHolder,
      String(r.amount),
      r.notes,
      r.status,
    ].map(csvCell).join(",");
    csvLines.push(line);
  }

  return csvLines.join("\r\n");
}

