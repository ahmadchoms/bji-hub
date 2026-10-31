"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/components/shared/price-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  updatePayoutStatusAction,
  exportPayoutBatchCsvAction,
  runAutoPayoutSweepAction,
} from "@/actions/payout.actions";
import { buildPayoutDisbursedNotificationUrl } from "@/lib/notifications";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { PayoutRequest } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  MessageCircle,
  Loader2,
  Download,
  Play,
  FileCheck2,
  ExternalLink,
} from "lucide-react";

interface AdminPayoutListProps {
  payouts: (PayoutRequest & { sellerName?: string; whatsappNumber?: string })[];
}

export function AdminPayoutList({ payouts }: AdminPayoutListProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("all");
  const [isPending, startTransition] = useTransition();
  const [isExporting, setIsExporting] = useState(false);
  const [isSweeping, setIsSweeping] = useState(false);

  // Approval Modal State (Proof URL required for processed status - C4)
  const [approvingPayout, setApprovingPayout] = useState<
    (PayoutRequest & { sellerName?: string; whatsappNumber?: string }) | null
  >(null);
  const [proofUrl, setProofUrl] = useState("");
  const [approvalNotes, setApprovalNotes] = useState("");

  const filteredPayouts = payouts.filter((p) => {
    if (filter === "all") return true;
    return p.status === filter;
  });

  const handleOpenApproveDialog = (
    payout: PayoutRequest & { sellerName?: string; whatsappNumber?: string },
  ) => {
    setApprovingPayout(payout);
    setProofUrl("");
    setApprovalNotes("");
  };

  const handleConfirmApproval = () => {
    if (!approvingPayout) return;
    if (!proofUrl.trim()) {
      toast.error("Bukti transfer (URL) wajib diisi sebelum menyetujui pencairan");
      return;
    }

    startTransition(async () => {
      const res = await updatePayoutStatusAction({
        payoutId: approvingPayout.id,
        status: "processed",
        proofUrl: proofUrl.trim(),
        notes: approvalNotes.trim() || undefined,
      });

      if (res.success) {
        toast.success("Pencairan dana berhasil disetujui & bukti transfer disimpan.");
        setApprovingPayout(null);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal memperbarui status pengajuan");
      }
    });
  };

  const handleRejectPayout = (payoutId: string) => {
    startTransition(async () => {
      const res = await updatePayoutStatusAction({ payoutId, status: "rejected" });
      if (res.success) {
        toast.success("Pengajuan pencairan dana berhasil ditolak.");
        router.refresh();
      } else {
        toast.error(res.error || "Gagal memperbarui status pengajuan");
      }
    });
  };

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const res = await exportPayoutBatchCsvAction();
      if (!res.success) {
        toast.error(res.error || "Gagal mengekspor data batch payout");
        return;
      }

      const blob = new Blob([res.data.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `payouts_mass_transfer_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Berhasil mengunduh CSV untuk ${res.data.count} pengajuan payout`);
    } catch {
      toast.error("Terjadi galat saat mengunduh CSV");
    } finally {
      setIsExporting(false);
    }
  };

  const handleRunAutoSweep = async () => {
    try {
      setIsSweeping(true);
      const res = await runAutoPayoutSweepAction();
      if (!res.success) {
        toast.error(res.error || "Gagal menjalankan sapuan auto-payout");
        return;
      }
      toast.success(
        `Sapuan selesai: ${res.data.createdPayouts} payout dibuat untuk ${res.data.processedSellers} toko penjual (Total: Rp ${res.data.totalAmount.toLocaleString("id-ID")})`,
      );
      router.refresh();
    } catch {
      toast.error("Gagal menjalankan sapuan auto payout");
    } finally {
      setIsSweeping(false);
    }
  };

  const pendingCount = payouts.filter((p) => p.status === "pending").length;
  const processedCount = payouts.filter((p) => p.status === "processed").length;
  const rejectedCount = payouts.filter((p) => p.status === "rejected").length;

  return (
    <div className="space-y-6">
      {/* C4 Batch Operations Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={isExporting}
            className="text-xs font-semibold gap-1.5 h-8 bg-white"
          >
            {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-primary-600" />}
            Ekspor CSV Transfer Bank
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRunAutoSweep}
            disabled={isSweeping}
            className="text-xs font-semibold gap-1.5 h-8 bg-white"
          >
            {isSweeping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 text-amber-600" />}
            Sapuan Auto-Payout Mingguan
          </Button>
        </div>

        <span className="text-xs text-neutral-600 font-mono">
          Enkripsi Rekening Aktif (AES-256-GCM)
        </span>
      </div>

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
                            onClick={() => handleOpenApproveDialog(p)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-8"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Setujui & Unggah Bukti
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isProcessing}
                            onClick={() => handleRejectPayout(p.id)}
                            className="text-rose-600 hover:bg-rose-50 border-rose-200 text-xs h-8"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Tolak
                          </Button>
                        </>
                      )}

                      {p.status === "processed" && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {p.proofUrl && (
                            <a
                              href={p.proofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold hover:bg-blue-100 transition-colors"
                            >
                              <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
                              Lihat Bukti Transfer
                              <ExternalLink className="w-3 h-3 text-blue-400" />
                            </a>
                          )}
                          {p.whatsappNumber && (
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
                              Kirim via WA
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Proof Upload / Approval Dialog */}
      <Dialog open={!!approvingPayout} onOpenChange={(open) => !open && setApprovingPayout(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Transfer & Bukti Pembayaran</DialogTitle>
            <DialogDescription>
              Sebelum menandai pengajuan pencairan dana sebagai selesai, Anda wajib menyertakan URL bukti transfer bank resmi (C4).
            </DialogDescription>
          </DialogHeader>

          {approvingPayout && (
            <div className="space-y-4 py-2 text-xs">
              <div className="p-3 bg-neutral-50 rounded border border-neutral-200 space-y-1">
                <p>
                  <strong>Penerima:</strong> {approvingPayout.sellerName}
                </p>
                <p>
                  <strong>Bank:</strong> {approvingPayout.bankName} - {approvingPayout.bankAccountNumber}
                </p>
                <p>
                  <strong>Pemilik Rekening:</strong> {approvingPayout.bankAccountHolder}
                </p>
                <p>
                  <strong>Nominal:</strong> {formatRupiah(approvingPayout.amount)}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-800 block">
                  URL Bukti Transfer (Wajib) *
                </label>
                <input
                  type="url"
                  placeholder="https://.../bukti-transfer.pdf atau link bucket"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-800 block">
                  Catatan Transaksi / Referensi Bank (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Catatan transaksi atau nomor referensi transfer bank"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setApprovingPayout(null)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmApproval}
              disabled={isPending || !proofUrl.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
            >
              {isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              )}
              Konfirmasi Selesai Ditransfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
