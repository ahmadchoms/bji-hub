import { logger } from "@/lib/logger";
import { Pool } from "pg";
import { randomBytes } from "crypto";
import { Order, OrderItem, OrderStatus } from "@/types";
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
export const mockOrders: Order[] = [];

export function generateOrderNumber(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const rand = randomBytes(4).toString("hex").toUpperCase();
  return `ORD-${yyyy}${mm}${dd}-${rand}`;
}

export async function createOrder(data: {
  orderNumber?: string;
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
  midtransOrderId?: string | null;
  paymentProvider?: string;
  notes?: string | null;
  idempotencyKey?: string | null;
  accessToken?: string | null;
  items?: OrderItem[];
}): Promise<Order> {
  const pool = getPool();
  const id = `ord-${Date.now()}-${randomBytes(3).toString("hex")}`;
  const now = new Date().toISOString();
  const orderNumber = data.orderNumber || generateOrderNumber();
  const midtransOrderId = data.midtransOrderId || orderNumber;
  const accessToken = data.accessToken || randomBytes(24).toString("base64url");
  const itemsToReserve = data.items && data.items.length > 0
    ? data.items.map((it) => ({ listingId: it.listingId, quantity: it.quantity }))
    : data.listingId
      ? [{ listingId: data.listingId, quantity: data.quantity || 1 }]
      : [];

  const newOrder: Order = {
    id,
    orderNumber,
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
    midtransOrderId,
    paymentProvider: data.paymentProvider ?? "midtrans",
    notes: data.notes ?? null,
    accessToken,
    idempotencyKey: data.idempotencyKey ?? null,
    items: data.items,
    createdAt: now,
    updatedAt: now,
  };

  if (pool) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const insertRes = await client.query(
        `INSERT INTO public.orders (
          id, order_number, buyer_id, buyer_name, buyer_email, buyer_phone,
          buyer_address, buyer_city, seller_id, listing_id, quantity, item_price,
          subtotal, shipping_cost, service_fee, total_amount, shipping_courier,
          status, snap_token, midtrans_order_id, notes, access_token, idempotency_key, payment_provider, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
        )
        ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL
        DO NOTHING
        RETURNING id`,
        [
          id,
          orderNumber,
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
          midtransOrderId,
          data.notes ?? null,
          accessToken,
          data.idempotencyKey ?? null,
          data.paymentProvider ?? "midtrans",
          now,
          now,
        ],
      );

      if (insertRes.rowCount === 0) {
        await client.query("ROLLBACK");
        const existing = data.idempotencyKey
          ? await getOrderById(data.idempotencyKey)
          : null;
        if (existing) return existing;
        throw new Error("Pesanan duplikat tidak dapat dipulihkan");
      }

      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          const itemId = `item-${Date.now()}-${randomBytes(3).toString("hex")}`;
          await client.query(
            `INSERT INTO public.order_items (
              id, order_id, listing_id, title, price, quantity, unit, grind_size, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              itemId,
              id,
              item.listingId,
              item.title || "Produk",
              item.unitPrice,
              item.quantity,
              item.unit || "250g",
              item.grindSize ?? null,
              now,
            ],
          );
        }
      }

      // Reserve stock atomically for each ordered listing (B7)
      for (const item of itemsToReserve) {
        const stockRes = await client.query(
          `UPDATE public.listings
           SET stock = stock - $1,
               status = CASE WHEN stock - $1 <= 0 THEN 'archived' ELSE status END
           WHERE id = $2 AND stock >= $1
           RETURNING stock, title`,
          [item.quantity, item.listingId],
        );
        if (stockRes.rowCount === 0) {
          throw new Error("Stok produk tidak mencukupi untuk memenuhi pesanan ini");
        }
      }

      await client.query("COMMIT");
      const saved = await getOrderById(id);
      return saved || newOrder;
    } catch (e: unknown) {
      await client.query("ROLLBACK");
      logger.error("order.insert_failed", e);
      if (e instanceof Error && e.message.includes("Stok produk tidak mencukupi")) {
        throw e;
      }
      throw new Error("Gagal menyimpan pesanan");
    } finally {
      client.release();
    }
  }

  if (data.idempotencyKey) {
    const existingByIdem = mockOrders.find((o) => o.idempotencyKey === data.idempotencyKey);
    if (existingByIdem) return existingByIdem;
  }

  // Check stock sufficiency first (B7)
  for (const item of itemsToReserve) {
    const listing = mockListings.find((l) => l.id === item.listingId);
    if (listing && typeof listing.stock === "number") {
      if (listing.stock < item.quantity) {
        throw new Error("Stok produk tidak mencukupi untuk memenuhi pesanan ini");
      }
    }
  }

  // Atomically decrement / reserve stock (B7)
  for (const item of itemsToReserve) {
    const listing = mockListings.find((l) => l.id === item.listingId);
    if (listing && typeof listing.stock === "number") {
      listing.stock = Math.max(0, listing.stock - item.quantity);
      if (listing.stock <= 0) {
        listing.status = "archived";
      }
    }
  }

  mockOrders.unshift(newOrder);
  return newOrder;
}

export async function updateOrderSnapToken(
  orderId: string,
  snapToken: string,
): Promise<boolean> {
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `UPDATE public.orders SET snap_token = $1, updated_at = NOW() WHERE id = $2 OR order_number = $2`,
        [snapToken, orderId],
      );
      return (res.rowCount ?? 0) > 0;
    } catch (err) {
      logger.error("order.update_snap_token_failed", err, { orderId });
      return false;
    }
  }

  const existing = mockOrders.find((o) => o.id === orderId || o.orderNumber === orderId);
  if (existing) {
    existing.snapToken = snapToken;
    return true;
  }
  return false;
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
         WHERE o.id = $1 OR o.order_number = $1 OR o.midtrans_order_id = $1 OR o.idempotency_key = $1
         LIMIT 1`,
        [idOrNumber],
      );
      if (res.rows.length > 0) {
        const row = res.rows[0];
        let items: OrderItem[] | undefined;
        try {
          const itemsRes = await pool.query(
            `SELECT * FROM public.order_items WHERE order_id = $1`,
            [row.id],
          );
          if (itemsRes.rows.length > 0) {
            items = itemsRes.rows.map((ir) => ({
              id: ir.id,
              orderId: ir.order_id,
              listingId: ir.listing_id,
              title: ir.title,
              unitPrice: Number(ir.price),
              quantity: Number(ir.quantity),
              unit: ir.unit,
              grindSize: ir.grind_size,
            }));
          }
        } catch {
          // ignore: order_items table might not exist yet in legacy DB schema
        }

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
          paymentProvider: row.payment_provider ?? "midtrans",
          notes: row.notes,
          accessToken: row.access_token ?? null,
          idempotencyKey: row.idempotency_key ?? null,
          items,
          disputeReason: row.dispute_reason ?? null,
          disputeEvidenceUrl: row.dispute_evidence_url ?? null,
          paidAt: row.paid_at ? new Date(row.paid_at).toISOString() : null,
          shippedAt: row.shipped_at ? new Date(row.shipped_at).toISOString() : null,
          completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      }
    } catch {
      // ignore: fallback to mock store in dev when DB query fails
      logger.warn("order.db_query_fallback");
      // Fall through
    }
  }

  return (
    mockOrders.find(
      (o) =>
        o.id === idOrNumber ||
        o.orderNumber === idOrNumber ||
        o.midtransOrderId === idOrNumber ||
        o.idempotencyKey === idOrNumber,
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
        paymentProvider: row.payment_provider ?? "midtrans",
        notes: row.notes,
        disputeReason: row.dispute_reason ?? null,
        disputeEvidenceUrl: row.dispute_evidence_url ?? null,
        paidAt: row.paid_at ? new Date(row.paid_at).toISOString() : null,
        shippedAt: row.shipped_at ? new Date(row.shipped_at).toISOString() : null,
        completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch {
      // ignore: fallback to mock store in dev when DB query fails
      logger.warn("order.db_query_fallback");
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
        paymentProvider: row.payment_provider ?? "midtrans",
        notes: row.notes,
        disputeReason: row.dispute_reason ?? null,
        disputeEvidenceUrl: row.dispute_evidence_url ?? null,
        paidAt: row.paid_at ? new Date(row.paid_at).toISOString() : null,
        shippedAt: row.shipped_at ? new Date(row.shipped_at).toISOString() : null,
        completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch {
      // ignore: fallback to mock store in dev when DB query fails
      logger.warn("order.db_query_fallback");
      // Fall through
    }
  }

  return [...mockOrders];
}

export async function getOrdersByBuyer(
  buyerId?: string,
  buyerEmail?: string,
): Promise<Order[]> {
  if (buyerId && buyerId.includes("@") && !buyerEmail) {
    buyerEmail = buyerId;
    buyerId = undefined;
  }
  if (!buyerId && !buyerEmail) return [];
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT o.*, l.title as listing_title, l.slug as listing_slug, s."businessName" as seller_name
         FROM public.orders o
         LEFT JOIN public.listings l ON o.listing_id = l.id
         LEFT JOIN public.seller_profiles s ON o.seller_id = s.id
         WHERE ($1::text IS NOT NULL AND o.buyer_id = $1)
            OR ($2::text IS NOT NULL AND LOWER(o.buyer_email) = LOWER($2))
         ORDER BY o.created_at DESC`,
        [buyerId || null, buyerEmail || null],
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
        paymentProvider: row.payment_provider ?? "midtrans",
        notes: row.notes,
        disputeReason: row.dispute_reason ?? null,
        disputeEvidenceUrl: row.dispute_evidence_url ?? null,
        paidAt: row.paid_at ? new Date(row.paid_at).toISOString() : null,
        shippedAt: row.shipped_at ? new Date(row.shipped_at).toISOString() : null,
        completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch {
      // ignore: fallback to mock store in dev when DB query fails
      logger.warn("order.db_query_fallback");
      // Fall through
    }
  }

  return mockOrders.filter((o) => {
    if (buyerId && o.buyerId === buyerId) return true;
    if (buyerEmail && o.buyerEmail?.toLowerCase() === buyerEmail.toLowerCase()) return true;
    return false;
  });
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
      // ignore: fallback to mock store in dev when DB query fails
      logger.warn("order.db_query_fallback");
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
             status = CASE WHEN status = 'archived' AND stock = 0 THEN 'active' ELSE status END
         WHERE id = $2
         RETURNING stock`,
        [quantity, listingId],
      );
      if (res && res.rows && res.rows.length > 0) {
        return { success: true, newStock: Number(res.rows[0].stock) };
      }
    } catch {
      // ignore: fallback to mock store in dev when DB query fails
      logger.warn("order.db_query_fallback");
      // Postgres fallback
    }
  }

  const listing = mockListings.find((l) => l.id === listingId);
  if (listing) {
    const current = listing.stock ?? 0;
    listing.stock = current + quantity;
    if (listing.status === "archived" && current === 0) {
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
const RESTOCK_ON_CANCEL_FROM: OrderStatus[] = ["pending_payment", "paid", "disputed"];

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
             dispute_evidence_url = COALESCE($5, dispute_evidence_url),
             paid_at = CASE WHEN $1 = 'paid' AND paid_at IS NULL THEN $2::timestamptz ELSE paid_at END,
             shipped_at = CASE WHEN $1 = 'shipped' AND shipped_at IS NULL THEN $2::timestamptz ELSE shipped_at END,
             completed_at = CASE WHEN $1 = 'completed' AND completed_at IS NULL THEN $2::timestamptz ELSE completed_at END
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
            `SELECT stock, title FROM public.listings WHERE id = $1 AND stock IS NOT NULL`,
            [item.listingId],
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
                 status = CASE WHEN status = 'archived' AND stock = 0 THEN 'active' ELSE status END
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
                }).catch((e) => { logger.warn("order.low_stock_email_failed", e); });
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
  if (to === "paid" && !existing.paidAt) {
    existing.paidAt = now;
  } else if (to === "shipped" && !existing.shippedAt) {
    existing.shippedAt = now;
  } else if (to === "completed" && !existing.completedAt) {
    existing.completedAt = now;
  }

  if (to === "paid") {
    const listing = mockListings.find((l) => l.id === existing.listingId);
    if (listing && typeof listing.stock === "number" && listing.stock <= 5) {
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
  } else if (to === "canceled" && RESTOCK_ON_CANCEL_FROM.includes(prevStatus)) {
    const listing = mockListings.find((l) => l.id === existing.listingId);
    if (listing && typeof listing.stock === "number") {
      const wasZero = listing.stock === 0;
      listing.stock = listing.stock + (existing.quantity || 1);
      if (listing.status === "archived" && wasZero) listing.status = "active";
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

/**
 * Atomically transitions an order to 'canceled', restores stock,
 * and inserts a pending refund record within a single database transaction (M1).
 * If either fails, the entire transaction is rolled back.
 */
export async function cancelOrderWithRefund(
  orderId: string,
  options: {
    reason: string;
    createdBy?: string;
  },
): Promise<{
  applied: boolean;
  order: Order | null;
  refundRecord: import("@/lib/data/refunds").RefundRecord | null;
  error?: string;
}> {
  const pool = getPool();
  const now = new Date().toISOString();

  if (pool) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Lock the order row
      const selectRes = await client.query(
        `SELECT id, status, total_amount, listing_id, quantity, seller_id
         FROM public.orders
         WHERE id = $1 OR order_number = $1 OR midtrans_order_id = $1
         FOR UPDATE`,
        [orderId],
      );

      if (selectRes.rowCount === 0) {
        await client.query("ROLLBACK");
        return { applied: false, order: null, refundRecord: null, error: "Pesanan tidak ditemukan" };
      }

      const row = selectRes.rows[0];
      const currentStatus = row.status as OrderStatus;
      const internalOrderId = row.id;

      // Only orders in 'paid' or 'disputed' can be canceled with refund
      if (currentStatus !== "paid" && currentStatus !== "disputed") {
        await client.query("ROLLBACK");
        const existingOrder = await getOrderById(internalOrderId);
        return {
          applied: false,
          order: existingOrder,
          refundRecord: null,
          error: `Pesanan berstatus '${currentStatus}' tidak dapat dibatalkan dengan pengembalian dana`,
        };
      }

      // 2. Transition order to canceled
      await client.query(
        `UPDATE public.orders
         SET status = 'canceled',
             updated_at = $1
         WHERE id = $2`,
        [now, internalOrderId],
      );

      // 3. Restock inventory
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

      for (const item of itemsToUpdate) {
        await client.query(
          `UPDATE public.listings
           SET stock = stock + $1,
               status = CASE WHEN status = 'archived' AND stock = 0 THEN 'active' ELSE status END
           WHERE id = $2 AND stock IS NOT NULL`,
          [item.quantity, item.listingId],
        );
      }

      // 4. Create refund record atomically
      const refundId = `ref-${internalOrderId}`;
      const refundAmount = Number(row.total_amount);
      const refundRes = await client.query(
        `INSERT INTO public.refunds (id, order_id, amount, reason, status, created_by, attempts, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'pending', $5, 0, $6, $6)
         ON CONFLICT (order_id) DO UPDATE SET updated_at = $6
         RETURNING id, order_id as "orderId", amount, reason, status, provider_ref as "providerRef",
                   created_by as "createdBy", attempts, failure_reason as "failureReason",
                   resolved_by as "resolvedBy", created_at as "createdAt", updated_at as "updatedAt"`,
        [refundId, internalOrderId, refundAmount, options.reason, options.createdBy ?? null, now],
      );

      await client.query("COMMIT");

      const updated = await getOrderById(internalOrderId);
      const refundRecord = refundRes.rows[0]
        ? {
            ...refundRes.rows[0],
            amount: Number(refundRes.rows[0].amount),
            createdAt: new Date(refundRes.rows[0].createdAt).toISOString(),
            updatedAt: new Date(refundRes.rows[0].updatedAt).toISOString(),
          }
        : null;

      return { applied: true, order: updated, refundRecord };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  // Mock Mode
  const existing = mockOrders.find(
    (o) => o.id === orderId || o.orderNumber === orderId || o.midtransOrderId === orderId,
  );
  if (!existing) {
    return { applied: false, order: null, refundRecord: null, error: "Pesanan tidak ditemukan" };
  }
  if (existing.status !== "paid" && existing.status !== "disputed") {
    return {
      applied: false,
      order: existing,
      refundRecord: null,
      error: `Pesanan berstatus '${existing.status}' tidak dapat dibatalkan dengan pengembalian dana`,
    };
  }

  existing.status = "canceled";
  existing.updatedAt = now;

  const { mockListings } = await import("@/lib/mock/data");
  const listing = mockListings.find((l) => l.id === existing.listingId);
  if (listing && typeof listing.stock === "number") {
    const wasZero = listing.stock === 0;
    listing.stock += existing.quantity || 1;
    if (listing.status === "archived" && wasZero) listing.status = "active";
  }

  const { mockRefunds } = await import("@/lib/data/refunds");
  let refundRecord = mockRefunds.find((r) => r.orderId === existing.id);
  if (!refundRecord) {
    refundRecord = {
      id: `ref-${existing.id}`,
      orderId: existing.id,
      amount: existing.totalAmount,
      reason: options.reason,
      status: "pending",
      providerRef: null,
      createdBy: options.createdBy ?? null,
      attempts: 0,
      failureReason: null,
      resolvedBy: null,
      createdAt: now,
      updatedAt: now,
    };
    mockRefunds.unshift(refundRecord);
  }

  return { applied: true, order: existing, refundRecord };
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
  hoursThreshold = 1.25,
): Promise<{ canceledCount: number; orderIds: string[] }> {
  const pool = getPool();
  const now = new Date();
  const thresholdMs = hoursThreshold * 60 * 60 * 1000;
  const cutoffDate = new Date(now.getTime() - thresholdMs).toISOString();

  const canceledIds: string[] = [];

  if (pool) {
    try {
      const res = await pool.query(
        `SELECT id FROM public.orders
         WHERE status = 'pending_payment' AND created_at <= $1`,
        [cutoffDate],
      );
      for (const r of res.rows) {
        try {
          const transitionRes = await transitionOrderStatus(r.id, "canceled");
          if (transitionRes.applied) {
            canceledIds.push(r.id);
            getOrderById(r.id).then((ord) => {
              if (ord && ord.buyerId) {
                import("@/lib/data/notifications").then(({ createNotification }) => {
                  createNotification({
                    userId: ord.buyerId!,
                    title: "Batas Waktu Pembayaran Kedaluwarsa",
                    message: `Pesanan ${ord.orderNumber} dibatalkan otomatis karena melewati batas waktu pembayaran.`,
                    type: "order_status",
                    link: "/orders",
                  }).catch(() => {});
                });
              }
            }).catch(() => {});
          }
        } catch (err) {
          logger.error("order.auto_cancel_single_failed", { orderId: r.id, error: String(err) });
        }
      }
      return { canceledCount: canceledIds.length, orderIds: canceledIds };
    } catch (e) {
      logger.error("order.auto_cancel_failed", {
        error: e instanceof Error ? e.message : String(e),
      });
      throw e;
    }
  }

  for (const o of mockOrders) {
    if (o.status === "pending_payment") {
      const orderDate = new Date(o.createdAt).getTime();
      if (now.getTime() - orderDate >= thresholdMs) {
        try {
          const transitionRes = await transitionOrderStatus(o.id, "canceled");
          if (transitionRes.applied) {
            if (!canceledIds.includes(o.id)) canceledIds.push(o.id);
            if (o.buyerId) {
              import("@/lib/data/notifications").then(({ createNotification }) => {
                createNotification({
                  userId: o.buyerId!,
                  title: "Batas Waktu Pembayaran Kedaluwarsa",
                  message: `Pesanan ${o.orderNumber} dibatalkan otomatis karena melewati batas waktu pembayaran.`,
                  type: "order_status",
                  link: "/orders",
                }).catch(() => {});
              }).catch(() => {});
            }
          }
        } catch (err) {
          logger.error("order.auto_cancel_single_failed", { orderId: o.id, error: String(err) });
        }
      }
    }
  }

  return { canceledCount: canceledIds.length, orderIds: canceledIds };
}
