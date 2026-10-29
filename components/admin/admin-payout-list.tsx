"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/components/shared/price-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updatePayoutStatusAction } from "@/actions/payout.actions";
import { buildPayoutDisbursedNotificationUrl } from "@/lib/notifications";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { PayoutRequest } from "@/types";
import {
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  MessageCircle,
  Loader2,
} from "lucide-react";

interface AdminPayoutListProps {
  payouts: (PayoutRequest & { sellerName?: string; whatsappNumber?: string })[];
}

export function AdminPayoutList({ payouts }: AdminPayoutListProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("all");
  const [isPending, startTransition] = useTransition();

  const filteredPayouts = payouts.filter((p) => {
    if (filter === "all") return true;
    return p.status === filter;
  });

  const handleUpdateStatus = (payoutId: string, status: "processed" | "rejected") => {
    startTransition(async () => {
      const res = await updatePayoutStatusAction({ payoutId, status });
      if (res.success) {
        toast.success(
          status === "processed"
            ? "Pencairan dana berhasil disetujui & ditandai sudah ditransfer."
            : "Pengajuan pencairan dana berhasil ditolak.",
        );
        router.refresh();
      } else {
        toast.error(res.error || "Gagal memperbarui status pengajuan");
      }
    });
  };

  const pendingCount = payouts.filter((p) => p.status === "pending").length;
  const processedCount = payouts.filter((p) => p.status === "processed").length;
  const rejectedCount = payouts.filter((p) => p.status === "rejected").length;

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-neutral-200 text-xs">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-sm font-medium transition-colors ${
            filter === "all"
              ? "bg-neutral-900 text-white"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          }`}
        >
          Semua ({payouts.length})
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`px-3 py-1.5 rounded-sm font-medium transition-colors ${
            filter === "pending"
              ? "bg-amber-600 text-white"
              : "bg-amber-50 text-amber-700 hover:bg-amber-100"
          }`}
        >
          Perlu Ditransfer ({pendingCount})
        </button>
        <button
          onClick={() => setFilter("processed")}
          className={`px-3 py-1.5 rounded-sm font-medium transition-colors ${
            filter === "processed"
              ? "bg-emerald-700 text-white"
              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          }`}
        >
          Selesai Ditransfer ({processedCount})
        </button>
        <button
          onClick={() => setFilter("rejected")}
          className={`px-3 py-1.5 rounded-sm font-medium transition-colors ${
            filter === "rejected"
              ? "bg-rose-700 text-white"
              : "bg-rose-50 text-rose-700 hover:bg-rose-100"
          }`}
        >
          Ditolak ({rejectedCount})
        </button>
      </div>

      {/* Payouts list */}
      <div className="space-y-4">
        {filteredPayouts.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-neutral-200 rounded-lg">
            <p className="text-sm text-neutral-600">
              Tidak ada pengajuan pencairan dana dalam kategori ini.
            </p>
          </div>
        ) : (
          filteredPayouts.map((p) => {
            const isProcessing = isPending;

            return (
              <div
                key={p.id}
                className="border border-neutral-300 bg-white rounded-lg p-5 space-y-4 shadow-xs"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-neutral-900">
                      {p.id}
                    </span>
                    <span className="text-xs text-neutral-600 font-mono">
                      {format(new Date(p.createdAt), "d MMM yyyy, HH:mm", {
                        locale: idLocale,
                      })}
                    </span>
                  </div>
                  <div>
                    <Badge
                      variant="outline"
                      className={
                        p.status === "processed"
                          ? "text-emerald-700 bg-emerald-50 border-emerald-300"
                          : p.status === "pending"
                            ? "text-amber-700 bg-amber-50 border-amber-300"
                            : "text-rose-700 bg-rose-50 border-rose-300"
                      }
                    >
                      {p.status === "processed" ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Berhasil Ditransfer
                        </>
                      ) : p.status === "pending" ? (
                        <>
                          <Clock className="w-3 h-3 mr-1" /> Menunggu Transfer
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 mr-1" /> Ditolak
                        </>
                      )}
                    </Badge>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 text-sm">
                  {/* Left: Roastery & Amount */}
                  <div className="md:col-span-6 space-y-2">
                    <div>
                      <span className="text-xs text-neutral-600">Nama Roastery / Penjual:</span>
                      <p className="font-semibold text-neutral-900 text-base">
                        {p.sellerName || "Mitra Roastery"}
                      </p>
                      {p.whatsappNumber && (
                        <p className="text-xs text-neutral-600 font-mono">
                          WA: {p.whatsappNumber}
                        </p>
                      )}
                    </div>

                    <div className="pt-2">
                      <span className="text-xs text-neutral-600">Nominal Penarikan:</span>
                      <p className="text-xl font-bold font-mono text-primary-900">
                        {formatRupiah(p.amount)}
                      </p>
                    </div>

                    {p.notes && (
                      <p className="text-xs text-neutral-600 bg-neutral-50 p-2 rounded border border-neutral-200">
                        <span className="font-medium">Catatan Penjual:</span> {p.notes}
                      </p>
                    )}
                  </div>

                  {/* Right: Bank Details & Action */}
                  <div className="md:col-span-6 space-y-3 border-t md:border-t-0 md:border-l md:border-neutral-200 md:pl-5 pt-3 md:pt-0">
                    <div className="p-3 bg-neutral-50 rounded border border-neutral-200 space-y-1 text-xs">
                      <span className="font-semibold text-neutral-700 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-primary-600" /> Rekening Tujuan:
                      </span>
                      <p className="font-mono font-bold text-neutral-900 text-sm">
                        Bank {p.bankName} - {p.bankAccountNumber}
                      </p>
                      <p className="text-neutral-700">
                        a.n. <span className="font-medium">{p.bankAccountHolder}</span>
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      {p.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            disabled={isProcessing}
                            onClick={() => handleUpdateStatus(p.id, "processed")}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-8"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            )}
                            Setujui & Tandai Ditransfer
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isProcessing}
                            onClick={() => handleUpdateStatus(p.id, "rejected")}
                            className="text-rose-600 hover:bg-rose-50 border-rose-200 text-xs h-8"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Tolak
                          </Button>
                        </>
                      )}

                      {p.status === "processed" && p.whatsappNumber && (
                        <a
                          href={buildPayoutDisbursedNotificationUrl({
                            sellerPhone: p.whatsappNumber,
                            sellerName: p.sellerName || "Mitra Roastery",
                            amount: p.amount,
                            bankName: p.bankName,
                            accountNumber: p.bankAccountNumber,
                            accountHolder: p.bankAccountHolder,
                            payoutId: p.id,
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          Kirim Bukti Transfer via WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
