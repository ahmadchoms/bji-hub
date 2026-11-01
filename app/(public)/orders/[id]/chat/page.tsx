import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { isAdminAllowed } from "@/lib/auth/admin-guard";
import { getOrderById } from "@/lib/data/orders";
import { getSellerById } from "@/lib/data";
import {
  getOrCreateConversation,
  getMessagesByConversation,
} from "@/lib/data/chat";
import { markMessagesAsReadAction } from "@/actions/chat.actions";
import { ChatBox } from "@/components/chat/chat-box";

interface OrderChatPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderChatPage({ params }: OrderChatPageProps) {
  const { id } = await params;
  const session = await getSession();

  if (session.role === "guest" || !session.userId) {
    redirect(`/login?next=/orders/${id}/chat`);
  }

  const order = await getOrderById(id);
  if (!order) {
    notFound();
  }

  // Authorization: buyer of order, seller of order, or admin
  const isBuyer = order.buyerId === session.userId;
  const isSeller = session.sellerId === order.sellerId;
  const isAdmin = await isAdminAllowed(session);

  if (!isBuyer && !isSeller && !isAdmin) {
    notFound();
  }

  const seller = await getSellerById(order.sellerId);
  const conversation = await getOrCreateConversation(
    order.buyerId || session.userId,
    order.sellerId,
    {
      orderId: order.id,
      listingId: order.listingId,
    },
  );

  const initialMessages = await getMessagesByConversation(conversation.id, 50);
  await markMessagesAsReadAction(conversation.id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb / Back Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href={`/orders?id=${order.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Rincian Pesanan
        </Link>
        <span className="text-xs text-neutral-600">
          Pesanan #{order.orderNumber}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Order Info Sidebar */}
        <div className="border border-neutral-300 rounded-sm bg-surface-base p-4 space-y-4 h-fit">
          <div className="border-b border-neutral-200 pb-3">
            <h1 className="text-sm font-semibold text-neutral-900 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-primary-700" />
              Obrolan Pesanan
            </h1>
            <p className="text-xs text-neutral-600 mt-1">
              Diskusikan pengiriman, sangrai, atau pertanyaan pesanan langsung dengan{" "}
              {isBuyer ? seller?.businessName || "Penjual" : "Pembeli"}.
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-neutral-600">Toko:</span>
              <p className="font-medium text-neutral-900">
                {seller?.businessName || "Biji Hub Roastery"}
              </p>
            </div>
            <div>
              <span className="text-neutral-600">Produk:</span>
              <p className="font-medium text-neutral-900 line-clamp-2">
                {order.listingTitle || "Kopi Pilihan"}
              </p>
            </div>
            <div>
              <span className="text-neutral-600">Status Pesanan:</span>
              <p className="font-medium capitalize text-neutral-900">
                {order.status.replace("_", " ")}
              </p>
            </div>
            <div>
              <span className="text-neutral-600">Total Transaksi:</span>
              <p className="font-mono font-semibold text-primary-900">
                Rp {order.totalAmount.toLocaleString("id-ID")}
              </p>
            </div>
          </div>
        </div>

        {/* Chat Box */}
        <div className="md:col-span-2">
          <ChatBox
            conversation={conversation}
            initialMessages={initialMessages}
            currentUserId={session.userId}
            orderNumber={order.orderNumber}
            title={seller?.businessName || "Obrolan Penjual"}
          />
        </div>
      </div>
    </div>
  );
}
