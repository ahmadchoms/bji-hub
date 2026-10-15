"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/components/shared/price-text";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { updateSellerBankAction, requestPayoutAction } from "@/actions/payout.actions";
import { ExportCsvButton } from "@/components/shared/export-csv-button";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { PayoutRequest } from "@/types";
import type { SellerBankDetails } from "@/lib/data/payouts";
import {
  Wallet,
  ShieldCheck,
  Building2,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Loader2,
} from "lucide-react";

interface SellerFinanceSectionProps {
  balanceSummary: {
    availableBalance: number;
    pendingBalance: number;
    totalWithdrawn: number;
    totalEarned: number;
  };
  bankDetails: SellerBankDetails | null;
  payoutHistory: PayoutRequest[];
}

export function SellerFinanceSection({
  balanceSummary,
  bankDetails: initialBankDetails,
  payoutHistory,
}: SellerFinanceSectionProps) {
  const router = useRouter();
  const [bank, setBank] = useState<SellerBankDetails | null>(initialBankDetails);
  const [isEditingBank, setIsEditingBank] = useState(!initialBankDetails?.bankAccountNumber);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);

  // Bank form state
  const [bankName, setBankName] = useState(initialBankDetails?.bankName || "BCA");
  const [accountNumber, setAccountNumber] = useState(initialBankDetails?.bankAccountNumber || "");
  const [accountHolder, setAccountHolder] = useState(initialBankDetails?.bankAccountHolder || "");

  // Payout form state
  const [withdrawAmount, setWithdrawAmount] = useState(
    balanceSummary.availableBalance > 0 ? balanceSummary.availableBalance.toString() : "",
  );
  const [withdrawNotes, setWithdrawNotes] = useState("");

  const [isBankPending, startBankTransition] = useTransition();
  const [isPayoutPending, startPayoutTransition] = useTransition();

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName || !accountNumber || !accountHolder) {
      toast.error("Semua kolom rekening bank wajib diisi");
      return;
    }

    startBankTransition(async () => {
      const res = await updateSellerBankAction({
        bankName,
        bankAccountNumber: accountNumber,
        bankAccountHolder: accountHolder,
      });

      if (res.success) {
        setBank(res.data);
        setIsEditingBank(false);
        toast.success("Informasi rekening bank berhasil disimpan!");
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menyimpan rekening bank");
      }
    });
  };

  const handleRequestPayout = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseInt(withdrawAmount.replace(/[^0-9]/g, ""), 10);

    if (isNaN(amountNum) || amountNum < 10000) {
      toast.error("Minimal penarikan dana adalah Rp 10.000");
      return;
    }

    if (amountNum > balanceSummary.availableBalance) {
      toast.error("Nominal melebihi saldo yang siap ditarik");
      return;
    }

    if (!bank || !bank.bankAccountNumber) {
      toast.error("Mohon lengkapi rekening bank tujuan terlebih dahulu");
      setIsEditingBank(true);
      return;
    }

    startPayoutTransition(async () => {
      const res = await requestPayoutAction({
        amount: amountNum,
        notes: withdrawNotes,
      });

      if (res.success) {
        toast.success(
          `Pengajuan penarikan dana sebesar ${formatRupiah(amountNum)} berhasil dibuat! Tim Biji Hub akan memproses transfer dalam 1x24 jam kerja.`,
        );
        setShowWithdrawForm(false);
        setWithdrawNotes("");
        router.refresh();
      } else {
        toast.error(res.error || "Gagal mengajukan penarikan dana");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Saldo KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Saldo Siap Ditarik */}
        <Card className="rounded-lg border-emerald-300 bg-gradient-to-br from-emerald-50/50 to-white shadow-xs">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-emerald-600" /> Saldo Siap Ditarik
              </span>
              <Badge variant="outline" className="text-[10px] bg-emerald-100 text-emerald-800 border-emerald-300">
                Bisa Dicairkan
              </Badge>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-emerald-950">
                {formatRupiah(balanceSummary.availableBalance)}
              </p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Dari pesanan yang sudah dikonfirmasi selesai oleh pembeli.
              </p>
            </div>
            <div className="pt-2 border-t border-emerald-100">
              <Button
                size="sm"
                disabled={balanceSummary.availableBalance < 10000}
                onClick={() => setShowWithdrawForm(true)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-8 gap-1.5"
              >
                <ArrowUpRight className="w-3.5 h-3.5" /> Tarik Dana ke Rekening
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Saldo Tertunda (Pesanan Berjalan) */}
        <Card className="rounded-lg border-blue-200 bg-blue-50/30 shadow-xs">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" /> Saldo Tertunda (Pesanan Berjalan)
              </span>
              <Badge variant="outline" className="text-[10px] bg-blue-100 text-blue-800 border-blue-300">
                Pesanan Berjalan
              </Badge>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-blue-950">
                {formatRupiah(balanceSummary.pendingBalance)}
              </p>
              <p className="text-[11px] text-blue-700 mt-0.5">
                Menunggu pengiriman tiba & konfirmasi penerimaan dari pembeli.
              </p>
            </div>
            <div className="pt-2 border-t border-blue-100 text-[11px] text-blue-600 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Cair otomatis setelah status resi selesai
            </div>
          </CardContent>
        </Card>

        {/* Total Telah Dicairkan */}
        <Card className="rounded-lg border-neutral-300 bg-white shadow-xs">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-neutral-500" /> Total Penarikan
              </span>
              <Badge variant="outline" className="text-[10px] text-neutral-600 border-neutral-300">
                Riwayat
              </Badge>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-neutral-800">
                {formatRupiah(balanceSummary.totalWithdrawn)}
              </p>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Total akumulasi dana yang telah ditarik ke rekening Anda.
              </p>
            </div>
            <div className="pt-2 border-t border-neutral-100 text-[11px] text-neutral-500">
              Total omzet selesai: {formatRupiah(balanceSummary.totalEarned)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form Penarikan Dana (Expanded when clicked) */}
      {showWithdrawForm && (
        <Card className="border-emerald-300 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-neutral-900 flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-emerald-600" /> Pengajuan Penarikan Dana
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowWithdrawForm(false)}
                className="text-xs text-neutral-500 h-7"
              >
                Tutup
              </Button>
            </div>
            <CardDescription className="text-xs text-neutral-600">
              Dana akan ditransfer oleh Biji Hub ke rekening bank terdaftar dalam waktu maksimal 1x24 jam kerja (tanpa potongan biaya admin).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bank?.bankAccountNumber ? (
              <form onSubmit={handleRequestPayout} className="space-y-4">
                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded text-xs space-y-1">
                  <span className="text-neutral-500 font-medium">Rekening Tujuan Penarikan:</span>
                  <p className="font-semibold text-neutral-900">
                    Bank {bank.bankName} - {bank.bankAccountNumber}
                  </p>
                  <p className="text-neutral-600">a.n. {bank.bankAccountHolder}</p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-medium text-neutral-700">Nominal Penarikan (Rp)</label>
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(balanceSummary.availableBalance.toString())}
                      className="text-primary-600 hover:underline font-semibold"
                    >
                      Tarik Semua ({formatRupiah(balanceSummary.availableBalance)})
                    </button>
                  </div>
                  <Input
                    type="number"
                    min={10000}
                    max={balanceSummary.availableBalance}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Contoh: 500000"
                    className="font-mono text-sm"
                    required
                  />
                  <p className="text-[11px] text-neutral-500">
                    Minimal penarikan Rp 10.000. Tersedia: {formatRupiah(balanceSummary.availableBalance)}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-700">Catatan (Opsional)</label>
                  <Input
                    type="text"
                    value={withdrawNotes}
                    onChange={(e) => setWithdrawNotes(e.target.value)}
                    placeholder="Contoh: Penarikan batch penjualan minggu ke-2"
                    className="text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowWithdrawForm(false)}
                    className="text-xs"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPayoutPending}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                  >
                    {isPayoutPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Memproses...
                      </>
                    ) : (
                      "Kirim Pengajuan Penarikan"
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-center py-4 space-y-3">
                <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                <p className="text-xs text-neutral-700">
                  Anda belum mengisi informasi rekening bank tujuan. Silakan lengkapi rekening di kartu sebelah kanan sebelum menarik dana.
                </p>
                <Button
                  size="sm"
                  onClick={() => {
                    setShowWithdrawForm(false);
                    setIsEditingBank(true);
                  }}
                  className="text-xs"
                >
                  Lengkapi Rekening Bank Sekarang
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rekening Bank Penjual Card */}
      <Card className="border-neutral-300 bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base text-neutral-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary-600" /> Rekening Bank Penjual
              </CardTitle>
              <CardDescription className="text-xs text-neutral-500">
                Rekening tujuan pengiriman dana hasil penjualan biji kopi Anda.
              </CardDescription>
            </div>
            {bank?.bankAccountNumber && !isEditingBank && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingBank(true)}
                className="text-xs gap-1 h-7 text-neutral-700"
              >
                <Edit2 className="w-3 h-3" /> Ubah Rekening
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditingBank ? (
            <form onSubmit={handleSaveBank} className="space-y-4 max-w-md">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-700">Nama Bank</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full text-xs h-9 rounded-sm border border-neutral-300 px-3 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                  required
                >
                  <option value="BCA">Bank Central Asia (BCA)</option>
                  <option value="Mandiri">Bank Mandiri</option>
                  <option value="BRI">Bank Rakyat Indonesia (BRI)</option>
                  <option value="BNI">Bank Negara Indonesia (BNI)</option>
                  <option value="BSI">Bank Syariah Indonesia (BSI)</option>
                  <option value="CIMB Niaga">CIMB Niaga</option>
                  <option value="Permata">Bank Permata</option>
                  <option value="Jago">Bank Jago</option>
                  <option value="SeaBank">SeaBank</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-700">Nomor Rekening</label>
                <Input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Contoh: 8271039841"
                  className="font-mono text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-700">Nama Pemilik Rekening</label>
                <Input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="Contoh: Akbar Hakim (sesuai buku tabungan)"
                  className="text-xs"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  type="submit"
                  size="sm"
                  disabled={isBankPending}
                  className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium"
                >
                  {isBankPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Menyimpan...
                    </>
                  ) : (
                    "Simpan Data Rekening"
                  )}
                </Button>
                {bank?.bankAccountNumber && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingBank(false)}
                    className="text-xs"
                  >
                    Batal
                  </Button>
                )}
              </div>
            </form>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-800 flex items-center justify-center font-bold text-xs shrink-0">
                  {bank?.bankName?.substring(0, 3).toUpperCase() || "BANK"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">
                    Bank {bank?.bankName} &bull; <span className="font-mono">{bank?.bankAccountNumber}</span>
                  </p>
                  <p className="text-xs text-neutral-500">
                    a.n. <span className="font-medium text-neutral-800">{bank?.bankAccountHolder}</span>
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="w-fit text-emerald-800 bg-emerald-50 border-emerald-300 text-[11px]">
                <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Siap Terima Pencairan
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Riwayat Pengajuan Pencairan Dana */}
      {payoutHistory.length > 0 && (
        <Card className="border-neutral-300 bg-white">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm text-neutral-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-neutral-500" /> Riwayat Pengajuan Penarikan Dana
            </CardTitle>
            <ExportCsvButton
              data={payoutHistory}
              filename={`riwayat-pencairan-dana-${format(new Date(), "yyyyMMdd")}`}
              columns={[
                { key: "id", label: "ID Pengajuan" },
                {
                  key: "createdAt",
                  label: "Tanggal Pengajuan",
                  format: (val) =>
                    val ? format(new Date(val), "yyyy-MM-dd HH:mm", { locale: idLocale }) : "",
                },
                { key: "amount", label: "Nominal Pencairan (IDR)" },
                { key: "bankName", label: "Bank Tujuan" },
                { key: "bankAccountNumber", label: "Nomor Rekening" },
                { key: "bankAccountHolder", label: "Nama Pemilik Rekening" },
                { key: "status", label: "Status" },
                { key: "notes", label: "Catatan", format: (val) => val || "-" },
              ]}
              label="Ekspor CSV"
              size="sm"
            />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {payoutHistory.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 border border-neutral-200 rounded text-xs bg-white"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-neutral-900">
                        {formatRupiah(p.amount)}
                      </span>
                      <span className="text-neutral-400">&bull;</span>
                      <span className="text-neutral-600 font-medium">
                        Bank {p.bankName} ({p.bankAccountNumber})
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 font-mono">
                      {format(new Date(p.createdAt), "d MMM yyyy, HH:mm", {
                        locale: idLocale,
                      })}
                      {p.notes && ` • "${p.notes}"`}
                    </p>
                  </div>
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
                    {p.status === "processed"
                      ? "Berhasil Ditransfer"
                      : p.status === "pending"
                        ? "Sedang Diproses"
                        : "Ditolak"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
