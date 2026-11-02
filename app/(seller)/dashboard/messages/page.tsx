import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { MessageSquare, Inbox } from "lucide-react";
import { requireSeller, getSession } from "@/lib/auth/session";
import {
  getConversationsForUser,
  getConversationById,
  getMessagesByConversation,
  markMessagesAsRead,
} from "@/lib/data/chat";
import { ChatBox } from "@/components/chat/chat-box";

interface DashboardMessagesPageProps {
  searchParams: Promise<{ c?: string }>;
}

export default async function DashboardMessagesPage({
  searchParams,
}: DashboardMessagesPageProps) {
  const { sellerId } = await requireSeller();
  const session = await getSession();
  const { c: activeConvId } = await searchParams;

  const conversations = await getConversationsForUser(
    session.userId || "anonymous",
    sellerId,
  );

  const activeConversation = activeConvId
    ? conversations.find((conv) => conv.id === activeConvId) ||
      (await getConversationById(activeConvId))
    : conversations[0] || null;

  let activeMessages: import("@/types").ChatMessage[] = [];
  if (activeConversation) {
    activeMessages = await getMessagesByConversation(activeConversation.id, 50);
    if (session.userId) {
      await markMessagesAsRead(activeConversation.id, session.userId);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-display font-semibold text-neutral-900">
          Pesan & Obrolan Pembeli
        </h1>
        <p className="text-xs text-neutral-600 mt-1">
          Kelola percakapan langsung dengan pembeli mengenai produk atau pesanan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="border border-neutral-300 rounded-sm bg-surface-base overflow-hidden h-[550px] flex flex-col">
          <div className="p-3.5 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-900 flex items-center gap-1.5">
              <Inbox className="w-3.5 h-3.5 text-primary-700" />
              Kotak Masuk ({conversations.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-neutral-200">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-600 space-y-1">
                <MessageSquare className="w-8 h-8 mx-auto text-neutral-600 mb-2" />
                <p>Belum ada obrolan masuk.</p>
                <p className="text-neutral-600">
                  Pesan dari pembeli akan muncul di sini.
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = activeConversation?.id === conv.id;
                return (
                  <Link
                    key={conv.id}
                    href={`/dashboard/messages?c=${conv.id}`}
                    className={`block p-3.5 transition-colors ${
                      isActive
                        ? "bg-neutral-100 font-medium"
                        : "hover:bg-neutral-50"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-neutral-900 truncate">
                        {conv.buyerName || `Pembeli #${conv.buyerId.slice(-6)}`}
                      </span>
                      <span className="text-xs text-neutral-600 shrink-0">
                        {format(new Date(conv.lastMessageAt), "d MMM HH:mm", {
                          locale: localeId,
                        })}
                      </span>
                    </div>
                    {conv.orderId && (
                      <span className="inline-block px-1.5 py-0.5 rounded text-xs bg-neutral-200 text-neutral-800 mb-1">
                        Pesanan #{conv.orderId.slice(0, 12)}
                      </span>
                    )}
                    {conv.listingTitle && (
                      <p className="text-xs text-neutral-600 truncate">
                        {conv.listingTitle}
                      </p>
                    )}
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Active Conversation ChatBox */}
        <div className="md:col-span-2">
          {activeConversation ? (
            <ChatBox
              conversation={activeConversation}
              initialMessages={activeMessages}
              currentUserId={session.userId || "anonymous"}
              title={`Obrolan dengan ${
                activeConversation.buyerName ||
                `Pembeli #${activeConversation.buyerId.slice(-6)}`
              }`}
            />
          ) : (
            <div className="border border-neutral-300 rounded-sm bg-surface-base h-[550px] flex flex-col items-center justify-center p-6 text-center text-neutral-600 space-y-2">
              <MessageSquare className="w-10 h-10 text-neutral-600" />
              <p className="text-sm font-medium text-neutral-900">
                Pilih percakapan untuk memulai
              </p>
              <p className="text-xs text-neutral-600 max-w-sm">
                Pilih obrolan dari daftar di sebelah kiri untuk melihat pesan dan membalas pembeli.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
