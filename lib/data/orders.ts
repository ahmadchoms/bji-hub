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

const VALID_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ["pending_payment", "paid", "shipped", "canceled"],
  paid: ["paid", "shipped", "canceled", "disputed", "completed"],
  shipped: ["shipped", "completed", "disputed"],
  disputed: ["disputed", "completed", "canceled", "paid", "shipped"],
  completed: ["completed"],
  canceled: ["canceled"],
};

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  trackingNumber?: string,
  disputeReason?: string,
  disputeEvidenceUrl?: string,
): Promise<boolean> {
  const currentOrder = await getOrderById(orderId);
  if (currentOrder) {
    if (
      currentOrder.status !== status &&
      !VALID_ORDER_TRANSITIONS[currentOrder.status]?.includes(status)
    ) {
      console.warn(
        `Invalid order status transition from ${currentOrder.status} to ${status} for order ${orderId}`
      );
      return false;
    }
  }

  const pool = getPool();
  const now = new Date().toISOString();

  // If status is transitioning to paid, trigger stock decrement
  if (status === "paid") {
    if (
      currentOrder &&
      currentOrder.status !== "paid" &&
      currentOrder.listingId &&
      currentOrder.quantity
    ) {
      const dec = await decrementListingStock(
        currentOrder.listingId,
        currentOrder.quantity,
      );
      if (dec.success && typeof dec.remainingStock === "number" && dec.remainingStock <= 5) {
        import("@/lib/email")
          .then(({ sendLowStockAlertEmail }) => {
            sendLowStockAlertEmail({
              sellerEmail: "roastery@bijihub.id",
              sellerName: currentOrder.sellerName || "Penjual",
              listingTitle: currentOrder.listingTitle || "Biji Kopi",
              remainingStock: dec.remainingStock!,
              unit: "unit",
            }).catch((err) =>
              console.error("Failed to send low stock notification:", err),
            );
          })
          .catch(() => {});
      }
    }
  }

  // If status is transitioning to canceled from a paid order, restore inventory
  if (status === "canceled") {
    if (
      currentOrder &&
      currentOrder.status === "paid" &&
      currentOrder.listingId &&
      currentOrder.quantity
    ) {
      await incrementListingStock(currentOrder.listingId, currentOrder.quantity);
    }
  }

  if (pool) {
    try {
      let res;
      if (trackingNumber) {
        res = await pool.query(
          `UPDATE public.orders
           SET status = $1, tracking_number = $2, updated_at = $3
           WHERE id = $4 OR order_number = $4 OR midtrans_order_id = $4`,
          [status, trackingNumber, now, orderId],
        );
      } else if (disputeReason) {
        res = await pool.query(
          `UPDATE public.orders
           SET status = $1, dispute_reason = $2, dispute_evidence_url = $3, updated_at = $4
           WHERE id = $5 OR order_number = $5 OR midtrans_order_id = $5`,
          [status, disputeReason, disputeEvidenceUrl ?? null, now, orderId],
        );
      } else {
        res = await pool.query(
          `UPDATE public.orders
           SET status = $1, updated_at = $2
           WHERE id = $3 OR order_number = $3 OR midtrans_order_id = $3`,
          [status, now, orderId],
        );
      }
      if (res && res.rowCount && res.rowCount > 0) {
        return true;
      }
    } catch {
      // Fall through
    }
  }

  const existing = mockOrders.find(
    (o) =>
      o.id === orderId ||
      o.orderNumber === orderId ||
      o.midtransOrderId === orderId,
  );
  if (existing) {
    existing.status = status;
    if (trackingNumber) existing.trackingNumber = trackingNumber;
    if (disputeReason) existing.disputeReason = disputeReason;
    if (disputeEvidenceUrl) existing.disputeEvidenceUrl = disputeEvidenceUrl;
    existing.updatedAt = now;
    return true;
  }
  return false;
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
    } catch (e) {
      console.error("Failed to auto-complete orders in postgres:", e);
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
    } catch (e) {
      console.error("Failed to auto-cancel expired pending orders in postgres:", e);
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
