"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatRupiah } from "@/components/shared/price-text";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Wallet,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  ExternalLink,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { requestPayoutAction, toggleSellerAutoPayoutAction } from "@/actions/payout.actions";
import { toast } from "sonner";
import type { PayoutRequest } from "@/types";
import type { SellerBankDetails } from "@/lib/data/payouts";

interface SellerPayoutManagerProps {
  balanceSummary: {
    availableBalance: number;
    pendingBalance: number;
    totalWithdrawn?: number;
    totalEarned?: number;
    completedOrdersCount?: number;
  };
  bankDetails: SellerBankDetails | null;
  payouts: PayoutRequest[];
  initialAutoPayout?: boolean;
}

export function SellerPayoutManager({
  balanceSummary,
  bankDetails,
  payouts,
  initialAutoPayout = false,
}: SellerPayoutManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [autoPayout, setAutoPayout] = useState(initialAutoPayout);

  // Request payout dialog state
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [amount, setAmount] = useState(balanceSummary.availableBalance > 0 ? String(balanceSummary.availableBalance) : "");
  const [notes, setNotes] = useState("");
  const [requestError, setRequestError] = useState<string | null>(null);

  const handleToggleAutoPayout = (newVal: boolean) => {
    startTransition(async () => {
      const res = await toggleSellerAutoPayoutAction(newVal);
      if (res.success) {
        setAutoPayout(newVal);
        toast.success(
          `Auto-payout mingguan berhasil ${newVal ? "diaktifkan" : "dinonaktifkan"}`
        );
      } else {
        toast.error("Gagal mengubah pengaturan auto-payout", {
          description: res.error,
        });
      }
    });
  };

  const handleRequestPayout = (e: React.FormEvent) => {
    e.preventDefault();
    setRequestError(null);
    const numAmount = Number(amount);

    if (isNaN(numAmount) || numAmount < 10000) {
      setRequestError("Minimal penarikan dana adalah Rp 10.000");
      return;
    }

    if (numAmount > balanceSummary.availableBalance) {
      setRequestError("Jumlah penarikan melebihi saldo tersedia");
      return;
    }

    startTransition(async () => {
      const res = await requestPayoutAction({
        amount: numAmount,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        toast.success("Pengajuan penarikan dana berhasil dikirim.");
        setShowRequestDialog(false);
        router.refresh();
      } else {
        setRequestError(res.error || "Gagal mengajukan penarikan dana");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Saldo & KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-xl border-emerald-300 bg-emerald-50/50">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-800">Saldo Siap Ditarik</p>
              <p className="text-2xl font-bold font-mono text-emerald-950 mt-1">
                {formatRupiah(balanceSummary.availableBalance)}
              </p>
              <p className="text-xs text-emerald-700 mt-1">
                {balanceSummary.totalEarned ? `Total pendapatan: ${formatRupiah(balanceSummary.totalEarned)}` : "Dari pesanan selesai"}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-amber-300 bg-amber-50/50">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-800">Saldo Tertahan</p>
              <p className="text-2xl font-bold font-mono text-amber-950 mt-1">
                {formatRupiah(balanceSummary.pendingBalance)}
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Pesanan dalam proses pengiriman
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-neutral-300 bg-white">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div>
              <p className="text-xs font-medium text-neutral-600">Rekening Tujuan</p>
              {bankDetails && bankDetails.bankAccountNumber ? (
                <div className="mt-1">
                  <p className="text-sm font-semibold text-neutral-900">
                    {bankDetails.bankName} - {bankDetails.bankAccountNumber}
                  </p>
                  <p className="text-xs text-neutral-600 mt-0.5 truncate">
                    a.n. {bankDetails.bankAccountHolder}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-red-600 font-medium mt-1">
                  Belum ada rekening terdaftar
                </p>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-neutral-100 mt-2">
              <Link
                href="/dashboard/profile"
                className="text-xs text-primary-700 hover:text-primary-900 font-semibold underline"
              >
                Ubah Rekening →
              </Link>

              <Button
                size="sm"
                disabled={
                  isPending ||
                  balanceSummary.availableBalance < 10000 ||
                  !bankDetails?.bankAccountNumber
                }
                onClick={() => setShowRequestDialog(true)}
                className="text-xs gap-1"
              >
                Tarik Saldo <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auto-Payout Setting Card */}
      <Card className="border border-neutral-300 rounded-xl bg-white shadow-2xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base text-neutral-900 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-primary-700" />
                Pencairan Otomatis Mingguan (Auto-Payout)
              </CardTitle>
              <CardDescription className="text-xs text-neutral-600 mt-0.5">
                Bila aktif, seluruh saldo siap ditarik akan otomatis dimasukkan ke batch transfer mingguan tanpa biaya admin.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-neutral-700">
                {autoPayout ? "Aktif" : "Nonaktif"}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={autoPayout}
                disabled={isPending}
                onClick={() => handleToggleAutoPayout(!autoPayout)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 ${
                  autoPayout ? "bg-primary-800" : "bg-neutral-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    autoPayout ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Riwayat Penarikan Dana */}
      <Card className="border border-neutral-300 rounded-xl bg-white shadow-2xs overflow-hidden">
        <CardHeader className="border-b border-neutral-200 pb-4">
          <CardTitle className="text-base text-neutral-900">
            Riwayat Pencairan Dana
          </CardTitle>
          <CardDescription className="text-xs text-neutral-600">
            Daftar pengajuan penarikan dana penjualan ke rekening bank Anda.
          </CardDescription>
        </CardHeader>

        {payouts.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-600">
            Belum ada riwayat pengajuan penarikan dana.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">ID & Tanggal</TableHead>
                  <TableHead className="text-xs">Jumlah</TableHead>
                  <TableHead className="text-xs">Rekening Tujuan</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Bukti Transfer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs">
                      <p className="font-mono text-neutral-900">{p.id.slice(0, 12)}</p>
                      <p className="text-neutral-600 mt-0.5">
                        {new Date(p.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs font-mono font-bold text-neutral-900">
                      {formatRupiah(p.amount)}
                    </TableCell>
                    <TableCell className="text-xs">
                      <p className="font-semibold text-neutral-800">{p.bankName}</p>
                      <p className="text-neutral-600">{p.bankAccountNumber}</p>
                    </TableCell>
                    <TableCell className="text-xs">
                      {p.status === "processed" && (
                        <Badge variant="default" className="text-xs bg-emerald-600 gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Berhasil
                        </Badge>
                      )}
                      {p.status === "pending" && (
                        <Badge variant="secondary" className="text-xs text-amber-800 bg-amber-100 gap-1">
                          <Clock className="w-3 h-3" /> Diproses
                        </Badge>
                      )}
                      {p.status === "rejected" && (
                        <Badge variant="destructive" className="text-xs gap-1">
                          <XCircle className="w-3 h-3" /> Ditolak
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {p.proofUrl ? (
                        <a
                          href={p.proofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary-700 hover:text-primary-900 underline font-medium"
                        >
                          Lihat Bukti <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-neutral-400">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Dialog Ajukan Penarikan Dana */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base text-neutral-900">
              Ajukan Penarikan Saldo
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-600">
              Dana akan ditransfer ke rekening {bankDetails?.bankName} ({bankDetails?.bankAccountNumber}) a.n. {bankDetails?.bankAccountHolder}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRequestPayout} className="space-y-4 pt-2">
            {requestError && (
              <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{requestError}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-neutral-800 block mb-1">
                Jumlah Penarikan (Rp)
              </label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="10000"
                min={10000}
                max={balanceSummary.availableBalance}
                required
              />
              <p className="text-xs text-neutral-600 mt-1">
                Maksimal: {formatRupiah(balanceSummary.availableBalance)}
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-800 block mb-1">
                Catatan (Opsional)
              </label>
              <Input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan transfer..."
                maxLength={200}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowRequestDialog(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className="text-xs"
              >
                {isPending ? "Mengajukan..." : "Konfirmasi Tarik Dana"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
