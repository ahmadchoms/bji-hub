"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessageSquare, AlertCircle } from "lucide-react";
import { startConversationAction } from "@/actions/chat.actions";

interface StartChatButtonProps {
  sellerId: string;
  orderId?: string;
  listingId?: string;
  label?: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function StartChatButton({
  sellerId,
  orderId,
  listingId,
  label,
  className,
  variant = "outline",
  size = "sm",
}: StartChatButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const displayLabel = label || (orderId ? "Tanya Penjual" : "Hubungi Penjual");

  const handleStartChat = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await startConversationAction({
        sellerId,
        orderId,
        listingId,
      });

      if (res.success) {
        if (orderId) {
          router.push(`/orders/${orderId}/chat`);
        } else {
          router.push(`/dashboard/messages?c=${res.data.id}`);
        }
      } else {
        if (res.error?.includes("masuk akun")) {
          const currentUrl = typeof window !== "undefined" ? window.location.pathname : "/";
          router.push(`/login?next=${encodeURIComponent(currentUrl)}`);
        } else {
          setErrorMsg(res.error || "Gagal memulai obrolan");
        }
      }
    });
  };

  return (
    <div className="inline-flex flex-col gap-1">
      <Button
        type="button"
        variant={variant}
        size={size}
        className={`text-xs gap-1.5 ${className || ""}`}
        disabled={isPending}
        onClick={handleStartChat}
      >
        <MessageSquare className="h-3.5 w-3.5 text-primary-600" />
        <span>{isPending ? "Menghubungkan..." : displayLabel}</span>
      </Button>
      {errorMsg && (
        <span className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> {errorMsg}
        </span>
      )}
    </div>
  );
}
