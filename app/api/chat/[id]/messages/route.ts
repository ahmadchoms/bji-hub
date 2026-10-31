import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
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

  const hasAccess = canUserAccessConversation(
    session.userId,
    session.role,
    session.sellerId,
    conversation,
  );
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Mark incoming messages as read asynchronously
  await markMessagesAsRead(id, session.userId);

  const messages = await getMessagesByConversation(id, 50);
  return NextResponse.json(messages);
}
