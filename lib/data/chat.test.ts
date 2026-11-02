import { describe, it, expect, beforeEach } from "vitest";

process.env.DATA_SOURCE = "mock";

import {
  getOrCreateConversation,
  getConversationById,
  getConversationsForUser,
  getMessagesByConversation,
  sendMessage,
  markMessagesAsRead,
  canUserAccessConversation,
  hasReportedMessages,
  mockConversations,
  mockMessages,
} from "./chat";
import { mockAuditLogs } from "@/lib/data/audit-logs";
import { Conversation } from "@/types";

describe("lib/data/chat (C2)", () => {
  beforeEach(() => {
    mockConversations.length = 0;
    mockMessages.length = 0;
    mockAuditLogs.length = 0;
  });

  it("creates and retrieves a conversation idempotently", async () => {
    const conv1 = await getOrCreateConversation("buyer-1", "seller-1", {
      orderId: "ord-1",
      listingId: "list-1",
    });
    expect(conv1.id).toBeDefined();
    expect(conv1.buyerId).toBe("buyer-1");
    expect(conv1.sellerId).toBe("seller-1");
    expect(conv1.orderId).toBe("ord-1");

    const conv2 = await getOrCreateConversation("buyer-1", "seller-1", {
      orderId: "ord-1",
      listingId: "list-1",
    });
    expect(conv2.id).toBe(conv1.id);
  });

  it("strictly enforces authorization across roles (J2)", async () => {
    const conv: Conversation = {
      id: "conv-auth-test",
      buyerId: "buyer-owner",
      sellerId: "seller-owner-profile",
      orderId: "ord-test",
      listingId: "list-test",
      createdAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
    };

    // Buyer owner has access
    expect(await canUserAccessConversation("buyer-owner", null, conv)).toBe(true);

    // Store owner seller has access
    expect(await canUserAccessConversation("seller-user-id", "seller-owner-profile", conv)).toBe(true);

    // Admin WITHOUT reported messages is blocked (J2: reported only)
    expect(await canUserAccessConversation("admin-user-id", null, conv, true)).toBe(false);

    // Once a message or conversation is reported, admin gets access
    mockAuditLogs.push({
      id: "al-1",
      actorId: "buyer-owner",
      actorRole: "buyer",
      action: "chat.message_reported",
      targetId: conv.id,
      targetType: "conversation",
      details: null,
      ipAddress: null,
      createdAt: new Date().toISOString(),
    });
    expect(await hasReportedMessages(conv.id)).toBe(true);
    expect(await canUserAccessConversation("admin-user-id", null, conv, true)).toBe(true);

    // Unrelated buyer is blocked
    expect(await canUserAccessConversation("buyer-stranger", null, conv)).toBe(false);

    // Unrelated seller is blocked
    expect(await canUserAccessConversation("other-seller-user", "seller-other-profile", conv)).toBe(false);
  });

  it("sends message and updates conversation lastMessageAt", async () => {
    const conv = await getOrCreateConversation("buyer-1", "seller-1");
    const initialTime = conv.lastMessageAt;

    // Small delay to verify lastMessageAt updates
    await new Promise((r) => setTimeout(r, 5));

    const msg = await sendMessage({
      conversationId: conv.id,
      senderId: "buyer-1",
      body: "Halo, apakah biji kopi ini baru disangrai?",
    });

    expect(msg.id).toBeDefined();
    expect(msg.body).toBe("Halo, apakah biji kopi ini baru disangrai?");
    expect(msg.senderId).toBe("buyer-1");
    expect(msg.readAt).toBeNull();

    const messages = await getMessagesByConversation(conv.id);
    expect(messages.length).toBe(1);
    expect(messages[0].id).toBe(msg.id);

    const updatedConv = await getConversationById(conv.id);
    expect(updatedConv?.lastMessageAt).not.toBe(initialTime);
  });

  it("marks unread messages as read only for the recipient", async () => {
    const conv = await getOrCreateConversation("buyer-1", "seller-1");

    await sendMessage({
      conversationId: conv.id,
      senderId: "buyer-1",
      body: "Pesan dari pembeli",
    });

    // Sender reading own messages should mark 0
    const countSender = await markMessagesAsRead(conv.id, "buyer-1");
    expect(countSender).toBe(0);

    // Recipient reading marks 1 message
    const countRecipient = await markMessagesAsRead(conv.id, "seller-user");
    expect(countRecipient).toBe(1);

    const messages = await getMessagesByConversation(conv.id);
    expect(messages[0].readAt).not.toBeNull();
  });

  it("filters conversations list for buyer vs seller vs admin (J2)", async () => {
    const c1 = await getOrCreateConversation("buyer-1", "seller-1");
    const c2 = await getOrCreateConversation("buyer-2", "seller-1");
    const c3 = await getOrCreateConversation("buyer-1", "seller-2");

    // buyer-1 sees 2 conversations
    const buyer1Convs = await getConversationsForUser("buyer-1");
    expect(buyer1Convs.length).toBe(2);

    // seller-1 sees 2 conversations
    const seller1Convs = await getConversationsForUser("seller-1-user", "seller-1");
    expect(seller1Convs.length).toBe(2);

    // seller-2 sees 1 conversation
    const seller2Convs = await getConversationsForUser("seller-2-user", "seller-2");
    expect(seller2Convs.length).toBe(1);

    // admin sees 0 when nothing is reported
    const adminConvsEmpty = await getConversationsForUser("admin-user", null, { isAdmin: true });
    expect(adminConvsEmpty.length).toBe(0);

    // report c1, admin sees exactly 1
    mockAuditLogs.push({
      id: "al-rep-1",
      actorId: "buyer-1",
      actorRole: "buyer",
      action: "chat.message_reported",
      targetId: c1.id,
      targetType: "conversation",
      details: null,
      ipAddress: null,
      createdAt: new Date().toISOString(),
    });
    const adminConvsReported = await getConversationsForUser("admin-user", null, { isAdmin: true });
    expect(adminConvsReported.length).toBe(1);
    expect(adminConvsReported[0].id).toBe(c1.id);
  });
});
