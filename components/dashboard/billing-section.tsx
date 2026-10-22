"use client";

import { ListingWithRelations, Payment, Subscription } from "@/types";
import { formatRupiah } from "@/components/shared/price-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { FormField } from "@/components/shared/form-field";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { isActiveBoost } from "@/lib/boost";
import { BOOST_OPTIONS, boostOptionLabel } from "@/lib/plans";
import { useRouter } from "next/navigation";
import { purchaseBoostAction } from "@/actions/seller.actions";
import { syncPaymentStatusAction } from "@/actions/subscription.actions";
import { BoostCredits } from "@/lib/boost-credits";
import { formatWib } from "@/lib/format-date";
import { Loader2, RefreshCw } from "lucide-react";

interface BillingSectionProps {
  subscription?: Subscription;
  payments: Payment[];
  listings: ListingWithRelations[];
  credits: BoostCredits;
  className?: string;
}

const BOOST_DURATIONS = BOOST_OPTIONS.map((o) => ({
  value: o.value,
  label: boostOptionLabel(o),
  price: o.price,
}));

const PAYMENT_STATUS_MAP: Record<
  string,
  { label: string; variant: "default" | "outline" | "destructive" }
> = {
  paid: { label: "Lunas", variant: "default" },
  pending: { label: "Pending", variant: "outline" },
  failed: { label: "Gagal", variant: "destructive" },
};

const PAYMENT_TYPE_MAP: Record<string, string> = {
  subscription: "Langganan",
  boost: "Boost",
  verification: "Verifikasi",
};

export function BillingSection({
  payments,
  listings,
  credits,
  className,
}: BillingSectionProps) {
  const router = useRouter();
  const [boostDialogOpen, setBoostDialogOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");
  const [boostLoading, setBoostLoading] = useState(false);
  const [payWith, setPayWith] = useState<"credit" | "cash">("credit");
  const [syncingOrderId, setSyncingOrderId] = useState<string | null>(null);

  const handleSyncPayment = async (orderId: string) => {
    setSyncingOrderId(orderId);
    try {
      const res = await syncPaymentStatusAction(orderId);
      if (!res.success) {
        toast.error("Gagal memeriksa status", { description: res.error });
      } else {
        toast.success("Status pembayaran diperbarui", {
          description: res.data.message,
        });
        router.refresh();
      }
    } catch {
      // ignore: UI error toast already handled
      toast.error("Gagal memeriksa status pembayaran");
    } finally {
      setSyncingOrderId(null);
    }
  };

  const hasCredit = credits.remaining > 0;
  const useCredit = hasCredit && payWith === "credit";
  const duration = useCredit ? String(credits.days) : selectedDuration;
  const activeBoosts = listings.filter(isActiveBoost).length;
  const resetDate = formatWib(credits.resetsAt, "dayMonth");

  const handleBoost = async () => {
    if (!selectedListing || !duration) return;
    setBoostLoading(true);
    try {
      const result = await purchaseBoostAction({
        listingId: selectedListing,
        duration,
        useCredit,
      });
      if (!result.success) {
        toast.error("Boost gagal diproses", { description: result.error });
        return;
      }

      // If Midtrans Snap token was returned, open Midtrans popup
      if (result.data.snapToken && typeof window !== "undefined" && (window as unknown as { snap?: { pay: (token: string, options: unknown) => void } }).snap) {
        const snap = (window as unknown as { snap: { pay: (token: string, options: unknown) => void } }).snap;
        snap.pay(result.data.snapToken, {
          onSuccess: () => {
            toast.success("Pembayaran berhasil!");
            router.refresh();
          },
          onPending: () => {
            toast.info("Menunggu pembayaran diselesaikan.");
            router.refresh();
          },
          onError: () => {
            toast.error("Pembayaran gagal.");
          },
        });
      } else if (result.data.status === "paid") {
        toast.success("Promosi produk berhasil diaktifkan", {
          description:
            "Produk Anda akan tampil di posisi teratas pada hasil pencarian yang cocok.",
        });
      } else {
        toast.info("Menunggu pembayaran", {
          description: "Promosi aktif setelah pembayaran dikonfirmasi.",
        });
      }
      setBoostDialogOpen(false);
      setSelectedListing("");
      setSelectedDuration("");
      router.refresh();
    } catch {
      // ignore: UI error toast already handled
      toast.error("Boost gagal diproses", {
        description: "Terjadi kesalahan. Coba lagi.",
      });
    } finally {
      setBoostLoading(false);
    }
  };

  return (
    <div className={cn("space-y-10", className)}>
      {/* Boost / Promosi Produk */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-300">
          <div>
            <h3 className="font-display text-lg text-neutral-900 font-semibold">
              Promosi Produk
            </h3>
            {credits.total > 0 && (
              <p className="mt-0.5 text-xs text-neutral-600">
                Kredit promosi gratis bulan ini:{" "}
                <span className="font-mono tabular-nums font-medium">
                  {credits.remaining} dari {credits.total}
                </span>
                {credits.remaining === 0 && `, kembali ${resetDate}`}
              </p>
            )}
          </div>
          <Dialog open={boostDialogOpen} onOpenChange={setBoostDialogOpen}>
            <DialogTrigger
              render={
                <Button variant="primary" className="gap-2">
                  <span className="text-xs">Promosikan Produk</span>
                </Button>
              }
            />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Promosikan Produk</DialogTitle>
                <DialogDescription>
                  Tampilkan produk kopi Anda di posisi teratas pada hasil pencarian
                  pembeli.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <FormField label="Pilih Produk" required>
                  <Select
                    value={selectedListing}
                    onValueChange={(val) => setSelectedListing(val ?? "")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih produk untuk promosi">
                        {(val) =>
                          listings.find((l) => l.id === val)?.title ?? ""
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {listings
                        .filter(
                          (l) => l.status === "active" && !isActiveBoost(l),
                        )
                        .map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </FormField>
                {hasCredit && (
                  <RadioGroup
                    value={payWith}
                    onValueChange={(val) => setPayWith(val as "credit" | "cash")}
                    className="grid grid-cols-1 gap-2 py-1"
                  >
                    {[
                      [
                        "credit",
                        `Pakai kredit gratis (sisa ${credits.remaining}, ${credits.days} hari)`,
                      ],
                      ["cash", "Bayar langsung"],
                    ].map(([value, label]) => (
                      <label
                        key={value}
                        htmlFor={`boost-pay-${value}`}
                        className={cn(
                          "flex min-h-11 cursor-pointer items-center gap-3 border px-3 text-sm rounded-sm transition-colors",
                          payWith === value
                            ? "border-primary-600 bg-primary-50/40 text-primary-900"
                            : "border-neutral-300 hover:border-neutral-400 text-neutral-800"
                        )}
                      >
                        <RadioGroupItem
                          id={`boost-pay-${value}`}
                          value={value}
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </RadioGroup>
                )}
                {!useCredit && (
                  <FormField label="Durasi Promosi" required>
                    <Select
                      value={selectedDuration}
                      onValueChange={(val) => setSelectedDuration(val ?? "")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih durasi">
                          {(val) =>
                            BOOST_DURATIONS.find((d) => d.value === val)?.label ?? ""
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {BOOST_DURATIONS.map((d) => (
                          <SelectItem key={d.value} value={d.value}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                )}
                {activeBoosts > 0 && (
                  <p className="text-xs text-neutral-600">
                    Anda punya {activeBoosts} boost aktif. Di satu halaman hanya
                    satu listing Anda yang tampil sebagai iklan, jadi boost
                    tambahan bergantian dengan yang lain dan paling berguna saat
                    pembeli memfilter kategori atau asal yang berbeda.
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="primary"
                  onClick={handleBoost}
                  disabled={!selectedListing || !duration || boostLoading}
                >
                  {boostLoading
                    ? "Memproses..."
                    : useCredit
                      ? "Aktifkan dengan Kredit"
                      : "Bayar & Aktifkan"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Payment History */}
      <div className="space-y-3">
        <div className="pb-2 border-b border-neutral-300">
          <h3 className="font-display text-lg text-neutral-900 font-semibold">
            Riwayat Pembayaran
          </h3>
        </div>
        {payments.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="Belum Ada Transaksi"
              description="Riwayat pembayaran langganan dan promosi produk akan muncul di sini."
            />
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Order</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((pay) => {
                    const statusConf =
                      PAYMENT_STATUS_MAP[pay.status] ??
                      PAYMENT_STATUS_MAP.pending;
                    return (
                      <TableRow
                        key={pay.id}
                        className="font-medium text-neutral-800"
                      >
                        <TableCell className="font-mono text-xs text-neutral-700">
                          {pay.midtransOrderId}
                        </TableCell>
                        <TableCell>
                          {PAYMENT_TYPE_MAP[pay.type] ?? pay.type}
                        </TableCell>
                        <TableCell className="font-mono tabular-nums font-medium text-primary-900">
                          {formatRupiah(pay.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={statusConf.variant}
                            className="text-xs"
                          >
                            {statusConf.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-neutral-500 font-mono text-xs">
                          {pay.paidAt
                            ? format(new Date(pay.paidAt), "d MMM yyyy", {
                                locale: idLocale,
                              })
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {pay.status === "pending" && pay.midtransOrderId ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1 px-2"
                              disabled={syncingOrderId === pay.midtransOrderId}
                              onClick={() => handleSyncPayment(pay.midtransOrderId)}
                            >
                              {syncingOrderId === pay.midtransOrderId ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <RefreshCw className="h-3 w-3" />
                              )}
                              Cek Status
                            </Button>
                          ) : (
                            <span className="text-xs text-neutral-400">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="md:hidden divide-y divide-neutral-200 border border-neutral-300 rounded-sm">
              {payments.map((pay) => {
                const statusConf =
                  PAYMENT_STATUS_MAP[pay.status] ?? PAYMENT_STATUS_MAP.pending;
                return (
                  <div key={pay.id} className="p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">
                        {PAYMENT_TYPE_MAP[pay.type] ?? pay.type}
                      </span>
                      <Badge variant={statusConf.variant} className="text-xs">
                        {statusConf.label}
                      </Badge>
                    </div>
                    <p className="font-mono tabular-nums font-medium text-primary-900 text-sm">
                      {formatRupiah(pay.amount)}
                    </p>
                    <p className="text-[11px] text-neutral-500 font-mono">
                      {pay.paidAt
                        ? format(new Date(pay.paidAt), "d MMM yyyy HH:mm", {
                            locale: idLocale,
                          })
                        : pay.midtransOrderId}
                    </p>
                    {pay.status === "pending" && pay.midtransOrderId && (
                      <div className="pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1 px-2 w-full"
                          disabled={syncingOrderId === pay.midtransOrderId}
                          onClick={() => handleSyncPayment(pay.midtransOrderId)}
                        >
                          {syncingOrderId === pay.midtransOrderId ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3" />
                          )}
                          Cek Status Midtrans
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
