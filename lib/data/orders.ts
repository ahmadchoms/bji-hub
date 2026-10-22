import { Pool } from "pg";
import { Order, OrderStatus } from "@/types";
import { mockListings } from "@/lib/mock/data";

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

// In-memory mock storage fallback for vitest & offline local development
const mockOrders: Order[] = [];

export async function createOrder(data: {
  orderNumber: string;
  buyerId?: string | null;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerAddress: string;
  buyerCity: string;
  sellerId: string;
  listingId: string;
  quantity: number;
  itemPrice: number;
  subtotal: number;
  shippingCost: number;
  serviceFee: number;
  totalAmount: number;
  shippingCourier: string;
  snapToken?: string | null;
  midtransOrderId: string;
  notes?: string | null;
}): Promise<Order> {
  const pool = getPool();
  const id = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const newOrder: Order = {
    id,
    orderNumber: data.orderNumber,
    buyerId: data.buyerId ?? null,
    buyerName: data.buyerName,
    buyerEmail: data.buyerEmail,
    buyerPhone: data.buyerPhone,
    buyerAddress: data.buyerAddress,
    buyerCity: data.buyerCity,
    sellerId: data.sellerId,
    listingId: data.listingId,
    quantity: data.quantity,
    itemPrice: data.itemPrice,
    subtotal: data.subtotal,
    shippingCost: data.shippingCost,
    serviceFee: data.serviceFee,
    totalAmount: data.totalAmount,
    shippingCourier: data.shippingCourier,
    trackingNumber: null,
    status: "pending_payment",
    snapToken: data.snapToken ?? null,
    midtransOrderId: data.midtransOrderId,
    notes: data.notes ?? null,
    createdAt: now,
    updatedAt: now,
  };

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO public.orders (
          id, order_number, buyer_id, buyer_name, buyer_email, buyer_phone,
          buyer_address, buyer_city, seller_id, listing_id, quantity, item_price,
          subtotal, shipping_cost, service_fee, total_amount, shipping_courier,
          status, snap_token, midtrans_order_id, notes, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
        )`,
        [
          id,
          data.orderNumber,
          data.buyerId ?? null,
          data.buyerName,
          data.buyerEmail,
          data.buyerPhone,
          data.buyerAddress,
          data.buyerCity,
          data.sellerId,
          data.listingId,
          data.quantity,
          data.itemPrice,
          data.subtotal,
          data.shippingCost,
          data.serviceFee,
          data.totalAmount,
          data.shippingCourier,
          "pending_payment",
          data.snapToken ?? null,
          data.midtransOrderId,
          data.notes ?? null,
          now,
          now,
        ],
      );
    } catch (e) {
      console.error("Failed to insert order to postgres, using memory fallback:", e);
      if (process.env.NODE_ENV === "production" || process.env.DATA_SOURCE === "prisma") {
        throw new Error("Gagal menyimpan pesanan ke database");
      }
    }
  }

  mockOrders.unshift(newOrder);
  return newOrder;
}

export async function getOrderById(idOrNumber: string): Promise<Order | null> {
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT o.*, l.title as listing_title, l.slug as listing_slug, s."businessName" as seller_name
         FROM public.orders o
         LEFT JOIN public.listings l ON o.listing_id = l.id
         LEFT JOIN public.seller_profiles s ON o.seller_id = s.id
         WHERE o.id = $1 OR o.order_number = $1 OR o.midtrans_order_id = $1
         LIMIT 1`,
        [idOrNumber],
      );
      if (res.rows.length > 0) {
        const row = res.rows[0];
        return {
          id: row.id,
          orderNumber: row.order_number,
          buyerId: row.buyer_id,
          buyerName: row.buyer_name,
          buyerEmail: row.buyer_email,
          buyerPhone: row.buyer_phone,
          buyerAddress: row.buyer_address,
          buyerCity: row.buyer_city,
          sellerId: row.seller_id,
          sellerName: row.seller_name,
          listingId: row.listing_id,
          listingTitle: row.listing_title,
          listingSlug: row.listing_slug ?? null,
          quantity: row.quantity,
          itemPrice: Number(row.item_price),
          subtotal: Number(row.subtotal),
          shippingCost: Number(row.shipping_cost),
          serviceFee: Number(row.service_fee),
          totalAmount: Number(row.total_amount),
          shippingCourier: row.shipping_courier,
          trackingNumber: row.tracking_number,
          status: row.status as OrderStatus,
          snapToken: row.snap_token,
          midtransOrderId: row.midtrans_order_id,
          notes: row.notes,
          disputeReason: row.dispute_reason ?? null,
          disputeEvidenceUrl: row.dispute_evidence_url ?? null,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      }
    } catch {
      // Fall through
    }
  }

  return (
    mockOrders.find(
      (o) =>
        o.id === idOrNumber ||
        o.orderNumber === idOrNumber ||
        o.midtransOrderId === idOrNumber,
    ) ?? null
  );
}

export async function getOrdersBySeller(sellerId: string): Promise<Order[]> {
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT o.*, l.title as listing_title, l.slug as listing_slug
         FROM public.orders o
         LEFT JOIN public.listings l ON o.listing_id = l.id
         WHERE o.seller_id = $1
         ORDER BY o.created_at DESC`,
        [sellerId],
      );
      return res.rows.map((row) => ({
        id: row.id,
        orderNumber: row.order_number,
        buyerId: row.buyer_id,
        buyerName: row.buyer_name,
        buyerEmail: row.buyer_email,
        buyerPhone: row.buyer_phone,
        buyerAddress: row.buyer_address,
        buyerCity: row.buyer_city,
        sellerId: row.seller_id,
        listingId: row.listing_id,
        listingTitle: row.listing_title,
        listingSlug: row.listing_slug ?? null,
        quantity: row.quantity,
        itemPrice: Number(row.item_price),
        subtotal: Number(row.subtotal),
        shippingCost: Number(row.shipping_cost),
        serviceFee: Number(row.service_fee),
        totalAmount: Number(row.total_amount),
        shippingCourier: row.shipping_courier,
        trackingNumber: row.tracking_number,
        status: row.status as OrderStatus,
        snapToken: row.snap_token,
        midtransOrderId: row.midtrans_order_id,
        notes: row.notes,
        disputeReason: row.dispute_reason ?? null,
        disputeEvidenceUrl: row.dispute_evidence_url ?? null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch {
      // Fall through
    }
  }

  return mockOrders.filter((o) => o.sellerId === sellerId);
}

export async function getAllOrders(): Promise<Order[]> {
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT o.*, l.title as listing_title, l.slug as listing_slug, s."businessName" as seller_name
         FROM public.orders o
         LEFT JOIN public.listings l ON o.listing_id = l.id
         LEFT JOIN public.seller_profiles s ON o.seller_id = s.id
         ORDER BY o.created_at DESC`,
      );
      return res.rows.map((row) => ({
        id: row.id,
        orderNumber: row.order_number,
        buyerId: row.buyer_id,
        buyerName: row.buyer_name,
        buyerEmail: row.buyer_email,
        buyerPhone: row.buyer_phone,
        buyerAddress: row.buyer_address,
        buyerCity: row.buyer_city,
        sellerId: row.seller_id,
        sellerName: row.seller_name,
        listingId: row.listing_id,
        listingTitle: row.listing_title,
        listingSlug: row.listing_slug ?? null,
        quantity: row.quantity,
        itemPrice: Number(row.item_price),
        subtotal: Number(row.subtotal),
        shippingCost: Number(row.shipping_cost),
        serviceFee: Number(row.service_fee),
        totalAmount: Number(row.total_amount),
        shippingCourier: row.shipping_courier,
        trackingNumber: row.tracking_number,
        status: row.status as OrderStatus,
        snapToken: row.snap_token,
        midtransOrderId: row.midtrans_order_id,
        notes: row.notes,
        disputeReason: row.dispute_reason ?? null,
        disputeEvidenceUrl: row.dispute_evidence_url ?? null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch {
      // Fall through
    }
  }

  return [...mockOrders];
}

export async function getOrdersByBuyer(
  buyerIdOrEmail: string,
  emailOrIdFallback?: string | null,
): Promise<Order[]> {
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT o.*, l.title as listing_title, l.slug as listing_slug, s."businessName" as seller_name
         FROM public.orders o
         LEFT JOIN public.listings l ON o.listing_id = l.id
         LEFT JOIN public.seller_profiles s ON o.seller_id = s.id
         WHERE o.buyer_id = $1 OR o.buyer_email = $1 OR ($2::text IS NOT NULL AND (o.buyer_id = $2 OR o.buyer_email = $2))
         ORDER BY o.created_at DESC`,
        [buyerIdOrEmail, emailOrIdFallback ?? null],
      );
      return res.rows.map((row) => ({
        id: row.id,
        orderNumber: row.order_number,
        buyerId: row.buyer_id,
        buyerName: row.buyer_name,
        buyerEmail: row.buyer_email,
        buyerPhone: row.buyer_phone,
        buyerAddress: row.buyer_address,
        buyerCity: row.buyer_city,
        sellerId: row.seller_id,
        sellerName: row.seller_name,
        listingId: row.listing_id,
        listingTitle: row.listing_title,
        listingSlug: row.listing_slug ?? null,
        quantity: row.quantity,
        itemPrice: Number(row.item_price),
        subtotal: Number(row.subtotal),
        shippingCost: Number(row.shipping_cost),
        serviceFee: Number(row.service_fee),
        totalAmount: Number(row.total_amount),
        shippingCourier: row.shipping_courier,
        trackingNumber: row.tracking_number,
        status: row.status as OrderStatus,
        snapToken: row.snap_token,
        midtransOrderId: row.midtrans_order_id,
        notes: row.notes,
        disputeReason: row.dispute_reason ?? null,
        disputeEvidenceUrl: row.dispute_evidence_url ?? null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch {
      // Fall through
    }
  }

  return mockOrders.filter(
    (o) =>
      o.buyerId === buyerIdOrEmail ||
      o.buyerEmail === buyerIdOrEmail ||
      (emailOrIdFallback &&
        (o.buyerId === emailOrIdFallback || o.buyerEmail === emailOrIdFallback)),
  );
}

export async function decrementListingStock(
  listingId: string,
  quantity: number,
): Promise<{ success: boolean; remainingStock?: number }> {
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `UPDATE public.listings
         SET stock = GREATEST(0, COALESCE(stock, 100) - $1)
         WHERE id = $2
         RETURNING stock`,
        [quantity, listingId],
      );
      if (res && res.rows && res.rows.length > 0) {
        const remaining = Number(res.rows[0].stock);
        if (remaining <= 0) {
          await pool.query(
            `UPDATE public.listings SET status = 'archived' WHERE id = $1`,
            [listingId],
          );
        }
        return { success: true, remainingStock: remaining };
      }
    } catch {
      // Postgres column may not exist yet, fall through to in-memory
    }
  }

  const listing = mockListings.find((l) => l.id === listingId);
  if (listing) {
    const current = listing.stock ?? 50;
    const remaining = Math.max(0, current - quantity);
    listing.stock = remaining;
    if (remaining <= 0) {
      listing.status = "archived";
    }
    return { success: true, remainingStock: remaining };
  }
  return { success: false };
}

export async function incrementListingStock(
  listingId: string,
  quantity: number,
): Promise<{ success: boolean; newStock?: number }> {
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `UPDATE public.listings
         SET stock = COALESCE(stock, 0) + $1,
             status = 'active'
         WHERE id = $2
         RETURNING stock`,
        [quantity, listingId],
      );
      if (res && res.rows && res.rows.length > 0) {
        return { success: true, newStock: Number(res.rows[0].stock) };
      }
    } catch {
      // Postgres fallback
    }
  }

  const listing = mockListings.find((l) => l.id === listingId);
  if (listing) {
    const current = listing.stock ?? 0;
    listing.stock = current + quantity;
    if (listing.status === "archived") {
      listing.status = "active";
    }
    return { success: true, newStock: listing.stock };
  }
  return { success: false };
}

const ALLOWED_FROM: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: [],
  paid: ["pending_payment"],
  shipped: ["paid", "disputed"],
  completed: ["shipped", "disputed"],
  disputed: ["paid", "shipped"],
  canceled: ["pending_payment", "paid", "disputed"],
};
const RESTOCK_ON_CANCEL_FROM: OrderStatus[] = ["paid", "disputed"];

export interface TransitionExtra {
  trackingNumber?: string;
  disputeReason?: string;
  disputeEvidenceUrl?: string;
}

export async function transitionOrderStatus(
  orderId: string,
  to: OrderStatus,
  extra: TransitionExtra = {},
): Promise<{ applied: boolean; order: Order | null }> {
  const pool = getPool();
  const now = new Date().toISOString();

  if (pool) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Lock the order row
      const selectRes = await client.query(
        `SELECT id, status, listing_id, quantity, seller_id
         FROM public.orders
         WHERE id = $1 OR order_number = $1 OR midtrans_order_id = $1
         FOR UPDATE`,
        [orderId],
      );

      if (selectRes.rowCount === 0) {
        await client.query("ROLLBACK");
        return { applied: false, order: null };
      }

      const row = selectRes.rows[0];
      const currentStatus = row.status as OrderStatus;
      const internalOrderId = row.id;

      // Idempotent: already in destination status
      if (currentStatus === to) {
        await client.query("ROLLBACK");
        const existingOrder = await getOrderById(internalOrderId);
        return { applied: false, order: existingOrder };
      }

      // Check allowed transition
      const allowedOrigins = ALLOWED_FROM[to] || [];
      if (!allowedOrigins.includes(currentStatus)) {
        await client.query("ROLLBACK");
        const existingOrder = await getOrderById(internalOrderId);
        return { applied: false, order: existingOrder };
      }

      // 2. Update status and extra fields
      await client.query(
        `UPDATE public.orders
         SET status = $1,
             updated_at = $2,
             tracking_number = COALESCE($3, tracking_number),
             dispute_reason = COALESCE($4, dispute_reason),
             dispute_evidence_url = COALESCE($5, dispute_evidence_url)
         WHERE id = $6`,
        [
          to,
          now,
          extra.trackingNumber ?? null,
          extra.disputeReason ?? null,
          extra.disputeEvidenceUrl ?? null,
          internalOrderId,
        ],
      );

      // 3. Stock management
      const itemsRes = await client.query(
        `SELECT listing_id, quantity FROM public.order_items WHERE order_id = $1`,
        [internalOrderId],
      );
      const itemsToUpdate =
        itemsRes.rows.length > 0
          ? itemsRes.rows.map((r) => ({ listingId: r.listing_id, quantity: Number(r.quantity) }))
          : row.listing_id
            ? [{ listingId: row.listing_id, quantity: Number(row.quantity || 1) }]
            : [];

      let lowStockAlert: { sellerId: string; listingTitle: string; remainingStock: number } | null = null;

      if (to === "paid") {
        for (const item of itemsToUpdate) {
          const stockRes = await client.query(
            `UPDATE public.listings
             SET stock = GREATEST(stock - $1, 0),
                 status = CASE WHEN stock - $1 <= 0 THEN 'archived' ELSE status END
             WHERE id = $2 AND stock IS NOT NULL
             RETURNING stock, title`,
            [item.quantity, item.listingId],
          );
          if (stockRes.rows.length > 0) {
            const rem = Number(stockRes.rows[0].stock);
            if (rem <= 5) {
              lowStockAlert = {
                sellerId: row.seller_id,
                listingTitle: stockRes.rows[0].title || "Produk",
                remainingStock: rem,
              };
            }
          }
        }
      } else if (to === "canceled" && RESTOCK_ON_CANCEL_FROM.includes(currentStatus)) {
        for (const item of itemsToUpdate) {
          await client.query(
            `UPDATE public.listings
             SET stock = stock + $1,
                 status = CASE WHEN status = 'archived' THEN 'active' ELSE status END
             WHERE id = $2 AND stock IS NOT NULL`,
            [item.quantity, item.listingId],
          );
        }
      }

      await client.query("COMMIT");

      // Send low-stock alert email to the actual seller email if applicable
      if (lowStockAlert) {
        import("@/lib/data")
          .then(({ getSellerById }) => getSellerById(lowStockAlert!.sellerId))
          .then((seller) => {
            if (seller?.user?.email) {
              import("@/lib/email").then(({ sendLowStockAlertEmail }) => {
                sendLowStockAlertEmail({
                  sellerEmail: seller.user!.email,
                  sellerName: seller.businessName || "Penjual",
                  listingTitle: lowStockAlert!.listingTitle,
                  remainingStock: lowStockAlert!.remainingStock,
                  unit: "unit",
                }).catch(() => {});
              });
            }
          })
          .catch(() => {});
      }

      const updated = await getOrderById(internalOrderId);
      return { applied: true, order: updated };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  // Mock / In-Memory Mode
  const existing = mockOrders.find(
    (o) =>
      o.id === orderId ||
      o.orderNumber === orderId ||
      o.midtransOrderId === orderId,
  );
  if (!existing) {
    return { applied: false, order: null };
  }

  if (existing.status === to) {
    return { applied: false, order: existing };
  }

  const allowed = ALLOWED_FROM[to] || [];
  if (!allowed.includes(existing.status)) {
    return { applied: false, order: existing };
  }

  const prevStatus = existing.status;
  existing.status = to;
  if (extra.trackingNumber) existing.trackingNumber = extra.trackingNumber;
  if (extra.disputeReason) existing.disputeReason = extra.disputeReason;
  if (extra.disputeEvidenceUrl) existing.disputeEvidenceUrl = extra.disputeEvidenceUrl;
  existing.updatedAt = now;

  if (to === "paid") {
    const listing = mockListings.find((l) => l.id === existing.listingId);
    if (listing && typeof listing.stock === "number") {
      listing.stock = Math.max(0, listing.stock - (existing.quantity || 1));
      if (listing.stock <= 0) listing.status = "archived";
      if (listing.stock <= 5) {
        import("@/lib/email").then(({ sendLowStockAlertEmail }) => {
          sendLowStockAlertEmail({
            sellerEmail: "seller@bijihub.id",
            sellerName: existing.sellerName || "Penjual",
            listingTitle: existing.listingTitle || listing.title,
            remainingStock: listing.stock!,
            unit: listing.unit || "unit",
          }).catch(() => {});
        }).catch(() => {});
      }
    }
  } else if (to === "canceled" && RESTOCK_ON_CANCEL_FROM.includes(prevStatus)) {
    const listing = mockListings.find((l) => l.id === existing.listingId);
    if (listing && typeof listing.stock === "number") {
      listing.stock = listing.stock + (existing.quantity || 1);
      if (listing.status === "archived") listing.status = "active";
    }
  }

  return { applied: true, order: existing };
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  trackingNumber?: string,
  disputeReason?: string,
  disputeEvidenceUrl?: string,
): Promise<boolean> {
  const res = await transitionOrderStatus(orderId, status, {
    trackingNumber,
    disputeReason,
    disputeEvidenceUrl,
  });
  return res.applied;
}

export async function autoCompleteExpiredShippedOrders(
  daysThreshold = 2,
): Promise<{ completedCount: number; orderIds: string[] }> {
  const pool = getPool();
  const now = new Date();
  const thresholdMs = daysThreshold * 24 * 60 * 60 * 1000;
  const cutoffDate = new Date(now.getTime() - thresholdMs).toISOString();

  const completedIds: string[] = [];

  if (pool) {
    try {
      const res = await pool.query(
        `UPDATE public.orders
         SET status = 'completed', updated_at = NOW()
         WHERE status = 'shipped' AND updated_at <= $1
         RETURNING id`,
        [cutoffDate],
      );
      res.rows.forEach((r) => completedIds.push(r.id));
      return { completedCount: completedIds.length, orderIds: completedIds };
    } catch (e) {
      console.error("Failed to auto-complete orders in postgres:", e);
      throw e;
    }
  }

  mockOrders.forEach((o) => {
    if (o.status === "shipped") {
      const orderDate = new Date(o.updatedAt || o.createdAt).getTime();
      if (now.getTime() - orderDate >= thresholdMs) {
        o.status = "completed";
        o.updatedAt = now.toISOString();
        if (!completedIds.includes(o.id)) completedIds.push(o.id);
      }
    }
  });

  return { completedCount: completedIds.length, orderIds: completedIds };
}

export async function autoCancelExpiredPendingOrders(
  hoursThreshold = 24,
): Promise<{ canceledCount: number; orderIds: string[] }> {
  const pool = getPool();
  const now = new Date();
  const thresholdMs = hoursThreshold * 60 * 60 * 1000;
  const cutoffDate = new Date(now.getTime() - thresholdMs).toISOString();

  const canceledIds: string[] = [];

  if (pool) {
    try {
      const res = await pool.query(
        `UPDATE public.orders
         SET status = 'canceled', updated_at = NOW()
         WHERE status = 'pending_payment' AND created_at <= $1
         RETURNING id`,
        [cutoffDate],
      );
      res.rows.forEach((r) => canceledIds.push(r.id));
      return { canceledCount: canceledIds.length, orderIds: canceledIds };
    } catch (e) {
      console.error("Failed to auto-cancel expired pending orders in postgres:", e);
      throw e;
    }
  }

  mockOrders.forEach((o) => {
    if (o.status === "pending_payment") {
      const orderDate = new Date(o.createdAt).getTime();
      if (now.getTime() - orderDate >= thresholdMs) {
        o.status = "canceled";
        o.updatedAt = now.toISOString();
        if (!canceledIds.includes(o.id)) canceledIds.push(o.id);
      }
    }
  });

  return { canceledCount: canceledIds.length, orderIds: canceledIds };
}
