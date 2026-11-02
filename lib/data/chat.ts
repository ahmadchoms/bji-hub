import { getPool } from "@/lib/db/pool";
import { logger } from "@/lib/logger";
import { assertMockAllowed } from "@/lib/data/mock-guard";
import { mockAuditLogs } from "@/lib/data/audit-logs";
import { Conversation, ChatMessage } from "@/types";

export const mockConversations: Conversation[] = [];
export const mockMessages: ChatMessage[] = [];

export async function hasReportedMessages(conversationId: string): Promise<boolean> {
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT 1 FROM public.audit_logs al
         WHERE (al.action = 'chat.message_reported' AND al.target_id = $1)
            OR (al.action = 'chat.message_reported' AND EXISTS (
                 SELECT 1 FROM public.messages m WHERE m.id::text = al.target_id AND m.conversation_id = $1
               ))
         LIMIT 1`,
        [conversationId],
      );
      return (res.rowCount ?? 0) > 0;
    } catch (err) {
      assertMockAllowed("hasReportedMessages");
      logger.warn("chat.has_reported_fallback", { error: (err as Error).message });
    }
  } else {
    assertMockAllowed("hasReportedMessages:no_pool");
  }

  return mockAuditLogs.some(
    (al) =>
      al.action === "chat.message_reported" &&
      (al.targetId === conversationId ||
        mockMessages.some((m) => m.id === al.targetId && m.conversationId === conversationId)),
  );
}

export async function canUserAccessConversation(
  userId: string,
  sellerProfileId: string | null | undefined,
  conversation: Conversation,
  isAdmin = false,
): Promise<boolean> {
  if (isAdmin) {
    return hasReportedMessages(conversation.id);
  }
  if (conversation.buyerId === userId) return true;
  if (sellerProfileId && conversation.sellerId === sellerProfileId) return true;
  return false;
}

export async function getOrCreateConversation(
  buyerId: string,
  sellerId: string,
  context: { orderId?: string | null; listingId?: string | null } = {},
): Promise<Conversation> {
  const pool = getPool();
  const orderId = context.orderId || null;
  const listingId = context.listingId || null;
  const now = new Date().toISOString();

  if (pool) {
    const res = await pool.query(
      `INSERT INTO public.conversations (
        buyer_id, seller_id, order_id, listing_id, created_at, last_message_at
      ) VALUES ($1, $2, $3, $4, $5, $5)
      ON CONFLICT (buyer_id, seller_id, COALESCE(order_id, ''), COALESCE(listing_id, ''))
      DO UPDATE SET last_message_at = public.conversations.last_message_at
      RETURNING id, buyer_id, seller_id, order_id, listing_id, created_at, last_message_at`,
      [buyerId, sellerId, orderId, listingId, now],
    );

    const r = res.rows[0];
    return {
      id: r.id,
      buyerId: r.buyer_id,
      sellerId: r.seller_id,
      orderId: r.order_id ?? null,
      listingId: r.listing_id ?? null,
      createdAt: new Date(r.created_at).toISOString(),
      lastMessageAt: new Date(r.last_message_at).toISOString(),
    };
  }

  const existing = mockConversations.find(
    (c) =>
      c.buyerId === buyerId &&
      c.sellerId === sellerId &&
      (c.orderId || null) === orderId &&
      (c.listingId || null) === listingId,
  );
  if (existing) return { ...existing };

  const id = `conv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const newConv: Conversation = {
    id,
    buyerId,
    sellerId,
    orderId,
    listingId,
    createdAt: now,
    lastMessageAt: now,
  };
  mockConversations.unshift(newConv);
  return newConv;
}

export async function getConversationById(id: string): Promise<Conversation | null> {
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT c.*, s."businessName" as seller_name, l.title as listing_title
         FROM public.conversations c
         LEFT JOIN public.seller_profiles s ON c.seller_id = s.id
         LEFT JOIN public.listings l ON c.listing_id = l.id
         WHERE c.id = $1`,
        [id],
      );
      if (res.rows.length === 0) return null;
      const r = res.rows[0];
      return {
        id: r.id,
        buyerId: r.buyer_id,
        sellerId: r.seller_id,
        orderId: r.order_id ?? null,
        listingId: r.listing_id ?? null,
        sellerName: r.seller_name ?? undefined,
        listingTitle: r.listing_title ?? undefined,
        createdAt: new Date(r.created_at).toISOString(),
        lastMessageAt: new Date(r.last_message_at).toISOString(),
      };
    } catch (err) {
      assertMockAllowed("getConversationById");
      logger.warn("chat.get_conversation_fallback", { error: (err as Error).message });
    }
  } else {
    assertMockAllowed("getConversationById:no_pool");
  }

  const found = mockConversations.find((c) => c.id === id);
  return found ? { ...found } : null;
}

export interface GetConversationsOptions {
  isAdmin?: boolean;
  limit?: number;
  offset?: number;
}

export async function getConversationsForUser(
  userId: string,
  sellerProfileId?: string | null,
  options: GetConversationsOptions = {},
): Promise<Conversation[]> {
  const pool = getPool();
  const limit = Math.min(Math.max(1, options.limit ?? 50), 50);
  const offset = Math.max(0, options.offset ?? 0);
  const isAdmin = options.isAdmin ?? false;

  if (pool) {
    try {
      let query = "";
      let params: unknown[] = [];

      if (isAdmin) {
        query = `SELECT c.*, s."businessName" as seller_name, l.title as listing_title
                 FROM public.conversations c
                 LEFT JOIN public.seller_profiles s ON c.seller_id = s.id
                 LEFT JOIN public.listings l ON c.listing_id = l.id
                 WHERE EXISTS (
                   SELECT 1 FROM public.audit_logs al
                   WHERE (al.action = 'chat.message_reported' AND al.target_id = c.id::text)
                      OR (al.action = 'chat.message_reported' AND EXISTS (
                           SELECT 1 FROM public.messages m WHERE m.id::text = al.target_id AND m.conversation_id = c.id
                         ))
                 )
                 ORDER BY c.last_message_at DESC
                 LIMIT $1 OFFSET $2`;
        params = [limit, offset];
      } else if (sellerProfileId) {
        query = `SELECT c.*, s."businessName" as seller_name, l.title as listing_title
                 FROM public.conversations c
                 LEFT JOIN public.seller_profiles s ON c.seller_id = s.id
                 LEFT JOIN public.listings l ON c.listing_id = l.id
                 WHERE c.seller_id = $1
                 ORDER BY c.last_message_at DESC
                 LIMIT $2 OFFSET $3`;
        params = [sellerProfileId, limit, offset];
      } else {
        query = `SELECT c.*, s."businessName" as seller_name, l.title as listing_title
                 FROM public.conversations c
                 LEFT JOIN public.seller_profiles s ON c.seller_id = s.id
                 LEFT JOIN public.listings l ON c.listing_id = l.id
                 WHERE c.buyer_id = $1
                 ORDER BY c.last_message_at DESC
                 LIMIT $2 OFFSET $3`;
        params = [userId, limit, offset];
      }

      const res = await pool.query(query, params);
      return res.rows.map((r) => ({
        id: r.id,
        buyerId: r.buyer_id,
        sellerId: r.seller_id,
        orderId: r.order_id ?? null,
        listingId: r.listing_id ?? null,
        sellerName: r.seller_name ?? undefined,
        listingTitle: r.listing_title ?? undefined,
        createdAt: new Date(r.created_at).toISOString(),
        lastMessageAt: new Date(r.last_message_at).toISOString(),
      }));
    } catch (err) {
      assertMockAllowed("getConversationsForUser");
      logger.warn("chat.get_conversations_for_user_fallback", { error: (err as Error).message });
    }
  } else {
    assertMockAllowed("getConversationsForUser:no_pool");
  }

  if (isAdmin) {
    const reported = mockConversations.filter((c) =>
      mockAuditLogs.some(
        (al) =>
          al.action === "chat.message_reported" &&
          (al.targetId === c.id ||
            mockMessages.some((m) => m.id === al.targetId && m.conversationId === c.id)),
      ),
    );
    return reported.slice(offset, offset + limit);
  }

  const userConvs = mockConversations.filter((c) => {
    if (sellerProfileId && c.sellerId === sellerProfileId) return true;
    if (!sellerProfileId && c.buyerId === userId) return true;
    return false;
  });
  return userConvs.slice(offset, offset + limit);
}

export async function getMessagesByConversation(
  conversationId: string,
  limit = 50,
): Promise<ChatMessage[]> {
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT m.*
         FROM public.messages m
         WHERE m.conversation_id = $1
         ORDER BY m.created_at ASC
         LIMIT $2`,
        [conversationId, limit],
      );
      return res.rows.map((r) => ({
        id: r.id,
        conversationId: r.conversation_id,
        senderId: r.sender_id,
        body: r.body,
        createdAt: new Date(r.created_at).toISOString(),
        readAt: r.read_at ? new Date(r.read_at).toISOString() : null,
      }));
    } catch (err) {
      assertMockAllowed("getMessagesByConversation");
      logger.warn("chat.get_messages_fallback", { error: (err as Error).message });
    }
  } else {
    assertMockAllowed("getMessagesByConversation:no_pool");
  }

  return mockMessages
    .filter((m) => m.conversationId === conversationId)
    .slice(-limit);
}

export async function sendMessage(data: {
  conversationId: string;
  senderId: string;
  body: string;
}): Promise<ChatMessage> {
  const pool = getPool();
  const now = new Date().toISOString();

  if (pool) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const insertRes = await client.query(
        `INSERT INTO public.messages (
          conversation_id, sender_id, body, created_at
        ) VALUES ($1, $2, $3, $4)
        RETURNING id, conversation_id, sender_id, body, created_at, read_at`,
        [data.conversationId, data.senderId, data.body, now],
      );

      await client.query(
        `UPDATE public.conversations
         SET last_message_at = $1
         WHERE id = $2`,
        [now, data.conversationId],
      );

      await client.query("COMMIT");

      const r = insertRes.rows[0];
      return {
        id: r.id,
        conversationId: r.conversation_id,
        senderId: r.sender_id,
        body: r.body,
        createdAt: new Date(r.created_at).toISOString(),
        readAt: r.read_at ? new Date(r.read_at).toISOString() : null,
      };
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const newMsg: ChatMessage = {
    id,
    conversationId: data.conversationId,
    senderId: data.senderId,
    body: data.body,
    createdAt: now,
    readAt: null,
  };
  mockMessages.push(newMsg);

  const conv = mockConversations.find((c) => c.id === data.conversationId);
  if (conv) {
    conv.lastMessageAt = now;
  }

  return newMsg;
}

export async function markMessagesAsRead(
  conversationId: string,
  readerId: string,
): Promise<number> {
  const pool = getPool();
  const now = new Date().toISOString();

  if (pool) {
    try {
      const res = await pool.query(
        `UPDATE public.messages
         SET read_at = $1
         WHERE conversation_id = $2 AND sender_id != $3 AND read_at IS NULL`,
        [now, conversationId, readerId],
      );
      return res.rowCount ?? 0;
    } catch (e) {
      logger.error("chat.mark_read_failed", e, { conversationId, readerId });
      return 0;
    }
  }

  let count = 0;
  mockMessages.forEach((m) => {
    if (m.conversationId === conversationId && m.senderId !== readerId && !m.readAt) {
      m.readAt = now;
      count++;
    }
  });
  return count;
}
