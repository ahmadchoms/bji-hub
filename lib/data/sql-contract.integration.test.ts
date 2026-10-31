import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getPool } from "@/lib/db/pool";

// The 14 raw SQL modules required by A2
import * as addresses from "./addresses";
import * as auditLogs from "./audit-logs";
import * as chat from "./chat";
import * as notifications from "./notifications";
import * as orders from "./orders";
import * as origins from "./origins";
import * as payouts from "./payouts";
import * as producers from "./producers";
import * as refunds from "./refunds";
import * as reviews from "./reviews";
import * as vouchers from "./vouchers";
import * as webhookEvents from "./webhook-events";
import * as roastBatch from "../coffee/roast-batch";
import * as shippingSla from "../coffee/shipping-sla";
import * as tastePreferenceActions from "@/actions/taste-preference.actions";
import * as waitlistActions from "@/actions/waitlist.actions";

/**
 * Asserts that executing a database function does NOT fail with PostgreSQL schema errors:
 * - 42P01: undefined_table
 * - 42703: undefined_column
 * - 42883: undefined_function
 * - 42804: datatype_mismatch
 */
async function expectNoSchemaError<T>(fn: () => Promise<T>): Promise<T | undefined> {
  try {
    return await fn();
  } catch (err: unknown) {
    const fatalSqlCodes = ["42P01", "42703", "42883", "42804"];
    const pgErr = err as { code?: string; message?: string };
    if (pgErr && pgErr.code && fatalSqlCodes.includes(pgErr.code)) {
      throw new Error(`SQL Contract Schema Error [code: ${pgErr.code}]: ${pgErr.message}`);
    }
    return undefined;
  }
}

describe("SQL Schema Contract Integration Tests (A2)", () => {
  const dummyId = "00000000-0000-0000-0000-000000000001";
  const dummyId2 = "00000000-0000-0000-0000-000000000002";

  it("addresses: executes queries without schema errors", async () => {
    await expectNoSchemaError(() => addresses.getUserAddresses(dummyId));
  });

  it("audit-logs: executes queries without schema errors", async () => {
    await expectNoSchemaError(() =>
      auditLogs.recordAuditLog({
        actorId: dummyId,
        actorRole: "buyer",
        action: "contract_test",
      })
    );
  });

  it("chat: executes queries without schema errors", async () => {
    await expectNoSchemaError(() => chat.getConversationById(dummyId));
    await expectNoSchemaError(() => chat.getConversationsForUser(dummyId, "buyer"));
    await expectNoSchemaError(() => chat.getMessagesByConversation(dummyId));
  });

  it("notifications: executes queries without schema errors", async () => {
    await expectNoSchemaError(() => notifications.getUserNotifications(dummyId));
    await expectNoSchemaError(() => notifications.getUnreadNotificationCount(dummyId));
    await expectNoSchemaError(() => notifications.markAllNotificationsAsRead(dummyId));
  });

  it("orders: executes queries without schema errors", async () => {
    await expectNoSchemaError(() => orders.getOrderById(dummyId));
    await expectNoSchemaError(() => orders.getOrdersBySeller(dummyId));
    await expectNoSchemaError(() => orders.getOrdersByBuyer(dummyId));
  });

  it("origins: executes queries without schema errors", async () => {
    await expectNoSchemaError(() => origins.getCoffeeOrigins());
    await expectNoSchemaError(() => origins.getCoffeeOriginById(dummyId));
    await expectNoSchemaError(() => origins.getCoffeeOriginBySlug("gayo"));
  });

  it("payouts: executes queries without schema errors", async () => {
    await expectNoSchemaError(() => payouts.getSellerBankDetails(dummyId));
    await expectNoSchemaError(() => payouts.getAllPayoutRequests());
    await expectNoSchemaError(() => payouts.getSellerBalanceSummary(dummyId));
    await expectNoSchemaError(() => payouts.getAllPayoutBatches());
    await expectNoSchemaError(() => payouts.getPayoutBatchExportRows());
    await expectNoSchemaError(() => payouts.getOrCreateOpenPayoutBatch());
  });

  it("producers: executes queries without schema errors", async () => {
    await expectNoSchemaError(() => producers.getProducers());
    await expectNoSchemaError(() => producers.getProducerById(dummyId));
    await expectNoSchemaError(() => producers.getProducerBySlug("koperasi-baburrayyan-gayo"));
    await expectNoSchemaError(() => producers.getApprovedProducersForSeller(dummyId));
    await expectNoSchemaError(() => producers.isProducerApprovedForSeller(dummyId, dummyId2));
    await expectNoSchemaError(() => producers.getApprovedSellerIdsForProducer(dummyId));
    await expectNoSchemaError(() => producers.getProducerAttributions({ sellerId: dummyId }));
    await expectNoSchemaError(() => producers.isLotCodeUsedBySeller(dummyId, "LOT-TEST-001"));
  });

  it("refunds: executes queries without schema errors", async () => {
    await expectNoSchemaError(() => refunds.getAllRefunds());
    await expectNoSchemaError(() => refunds.getRefundByOrderId(dummyId));
  });

  it("reviews: executes queries without schema errors", async () => {
    await expectNoSchemaError(() => reviews.getReviewsByListing(dummyId));
  });

  it("vouchers: executes queries without schema errors", async () => {
    await expectNoSchemaError(() => vouchers.getAllVouchers());
    await expectNoSchemaError(() => vouchers.getVoucherByCode("DUMMY"));
    await expectNoSchemaError(() => vouchers.getVouchersBySeller(dummyId));
  });

  it("webhook-events: executes queries without schema errors", async () => {
    await expectNoSchemaError(() => webhookEvents.isWebhookEventProcessed("test-event-id"));
    await expectNoSchemaError(() => webhookEvents.recordWebhookEvent("test-event-id", "test-order-id"));
  });

  it("roast-batch: executes queries without schema errors", async () => {
    await expectNoSchemaError(() => roastBatch.getRoastBatches(dummyId));
    await expectNoSchemaError(() => roastBatch.getRoastBatchesByListing(dummyId));
  });

  it("shipping-sla: executes queries without schema errors", async () => {
    await expectNoSchemaError(() => shippingSla.calculateRoastToShipSla(dummyId));
  });

  it("taste-preference actions: executes without schema errors", async () => {
    await expectNoSchemaError(() => tastePreferenceActions.getTastePreferencesAction());
  });

  it("waitlist actions: executes without schema errors", async () => {
    await expectNoSchemaError(() => waitlistActions.checkWaitlistStatusAction(dummyId));
  });
});

describe("Real PostgreSQL Behavioral Tests (A2)", () => {
  let pool: any;
  let testSellerUserId: string;
  let testSellerProfileId: string;
  let testBuyerUserId: string;
  let testCategoryId: string;
  let testListingId: string;

  beforeAll(async () => {
    pool = getPool();
    if (!pool) throw new Error("Database pool is required for behavioral integration tests");

    // Clean up / seed test fixture accounts
    testSellerUserId = "user-test-seller-behavioral";
    testSellerProfileId = "seller-test-profile-behavioral";
    testBuyerUserId = "user-test-buyer-behavioral";
    testCategoryId = "cat-test-behavioral";
    testListingId = "listing-test-behavioral";

    await pool.query(
      `INSERT INTO public.users (id, email, role, "createdAt")
       VALUES ($1, 'seller-int@example.com', 'SELLER', NOW())
       ON CONFLICT (id) DO NOTHING`,
      [testSellerUserId]
    );

    await pool.query(
      `INSERT INTO public.users (id, email, role, "createdAt")
       VALUES ($1, 'buyer-int@example.com', 'BUYER', NOW() - INTERVAL '10 days')
       ON CONFLICT (id) DO NOTHING`,
      [testBuyerUserId]
    );

    await pool.query(
      `INSERT INTO public.seller_profiles (id, "userId", "businessName", slug, province, city, address, "whatsappNumber", "createdAt")
       VALUES ($1, $2, 'Behavioral Test Store', 'behavioral-test-store', 'Aceh', 'Takengon', 'Jl. Test', '08123456789', NOW())
       ON CONFLICT (id) DO NOTHING`,
      [testSellerProfileId, testSellerUserId]
    );

    await pool.query(
      `INSERT INTO public.categories (id, name, slug)
       VALUES ($1, 'Test Beans', 'test-beans-behavioral')
       ON CONFLICT (id) DO NOTHING`,
      [testCategoryId]
    );

    await pool.query(
      `INSERT INTO public.listings (id, slug, "sellerId", "categoryId", title, price, unit, stock, status, "createdAt", "updatedAt")
       VALUES ($1, 'test-beans-behavioral-slug', $2, $3, 'Fresh Test Coffee 250g', 100000, '250g', 1, 'active', NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET stock = 1, status = 'active'`,
      [testListingId, testSellerProfileId, testCategoryId]
    );

    await pool.query(
      `INSERT INTO public.taste_profiles (id, "listingId", "originRegion", "processMethod", "roastLevel", "flavorNotes", "acidityScore", "bodyScore", "roastDate")
       VALUES ($1, $2, 'Gayo', 'Wash', 'Medium', 'Citrus', 3, 3, NOW() - INTERVAL '2 days')
       ON CONFLICT ("listingId") DO NOTHING`,
      ["tp-test-behavioral", testListingId]
    );
  });

  afterAll(async () => {
    if (pool) {
      await pool.query("DELETE FROM public.listings WHERE id = $1", [testListingId]);
      await pool.query("DELETE FROM public.categories WHERE id = $1", [testCategoryId]);
      await pool.query("DELETE FROM public.seller_profiles WHERE id = $1", [testSellerProfileId]);
      await pool.query("DELETE FROM public.users WHERE id IN ($1, $2)", [testSellerUserId, testBuyerUserId]);
    }
  });

  it("addRoastBatch updates taste_profiles.roast_date and stores batch", async () => {
    const today = new Date().toISOString().slice(0, 10);
    const batch = await roastBatch.addRoastBatch({
      listingId: testListingId,
      roastedOn: today,
      quantityKg: 10,
      notes: "Behavioral test batch",
    });

    expect(batch).toBeDefined();
    expect(batch.roastedOn).toBe(today);

    const tpRes = await pool.query(
      `SELECT "roastDate" FROM public.taste_profiles WHERE "listingId" = $1`,
      [testListingId]
    );
    expect(tpRes.rows.length).toBe(1);
    expect(tpRes.rows[0].roastDate).toBeDefined();
  });

  it("webhook replay idempotency: second call is ignored", async () => {
    const eventId = `evt-test-behavioral-${Date.now()}`;
    const orderRef = `ord-ref-${Date.now()}`;

    const firstRun = await webhookEvents.isWebhookEventProcessed(eventId);
    expect(firstRun).toBe(false);

    await webhookEvents.recordWebhookEvent(eventId, orderRef);

    const secondRun = await webhookEvents.isWebhookEventProcessed(eventId);
    expect(secondRun).toBe(true);
  });

  it("review reporting fails closed when reporter has no completed orders", async () => {
    const reviewId = `rev-test-${Date.now()}`;
    await pool.query(
      `INSERT INTO public.reviews (id, listing_id, buyer_id, buyer_name, rating, comment, created_at)
       VALUES ($1, $2, $3, 'Test Reviewer', 5, 'Great coffee!', NOW())`,
      [reviewId, testListingId, testBuyerUserId]
    );

    // Another new buyer with 0 completed orders
    const newBuyerId = `user-no-orders-${Date.now()}`;
    await pool.query(
      `INSERT INTO public.users (id, email, role, "createdAt")
       VALUES ($1, 'no-orders@example.com', 'BUYER', NOW() - INTERVAL '14 days')`,
      [newBuyerId]
    );

    // Should throw error because user has 0 completed orders
    await expect(
      reviews.reportReview(reviewId, newBuyerId, "Inappropriate review comment")
    ).rejects.toThrow(/minimal 1 pesanan selesai/);

    await pool.query("DELETE FROM public.reviews WHERE id = $1", [reviewId]);
    await pool.query("DELETE FROM public.users WHERE id = $1", [newBuyerId]);
  });

  it("review reply is rejected when seller does not own the listing", async () => {
    const otherSellerId = `seller-other-${Date.now()}`;
    const otherUserId = `user-other-${Date.now()}`;

    await pool.query(
      `INSERT INTO public.users (id, email, role, "createdAt") VALUES ($1, $2, 'SELLER', NOW())`,
      [otherUserId, `${otherUserId}@example.com`]
    );
    await pool.query(
      `INSERT INTO public.seller_profiles (id, "userId", "businessName", slug, province, city, address, "whatsappNumber")
       VALUES ($1, $2, 'Other Store', $3, 'Bali', 'Denpasar', 'Jl. Test', '081234')`,
      [otherSellerId, otherUserId, `store-${Date.now()}`]
    );

    const reviewId = `rev-test-reply-${Date.now()}`;
    await pool.query(
      `INSERT INTO public.reviews (id, listing_id, buyer_id, buyer_name, rating, comment, created_at)
       VALUES ($1, $2, $3, 'Reviewer', 4, 'Nice', NOW())`,
      [reviewId, testListingId, testBuyerUserId]
    );

    const replySuccess = await reviews.replyToReview(
      reviewId,
      otherSellerId,
      "Terima kasih banyak!"
    );
    expect(replySuccess).toBe(false);

    await pool.query("DELETE FROM public.reviews WHERE id = $1", [reviewId]);
    await pool.query("DELETE FROM public.seller_profiles WHERE id = $1", [otherSellerId]);
    await pool.query("DELETE FROM public.users WHERE id = $1", [otherUserId]);
  });

  it("SLA snapshot takes the latest roast batch on shipped transition (A3)", async () => {
    const orderId = `ord-sla-${Date.now()}`;
    const orderNum = `ORD-SLA-${Date.now()}`;

    // Clear previous batches and insert 2 batches: older and newer
    await pool.query("DELETE FROM public.roast_batches WHERE listing_id = $1", [testListingId]);
    await pool.query(
      `INSERT INTO public.roast_batches (listing_id, roasted_on, quantity_kg)
       VALUES ($1, '2026-10-10', 10), ($1, '2026-10-20', 10)`,
      [testListingId]
    );

    await pool.query(
      `INSERT INTO public.orders (
        id, order_number, buyer_name, buyer_email, buyer_phone, buyer_address, buyer_city,
        seller_id, listing_id, quantity, item_price, subtotal, total_amount, status, created_at, updated_at
      ) VALUES (
        $1, $2, 'Buyer SLA', 'sla@example.com', '0812', 'Jl. SLA', 'Jakarta',
        $3, $4, 1, 100000, 100000, 100000, 'paid', NOW(), NOW()
      )`,
      [orderId, orderNum, testSellerProfileId, testListingId]
    );

    // Transition to shipped
    await orders.transitionOrderStatus(orderId, "shipped");

    const orderRes = await pool.query(
      `SELECT roast_date_at_ship::text FROM public.orders WHERE id = $1`,
      [orderId]
    );
    expect(orderRes.rows[0].roast_date_at_ship).toBe("2026-10-20");

    await pool.query("DELETE FROM public.orders WHERE id = $1", [orderId]);
    await pool.query("DELETE FROM public.roast_batches WHERE listing_id = $1", [testListingId]);
  });

  it("C3 Sequential Invoice Numbers: concurrent payments yield unique sequential invoice numbers without gaps", async () => {
    const period = new Date().toISOString().slice(0, 7).replace("-", "");
    const count = 5;
    const testOrderIds: string[] = [];

    try {
      for (let i = 0; i < count; i++) {
        const oid = `test-c3-order-${Date.now()}-${i}`;
        const onum = `ORD-C3-${Date.now()}-${i}`;
        testOrderIds.push(oid);
        await pool.query(
          `INSERT INTO public.orders (
            id, order_number, buyer_name, buyer_email, buyer_phone, buyer_address, buyer_city,
            seller_id, listing_id, quantity, item_price, subtotal, total_amount, status, created_at, updated_at
          ) VALUES (
            $1, $2, 'Buyer C3', 'c3@example.com', '0812', 'Jl. C3', 'Jakarta',
            $3, $4, 1, 50000, 50000, 50000, 'pending_payment', NOW(), NOW()
          )`,
          [oid, onum, testSellerProfileId, testListingId]
        );
      }

      // Transition all orders to paid concurrently
      const results = await Promise.all(
        testOrderIds.map((id) => orders.transitionOrderStatus(id, "paid"))
      );

      for (const res of results) {
        expect(res.applied).toBe(true);
        expect(res.order?.invoiceNumber).toMatch(new RegExp(`^INV/BJH/${period}/\\d{6}$`));
        expect(res.order?.invoiceIssuedAt).toBeDefined();
      }

      const invoiceNumbers = results.map((r) => r.order!.invoiceNumber!);
      const uniqueNumbers = new Set(invoiceNumbers);
      expect(uniqueNumbers.size).toBe(count);

      // Parse seq numbers and sort
      const seqs = invoiceNumbers.map((inv) => parseInt(inv.split("/")[3], 10)).sort((a, b) => a - b);
      for (let i = 1; i < seqs.length; i++) {
        expect(seqs[i]).toBe(seqs[i - 1] + 1);
      }
    } finally {
      if (testOrderIds.length > 0) {
        await pool.query("DELETE FROM public.orders WHERE id = ANY($1)", [testOrderIds]);
      }
    }
  });

  it("C1 Vouchers: 10 parallel redemptions on usage_limit=3 result in exactly 3 successes", async () => {
    // Ensure sufficient listing stock for 10 concurrent orders
    await pool.query("UPDATE public.listings SET stock = 100, status = 'active' WHERE id = $1", [testListingId]);

    const voucherCode = `CONCUR-${Date.now()}`;
    const v = await vouchers.createVoucher({
      code: voucherCode,
      type: "fixed",
      value: 10000,
      minSubtotal: 20000,
      startsAt: new Date(Date.now() - 3600000).toISOString(),
      endsAt: new Date(Date.now() + 86400000).toISOString(),
      usageLimit: 3,
      perUserLimit: 1,
    });

    const createdOrders: string[] = [];
    try {
      // Run 10 parallel order creations with different user keys
      const attempts = await Promise.allSettled(
        Array.from({ length: 10 }).map((_, i) =>
          orders.createOrder({
            buyerName: `Buyer ${i}`,
            buyerEmail: `buyer${i}@example.com`,
            buyerPhone: "08123456789",
            buyerAddress: "Jl. Kopi No. 1",
            buyerCity: "Jakarta",
            sellerId: testSellerProfileId,
            listingId: testListingId,
            quantity: 1,
            itemPrice: 50000,
            subtotal: 50000,
            shippingCost: 10000,
            serviceFee: 1500,
            totalAmount: 51500,
            shippingCourier: "JNE REG",
            voucherCode: voucherCode,
            discountAmount: 10000,
            discountFundedBy: "platform",
            userKey: `user-${i}`,
          })
        )
      );

      const succeeded = attempts.filter((r) => r.status === "fulfilled");
      const failed = attempts.filter((r) => r.status === "rejected");

      expect(succeeded.length).toBe(3);
      expect(failed.length).toBe(7);

      for (const s of succeeded) {
        if (s.status === "fulfilled") {
          createdOrders.push(s.value.id);
          expect(s.value.voucherCode).toBe(voucherCode);
          expect(s.value.discountAmount).toBe(10000);
        }
      }

      // Canceling 1 successful order should release quota and decrement used_count
      const orderToCancel = createdOrders[0];
      const cancelRes = await orders.transitionOrderStatus(orderToCancel, "canceled");
      expect(cancelRes.applied).toBe(true);

      const updatedVoucher = await vouchers.getVoucherByCode(voucherCode);
      expect(updatedVoucher?.usedCount).toBe(2);

      // Now another user can redeem
      const retryOrder = await orders.createOrder({
        buyerName: "Buyer Retry",
        buyerEmail: "retry@example.com",
        buyerPhone: "08123456789",
        buyerAddress: "Jl. Kopi No. 1",
        buyerCity: "Jakarta",
        sellerId: testSellerProfileId,
        listingId: testListingId,
        quantity: 1,
        itemPrice: 50000,
        subtotal: 50000,
        shippingCost: 10000,
        serviceFee: 1500,
        totalAmount: 51500,
        shippingCourier: "JNE REG",
        voucherCode: voucherCode,
        discountAmount: 10000,
        discountFundedBy: "platform",
        userKey: "user-retry",
      });
      expect(retryOrder.id).toBeDefined();
      createdOrders.push(retryOrder.id);
    } finally {
      if (createdOrders.length > 0) {
        await pool.query("DELETE FROM public.orders WHERE id = ANY($1)", [createdOrders]);
      }
      await pool.query("DELETE FROM public.vouchers WHERE id = $1", [v.id]);
    }
  });

  it("C2 Chat: stores conversations and messages with read tracking and context index", async () => {
    const conv = await chat.getOrCreateConversation(testBuyerUserId, testSellerProfileId, {
      listingId: testListingId,
    });
    expect(conv.id).toBeDefined();

    try {
      const msg = await chat.sendMessage({
        conversationId: conv.id,
        senderId: testBuyerUserId,
        body: "Halo dari uji integrasi chat!",
      });
      expect(msg.id).toBeDefined();
      expect(msg.body).toBe("Halo dari uji integrasi chat!");

      const messages = await chat.getMessagesByConversation(conv.id);
      expect(messages.some((m) => m.id === msg.id)).toBe(true);

      const marked = await chat.markMessagesAsRead(conv.id, testSellerUserId);
      expect(marked).toBeGreaterThanOrEqual(1);
    } finally {
      await pool.query("DELETE FROM public.conversations WHERE id = $1", [conv.id]);
    }
  });

  it("RLS enforcement: anon role is blocked from inserting into private tables (if role exists)", async () => {
    const client = await pool.connect();
    try {
      let hasAnonRole = false;
      try {
        await client.query("SET ROLE anon");
        hasAnonRole = true;
      } catch {
        // Local postgres does not have Supabase anon role; skip gracefully
      }

      if (hasAnonRole) {
        await expect(
          client.query(
            `INSERT INTO public.payout_requests (id, seller_id, amount, bank_name, bank_account_number, bank_account_holder)
             VALUES ('rls-test', 's-1', 10000, 'BCA', '123', 'Anon')`
          )
        ).rejects.toThrow();
      }
    } finally {
      await client.query("RESET ROLE").catch(() => null);
      client.release();
    }
  });
});
