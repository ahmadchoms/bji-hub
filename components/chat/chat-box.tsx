"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Send, Loader2, Flag, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { sendMessageAction, reportMessageAction } from "@/actions/chat.actions";
import { ChatMessage, Conversation } from "@/types";

interface ChatBoxProps {
  conversation: Conversation;
  initialMessages: ChatMessage[];
  currentUserId: string;
  orderNumber?: string;
  title?: string;
}

export function ChatBox({
  conversation,
  initialMessages,
  currentUserId,
  orderNumber,
  title,
}: ChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputText, setInputText] = useState("");
  const [isSending, startTransition] = useTransition();
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingMessageId, setReportingMessageId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Polling every 15 seconds (C2 spec)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat/${conversation.id}/messages`, {
          cache: "no-store",
        });
        if (res.ok) {
          const freshMessages = await res.json();
          if (Array.isArray(freshMessages) && freshMessages.length > 0) {
            setMessages(freshMessages);
          }
        }
      } catch {
        // ignore: polling error
      }
    }, 15_000);

    return () => clearInterval(interval);
  }, [conversation.id]);

  const handleSend = () => {
    if (!inputText.trim() || isSending) return;
    const body = inputText.trim();
    setInputText("");

    // Optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      conversationId: conversation.id,
      senderId: currentUserId,
      body,
      createdAt: new Date().toISOString(),
      readAt: null,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    startTransition(async () => {
      const res = await sendMessageAction({
        conversationId: conversation.id,
        body,
      });

      if (!res.success) {
        toast.error("Gagal mengirim pesan", { description: res.error });
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      } else {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? res.data : m)),
        );
      }
    });
  };

  const handleReport = async () => {
    if (!reportingMessageId || !reportReason.trim() || isReporting) return;
    setIsReporting(true);
    try {
      const res = await reportMessageAction(reportingMessageId, reportReason.trim());
      if (res.success) {
        toast.success("Laporan pesan berhasil dikirim ke antrean moderasi");
        setReportModalOpen(false);
        setReportReason("");
        setReportingMessageId(null);
      } else {
        toast.error("Gagal mengirim laporan", { description: res.error });
      }
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <div className="flex flex-col h-[550px] border border-neutral-300 rounded-sm bg-surface-base shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">
            {title || conversation.sellerName || "Obrolan"}
          </h2>
          {orderNumber && (
            <p className="text-xs text-neutral-600">Pesanan: #{orderNumber}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs text-neutral-600">Aktif</span>
        </div>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-600 space-y-2">
            <p className="text-xs">Belum ada pesan dalam percakapan ini.</p>
            <p className="text-xs text-neutral-600">
              Kirim pesan pertama Anda di bawah untuk memulai obrolan.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div
                  className={`group relative max-w-[78%] rounded-sm px-3.5 py-2 text-xs leading-relaxed ${
                    isMe
                      ? "bg-primary-900 text-white rounded-br-none"
                      : "bg-neutral-100 text-neutral-900 border border-neutral-200 rounded-bl-none"
                  }`}
                >
                  <p className="break-words select-text">{msg.body}</p>
                  {!isMe && (
                    <button
                      type="button"
                      onClick={() => {
                        setReportingMessageId(msg.id);
                        setReportModalOpen(true);
                      }}
                      className="absolute -right-6 top-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-neutral-600 hover:text-rose-600"
                      title="Laporkan pesan"
                      aria-label="Laporkan pesan"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs text-neutral-600">
                  <span>
                    {format(new Date(msg.createdAt), "HH:mm", { locale: localeId })}
                  </span>
                  {isMe && msg.readAt && (
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 ml-0.5" />
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="p-3 border-t border-neutral-200 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <Input
            type="text"
            placeholder="Ketik pesan Anda... (maks. 2000 karakter)"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            maxLength={2000}
            className="flex-1 text-xs bg-surface-base"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!inputText.trim() || isSending}
            className="shrink-0 text-xs px-3.5"
          >
            {isSending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <Send className="w-3.5 h-3.5 mr-1" />
                Kirim
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Report Modal */}
      <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-neutral-900">
              Laporkan Pesan
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-600">
              Pesan yang dilaporkan akan ditinjau oleh tim moderator Biji Hub.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="block text-xs font-medium text-neutral-800">
              Alasan Pelaporan
            </label>
            <textarea
              rows={3}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Contoh: Mengandung spam, penipuan, atau bahasa kasar..."
              className="w-full text-xs p-2.5 rounded border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-primary-600"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReportModalOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleReport}
                disabled={!reportReason.trim() || isReporting}
                className="text-xs"
              >
                {isReporting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                Kirim Laporan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
