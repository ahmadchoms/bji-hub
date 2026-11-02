import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isAdminAllowed } from "@/lib/auth/admin-guard";
import { recordAuditLog } from "@/lib/data/audit-logs";
import {
  getConversationById,
  getMessagesByConversation,
  markMessagesAsRead,
  canUserAccessConversation,
} from "@/lib/data/chat";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getSession();

  if (session.role === "guest" || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversation = await getConversationById(id);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const isAdmin = await isAdminAllowed(session);
  const hasAccess = await canUserAccessConversation(
    session.userId,
    session.sellerId,
    conversation,
    isAdmin,
  );
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (isAdmin) {
    await recordAuditLog({
      actorId: session.userId,
      actorRole: session.role,
      action: "view_conversation",
      targetType: "conversation",
      targetId: id,
    });
  }

  // Mark incoming messages as read asynchronously
  await markMessagesAsRead(id, session.userId);

  const messages = await getMessagesByConversation(id, 50);
  return NextResponse.json(messages);
}
