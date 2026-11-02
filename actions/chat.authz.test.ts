import { describe, it, expect, beforeEach, vi } from "vitest";

process.env.DATA_SOURCE = "mock";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

import {
  startConversationAction,
  sendMessageAction,
  markMessagesAsReadAction,
  reportMessageAction,
} from "./chat.actions";
import {
  mockConversations,
  mockMessages,
  getOrCreateConversation,
} from "@/lib/data/chat";
import { mockAuditLogs } from "@/lib/data/audit-logs";
import * as sessionModule from "@/lib/auth/session";
import * as adminGuardModule from "@/lib/auth/admin-guard";
import type { Session } from "@/lib/auth/roles";
import { asUserId, asSellerProfileId } from "@/types/ids";

describe("actions/chat authz & security (J2, J8)", () => {
  beforeEach(() => {
    mockConversations.length = 0;
    mockMessages.length = 0;
    mockAuditLogs.length = 0;
    vi.restoreAllMocks();
  });

  it("blocks admin without AAL2 MFA from sending or accessing conversation messages", async () => {
    const conv = await getOrCreateConversation("buyer-1", "seller-1");

    const adminSession: Session = {
      role: "admin",
      userId: asUserId("admin-1"),
      email: "admin@bijihub.com",
      sellerId: null,
    };
    vi.spyOn(sessionModule, "getSession").mockResolvedValue(adminSession);
    // MFA not satisfied (e.g. AAL1)
    vi.spyOn(adminGuardModule, "isAdminAllowed").mockResolvedValue(false);

    const sendRes = await sendMessageAction({
      conversationId: conv.id,
      body: "Admin intrusion attempt",
    });
    expect(sendRes.success).toBe(false);
    if (!sendRes.success) {
      expect(sendRes.error).toContain("tidak memiliki akses");
    }

    const readRes = await markMessagesAsReadAction(conv.id);
    expect(readRes.success).toBe(false);
  });

  it("admin with AAL2 can only access conversations that have reported messages", async () => {
    const conv = await getOrCreateConversation("buyer-1", "seller-1");

    const adminSession: Session = {
      role: "admin",
      userId: asUserId("admin-1"),
      email: "admin@bijihub.com",
      sellerId: null,
    };
    vi.spyOn(sessionModule, "getSession").mockResolvedValue(adminSession);
    vi.spyOn(adminGuardModule, "isAdminAllowed").mockResolvedValue(true);

    // 1. Without reported messages, access is forbidden
    const attempt1 = await sendMessageAction({
      conversationId: conv.id,
      body: "Checking in on un-reported chat",
    });
    expect(attempt1.success).toBe(false);

    // 2. Report a message in the conversation
    const reportRes = await reportMessageAction(conv.id, "Spam and inappropriate content");
    expect(reportRes.success).toBe(true);

    // 3. Now admin has access, and access is audited
    const attempt2 = await sendMessageAction({
      conversationId: conv.id,
      body: "Admin moderation note",
    });
    expect(attempt2.success).toBe(true);

    const auditEntry = mockAuditLogs.find(
      (log) => log.action === "view_conversation" && log.targetId === conv.id,
    );
    expect(auditEntry).toBeDefined();
    expect(auditEntry?.actorRole).toBe("admin");
  });

  it("rate limit check in startConversationAction does not consume quota if context validation fails (J8)", async () => {
    const buyerSession: Session = {
      role: "buyer",
      userId: asUserId("buyer-rate-test"),
      email: "buyer@example.com",
      sellerId: asSellerProfileId("seller-same"),
    };
    vi.spyOn(sessionModule, "getSession").mockResolvedValue(buyerSession);

    // Attempt to start a conversation with self store (invalid context)
    for (let i = 0; i < 7; i++) {
      const res = await startConversationAction({
        sellerId: "seller-same",
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toContain("toko Anda sendiri");
      }
    }

    // Now start a valid conversation: quota was not drained by previous failed attempts!
    const validRes = await startConversationAction({
      sellerId: "seller-different",
    });
    expect(validRes.success).toBe(true);
  });
});
