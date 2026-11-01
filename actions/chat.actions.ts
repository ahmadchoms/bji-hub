"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { getSession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { runAfterResponse } from "@/lib/after";
import { logger } from "@/lib/logger";
import {
  getConversationById,
  getOrCreateConversation,
  sendMessage,
  markMessagesAsRead,
  canUserAccessConversation,
} from "@/lib/data/chat";
import { getOrderById } from "@/lib/data/orders";
import { getListingById, getSellerById } from "@/lib/data";
import { createNotification } from "@/lib/data/notifications";
import { recordAuditLog } from "@/lib/data/audit-logs";
import { Conversation, ChatMessage } from "@/types";
import { asUserId } from "@/types/ids";

function sanitizeMessageText(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim();
}

const startConversationSchema = z.object({
  sellerId: z.string().min(1, "ID penjual wajib diisi"),
  orderId: z.string().optional().nullable(),
  listingId: z.string().optional().nullable(),
  initialMessage: z.string().max(2000).optional(),
});

export async function startConversationAction(
  input: unknown,
): Promise<ActionResult<Conversation>> {
  const session = await getSession();
  if (session.role === "guest" || !session.userId) {
    return fail("Silakan masuk akun terlebih dahulu untuk memulai obrolan");
  }

  const parsed = startConversationSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      "Data obrolan tidak valid",
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const { sellerId, orderId, listingId, initialMessage } = parsed.data;

  // Rate limit: max 5 new conversations / day per user
  const convRl = await checkRateLimit(`chat:conv:${session.userId}`, 5, 86_400_000);
  if (!convRl.success) {
    return fail("Batas harian memulai percakapan baru telah tercapai (maks. 5 percakapan/hari)");
  }

  // Verify context existence & authorization
  if (orderId) {
    const order = await getOrderById(orderId);
    if (!order) return fail("Pesanan tidak ditemukan");
    if (session.role !== "admin" && order.buyerId !== session.userId && order.sellerId !== session.sellerId) {
      return fail("Anda tidak berwenang memulai obrolan untuk pesanan ini");
    }
  }

  if (listingId) {
    const listing = await getListingById(listingId);
    if (!listing) return fail("Produk tidak ditemukan");
  }

  const conversation = await getOrCreateConversation(session.userId, sellerId, {
    orderId,
    listingId,
  });

  if (initialMessage && initialMessage.trim()) {
    const sanitized = sanitizeMessageText(initialMessage);
    if (sanitized.length > 0) {
      await sendMessage({
        conversationId: conversation.id,
        senderId: session.userId,
        body: sanitized,
      });
    }
  }

  revalidatePath(`/orders/${orderId}/chat`);
  revalidatePath("/dashboard/messages");

  return ok(conversation);
}

const sendMessageSchema = z.object({
  conversationId: z.string().min(1, "ID percakapan wajib diisi"),
  body: z
    .string()
    .trim()
    .min(1, "Pesan tidak boleh kosong")
    .max(2000, "Pesan maksimal 2000 karakter"),
});

export async function sendMessageAction(
  input: unknown,
): Promise<ActionResult<ChatMessage>> {
  const session = await getSession();
  if (session.role === "guest" || !session.userId) {
    return fail("Silakan masuk akun untuk mengirim pesan");
  }

  const parsed = sendMessageSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      "Pesan tidak valid",
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const { conversationId, body } = parsed.data;

  // Rate limit: 20 messages / minute per user
  const msgRl = await checkRateLimit(`chat:msg:${session.userId}`, 20, 60_000);
  if (!msgRl.success) {
    return fail("Terlalu banyak pesan. Silakan tunggu beberapa detik.");
  }

  const conversation = await getConversationById(conversationId);
  if (!conversation) {
    return fail("Percakapan tidak ditemukan");
  }

  const hasAccess = canUserAccessConversation(
    session.userId,
    session.role,
    session.sellerId,
    conversation,
  );
  if (!hasAccess) {
    return fail("Anda tidak memiliki akses ke percakapan ini");
  }

  const sanitized = sanitizeMessageText(body);
  if (sanitized.length === 0) {
    return fail("Pesan tidak boleh kosong");
  }

  const msg = await sendMessage({
    conversationId,
    senderId: session.userId,
    body: sanitized,
  });

  // Async notification to the other party
  const isSenderBuyer = conversation.buyerId === session.userId;
  runAfterResponse(async () => {
    try {
      if (isSenderBuyer) {
        // Recipient is seller
        const seller = await getSellerById(conversation.sellerId);
        if (seller?.user?.id) {
          await createNotification({
            userId: asUserId(seller.user.id),
            title: "Pesan Baru dari Pembeli",
            message: sanitized.slice(0, 100),
            type: "order_status",
            link: `/dashboard/messages?c=${conversationId}`,
          });
        }
      } else {
        // Recipient is buyer
        await createNotification({
          userId: asUserId(conversation.buyerId),
          title: "Pesan Baru dari Penjual",
          message: sanitized.slice(0, 100),
          type: "order_status",
          link: conversation.orderId ? `/orders/${conversation.orderId}/chat` : `/messages?c=${conversationId}`,
        });
      }
    } catch (e) {
      logger.warn("chat.notification_failed", { error: e, conversationId });
    }
  });

  revalidatePath(`/orders/${conversation.orderId}/chat`);
  revalidatePath("/dashboard/messages");

  return ok(msg);
}

export async function markMessagesAsReadAction(
  conversationId: string,
): Promise<ActionResult<{ markedCount: number }>> {
  const session = await getSession();
  if (session.role === "guest" || !session.userId) {
    return fail("Autentikasi diperlukan");
  }

  const conversation = await getConversationById(conversationId);
  if (!conversation) {
    return fail("Percakapan tidak ditemukan");
  }

  const hasAccess = canUserAccessConversation(
    session.userId,
    session.role,
    session.sellerId,
    conversation,
  );
  if (!hasAccess) {
    return fail("Akses ditolak");
  }

  const count = await markMessagesAsRead(conversationId, session.userId);
  return ok({ markedCount: count });
}

export async function reportMessageAction(
  messageId: string,
  reason: string,
): Promise<ActionResult<boolean>> {
  const session = await getSession();
  if (session.role === "guest" || !session.userId) {
    return fail("Autentikasi diperlukan");
  }

  await recordAuditLog({
    actorId: session.userId,
    actorRole: session.role,
    action: "chat.message_reported",
    targetType: "message",
    targetId: messageId,
    details: { reason: reason.trim() },
  });

  return ok(true);
}
