import { getPool } from "@/lib/db/pool";
import { logger } from "@/lib/logger";
import { assertMockAllowed } from "@/lib/data/mock-guard";
import {
  calculateVoucherDiscount,
  type VoucherData,
  type VoucherType,
  type DiscountFundedBy,
} from "@/lib/vouchers";

export type { VoucherData, VoucherType, DiscountFundedBy };

export const mockVouchers: VoucherData[] = [
  {
    id: "v-welcome-10",
    code: "BIJIBARU10",
    sellerId: null, // platform voucher
    type: "percent",
    value: 10,
    minSubtotal: 50000,
    maxDiscount: 20000,
    startsAt: "2026-01-01T00:00:00.000Z",
    endsAt: "2027-12-31T23:59:59.000Z",
    usageLimit: 1000,
    perUserLimit: 1,
    usedCount: 0,
    active: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "v-ongkir-free",
    code: "GRATISONGKIR",
    sellerId: null, // platform voucher
    type: "free_shipping",
    value: 0,
    minSubtotal: 80000,
    maxDiscount: 15000,
    startsAt: "2026-01-01T00:00:00.000Z",
    endsAt: "2027-12-31T23:59:59.000Z",
    usageLimit: 500,
    perUserLimit: 2,
    usedCount: 0,
    active: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

export interface MockVoucherRedemption {
  id: string;
  voucherId: string;
  userKey: string;
  orderId: string;
  amount: number;
  releasedAt: string | null;
  createdAt: string;
}

export const mockVoucherRedemptions: MockVoucherRedemption[] = [];

export interface ValidateVoucherResult {
  valid: boolean;
  voucher?: VoucherData;
  discountAmount?: number;
  discountFundedBy?: DiscountFundedBy;
  reason?: string;
}

export async function getVoucherByCode(code: string): Promise<VoucherData | null> {
  const normalized = code.trim().toUpperCase();
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT id, code, seller_id, type, value, min_subtotal, max_discount,
                starts_at, ends_at, usage_limit, per_user_limit, used_count, active, created_at
         FROM public.vouchers
         WHERE UPPER(code) = $1`,
        [normalized],
      );
      if (res.rows.length === 0) return null;
      const r = res.rows[0];
      return {
        id: r.id,
        code: r.code,
        sellerId: r.seller_id ?? null,
        type: r.type as VoucherType,
        value: Number(r.value),
        minSubtotal: Number(r.min_subtotal),
        maxDiscount: r.max_discount !== null ? Number(r.max_discount) : null,
        startsAt: new Date(r.starts_at).toISOString(),
        endsAt: new Date(r.ends_at).toISOString(),
        usageLimit: r.usage_limit !== null ? Number(r.usage_limit) : null,
        perUserLimit: Number(r.per_user_limit),
        usedCount: Number(r.used_count),
        active: Boolean(r.active),
        createdAt: new Date(r.created_at).toISOString(),
      };
    } catch (err) {
      assertMockAllowed("getVoucherByCode");
      logger.warn("voucher.get_by_code_fallback", { error: (err as Error).message });
    }
  } else {
    assertMockAllowed("getVoucherByCode:no_pool");
  }

  const found = mockVouchers.find((v) => v.code.toUpperCase() === normalized);
  return found ? { ...found } : null;
}

export async function validateVoucher(options: {
  code: string;
  subtotal: number;
  shippingCost: number;
  userKey: string;
  sellerId?: string | null;
}): Promise<ValidateVoucherResult> {
  const { code, subtotal, shippingCost, userKey, sellerId } = options;
  if (!code || !code.trim()) {
    return { valid: false, reason: "Kode voucher tidak boleh kosong" };
  }

  const voucher = await getVoucherByCode(code);
  if (!voucher) {
    return { valid: false, reason: "Kode voucher tidak ditemukan" };
  }

  if (!voucher.active) {
    return { valid: false, reason: "Voucher saat ini sedang tidak aktif" };
  }

  const now = new Date();
  const starts = new Date(voucher.startsAt);
  const ends = new Date(voucher.endsAt);
  if (now < starts) {
    return { valid: false, reason: "Voucher belum dapat digunakan" };
  }
  if (now > ends) {
    return { valid: false, reason: "Voucher telah kedaluwarsa" };
  }

  if (voucher.sellerId && sellerId && voucher.sellerId !== sellerId) {
    return { valid: false, reason: "Voucher ini hanya berlaku untuk toko tertentu" };
  }

  if (voucher.usageLimit !== null && voucher.usageLimit !== undefined && voucher.usedCount >= voucher.usageLimit) {
    return { valid: false, reason: "Kuota penggunaan voucher telah habis" };
  }

  if (subtotal < voucher.minSubtotal) {
    return {
      valid: false,
      reason: `Minimal belanja Rp ${voucher.minSubtotal.toLocaleString("id-ID")} untuk menggunakan voucher ini`,
    };
  }

  // Count active (unreleased) redemptions for this user
  let userRedemptionCount = 0;
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT COUNT(*)::int AS count
         FROM public.voucher_redemptions
         WHERE voucher_id = $1 AND user_key = $2 AND released_at IS NULL`,
        [voucher.id, userKey],
      );
      userRedemptionCount = Number(res.rows[0]?.count || 0);
    } catch (err) {
      assertMockAllowed("validateVoucher:redemptions_count");
      logger.warn("voucher.user_redemptions_count_fallback", { error: (err as Error).message });
    }
  } else {
    userRedemptionCount = mockVoucherRedemptions.filter(
      (r) => r.voucherId === voucher.id && r.userKey === userKey && !r.releasedAt,
    ).length;
  }

  if (userRedemptionCount >= voucher.perUserLimit) {
    return {
      valid: false,
      reason: "Batas penggunaan voucher untuk akun Anda telah tercapai",
    };
  }

  const discount = calculateVoucherDiscount(voucher, subtotal, shippingCost);
  if (discount <= 0) {
    return {
      valid: false,
      reason: "Syarat diskon voucher tidak terpenuhi pada pesanan ini",
    };
  }

  return {
    valid: true,
    voucher,
    discountAmount: discount,
    discountFundedBy: voucher.sellerId ? "seller" : "platform",
  };
}

export async function createVoucher(data: {
  code: string;
  sellerId?: string | null;
  type: VoucherType;
  value: number;
  minSubtotal?: number;
  maxDiscount?: number | null;
  startsAt: string;
  endsAt: string;
  usageLimit?: number | null;
  perUserLimit?: number;
}): Promise<VoucherData> {
  const normalizedCode = data.code.trim().toUpperCase();
  const pool = getPool();
  const minSubtotal = data.minSubtotal ?? 0;
  const maxDiscount = data.maxDiscount ?? null;
  const usageLimit = data.usageLimit ?? null;
  const perUserLimit = data.perUserLimit ?? 1;

  if (pool) {
    const res = await pool.query(
      `INSERT INTO public.vouchers (
        code, seller_id, type, value, min_subtotal, max_discount,
        starts_at, ends_at, usage_limit, per_user_limit, used_count, active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, true)
      RETURNING id, code, seller_id, type, value, min_subtotal, max_discount,
                starts_at, ends_at, usage_limit, per_user_limit, used_count, active, created_at`,
      [
        normalizedCode,
        data.sellerId ?? null,
        data.type,
        data.value,
        minSubtotal,
        maxDiscount,
        data.startsAt,
        data.endsAt,
        usageLimit,
        perUserLimit,
      ],
    );
    const r = res.rows[0];
    return {
      id: r.id,
      code: r.code,
      sellerId: r.seller_id ?? null,
      type: r.type as VoucherType,
      value: Number(r.value),
      minSubtotal: Number(r.min_subtotal),
      maxDiscount: r.max_discount !== null ? Number(r.max_discount) : null,
      startsAt: new Date(r.starts_at).toISOString(),
      endsAt: new Date(r.ends_at).toISOString(),
      usageLimit: r.usage_limit !== null ? Number(r.usage_limit) : null,
      perUserLimit: Number(r.per_user_limit),
      usedCount: Number(r.used_count),
      active: Boolean(r.active),
      createdAt: new Date(r.created_at).toISOString(),
    };
  }

  const id = `v-mock-${Date.now()}`;
  const now = new Date().toISOString();
  const newVoucher: VoucherData = {
    id,
    code: normalizedCode,
    sellerId: data.sellerId ?? null,
    type: data.type,
    value: data.value,
    minSubtotal,
    maxDiscount,
    startsAt: data.startsAt,
    endsAt: data.endsAt,
    usageLimit,
    perUserLimit,
    usedCount: 0,
    active: true,
    createdAt: now,
  };
  mockVouchers.unshift(newVoucher);
  return newVoucher;
}

export async function getVouchersBySeller(sellerId: string): Promise<VoucherData[]> {
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT id, code, seller_id, type, value, min_subtotal, max_discount,
                starts_at, ends_at, usage_limit, per_user_limit, used_count, active, created_at
         FROM public.vouchers
         WHERE seller_id = $1
         ORDER BY created_at DESC`,
        [sellerId],
      );
      return res.rows.map((r) => ({
        id: r.id,
        code: r.code,
        sellerId: r.seller_id ?? null,
        type: r.type as VoucherType,
        value: Number(r.value),
        minSubtotal: Number(r.min_subtotal),
        maxDiscount: r.max_discount !== null ? Number(r.max_discount) : null,
        startsAt: new Date(r.starts_at).toISOString(),
        endsAt: new Date(r.ends_at).toISOString(),
        usageLimit: r.usage_limit !== null ? Number(r.usage_limit) : null,
        perUserLimit: Number(r.per_user_limit),
        usedCount: Number(r.used_count),
        active: Boolean(r.active),
        createdAt: new Date(r.created_at).toISOString(),
      }));
    } catch (err) {
      assertMockAllowed("getVouchersBySeller");
      logger.warn("voucher.get_by_seller_fallback", { sellerId, error: (err as Error).message });
    }
  } else {
    assertMockAllowed("getVouchersBySeller:no_pool");
  }

  return mockVouchers.filter((v) => v.sellerId === sellerId);
}

export async function getAllVouchers(): Promise<VoucherData[]> {
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT id, code, seller_id, type, value, min_subtotal, max_discount,
                starts_at, ends_at, usage_limit, per_user_limit, used_count, active, created_at
         FROM public.vouchers
         ORDER BY created_at DESC`,
      );
      return res.rows.map((r) => ({
        id: r.id,
        code: r.code,
        sellerId: r.seller_id ?? null,
        type: r.type as VoucherType,
        value: Number(r.value),
        minSubtotal: Number(r.min_subtotal),
        maxDiscount: r.max_discount !== null ? Number(r.max_discount) : null,
        startsAt: new Date(r.starts_at).toISOString(),
        endsAt: new Date(r.ends_at).toISOString(),
        usageLimit: r.usage_limit !== null ? Number(r.usage_limit) : null,
        perUserLimit: Number(r.per_user_limit),
        usedCount: Number(r.used_count),
        active: Boolean(r.active),
        createdAt: new Date(r.created_at).toISOString(),
      }));
    } catch (err) {
      assertMockAllowed("getAllVouchers");
      logger.warn("voucher.get_all_fallback", { error: (err as Error).message });
    }
  } else {
    assertMockAllowed("getAllVouchers:no_pool");
  }

  return [...mockVouchers];
}

export async function toggleVoucherActive(id: string, active: boolean): Promise<boolean> {
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `UPDATE public.vouchers SET active = $1 WHERE id = $2`,
        [active, id],
      );
      return (res.rowCount ?? 0) > 0;
    } catch (err) {
      logger.error("voucher.toggle_active_failed", err, { id, active });
      return false;
    }
  }

  const v = mockVouchers.find((item) => item.id === id);
  if (v) {
    v.active = active;
    return true;
  }
  return false;
}
