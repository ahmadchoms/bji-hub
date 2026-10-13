import { SectionHeader } from "@/components/shared/section-header";
import { formatRupiah } from "@/components/shared/price-text";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { getAdminStats, getSellers } from "@/lib/data";
import { getAllOrders } from "@/lib/data/orders";
import { paymentTypeLabel } from "@/lib/payments";
import { AdminOrderDisputes } from "@/components/admin/admin-order-disputes";
import { ExportCsvButton, type CsvColumn } from "@/components/shared/export-csv-button";
import type { Payment } from "@/types";

const PAYMENT_STATUS_MAP: Record<
  string,
  { label: string; variant: "default" | "outline" | "destructive" }
> = {
  paid: { label: "Lunas", variant: "default" },
  pending: { label: "Pending", variant: "outline" },
  failed: { label: "Gagal", variant: "destructive" },
};

export default async function AdminTransaksiPage() {
  const [stats, sellers, orders] = await Promise.all([
    getAdminStats(),
    getSellers(),
    getAllOrders(),
  ]);
  const payments = stats.recentPayments;

  const sellerMap = Object.fromEntries(
    sellers.map((s) => [s.id, s.businessName]),
  );

  const totalRevenue = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const paymentCsvColumns: CsvColumn<Payment>[] = [
    { key: "midtransOrderId", label: "ID Order Midtrans" },
    {
      key: "sellerId",
      label: "Seller",
      format: (val) => (typeof val === "string" ? sellerMap[val] ?? val : String(val ?? "-")),
    },
    { key: "amount", label: "Nominal (IDR)" },
    { key: "status", label: "Status" },
    {
      key: "paidAt",
      label: "Tanggal Lunas",
      format: (val) =>
        typeof val === "string"
          ? format(new Date(val), "yyyy-MM-dd HH:mm", { locale: idLocale })
          : "-",
    },
  ];

  return (
    <div className="space-y-8">
      {/* 1. Marketplace Orders & Disputed Escrow Section */}
      <div className="space-y-4">
        <SectionHeader
          title="Pesanan & Komplain Escrow"
          subtitle={`${orders.length} pesanan marketplace terdaftar di sistem Biji Hub.`}
        />
        <AdminOrderDisputes orders={orders} />
      </div>

      {/* 2. Gateway Payments Section */}
      <div className="space-y-4 pt-6 border-t border-neutral-300">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHeader
            title="Riwayat Pembayaran Gateway (Midtrans)"
            subtitle={`${payments.length} transaksi · Total: ${formatRupiah(totalRevenue)}`}
          />
          <ExportCsvButton
            data={payments}
            filename={`laporan-gateway-midtrans-${format(new Date(), "yyyyMMdd")}`}
            columns={paymentCsvColumns}
            label="Ekspor CSV Gateway"
          />
        </div>

        {payments.length === 0 ? (
          <EmptyState
            title="Belum Ada Transaksi"
            description="Riwayat pembayaran platform akan muncul di sini."
          />
        ) : (
          <>
            <div className="hidden md:block border border-neutral-300 bg-surface-base rounded-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Order</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((pay) => {
                    const statusConf =
                      PAYMENT_STATUS_MAP[pay.status] ??
                      PAYMENT_STATUS_MAP.pending;
                    return (
                      <TableRow key={pay.id}>
                        <TableCell className="font-mono text-xs text-neutral-700">
                          {pay.midtransOrderId}
                        </TableCell>
                        <TableCell className="text-neutral-700 text-sm">
                          {sellerMap[pay.sellerId] ?? pay.sellerId}
                        </TableCell>
                        <TableCell>{paymentTypeLabel(pay)}</TableCell>
                        <TableCell className="font-mono tabular-nums font-medium text-primary-900">
                          {formatRupiah(pay.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusConf.variant} className="text-xs">
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
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="md:hidden space-y-3">
              {payments.map((pay) => {
                const statusConf =
                  PAYMENT_STATUS_MAP[pay.status] ?? PAYMENT_STATUS_MAP.pending;
                return (
                  <div
                    key={pay.id}
                    className="border border-neutral-300 bg-surface-base rounded-sm p-4"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">
                        {paymentTypeLabel(pay)}
                      </span>
                      <Badge variant={statusConf.variant} className="text-xs">
                        {statusConf.label}
                      </Badge>
                    </div>
                    <p className="font-mono tabular-nums font-medium text-primary-900 text-sm">
                      {formatRupiah(pay.amount)}
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      {sellerMap[pay.sellerId] ?? pay.sellerId}
                    </p>
                    <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
                      {pay.paidAt
                        ? format(new Date(pay.paidAt), "d MMM yyyy HH:mm", {
                            locale: idLocale,
                          })
                        : pay.midtransOrderId}
                    </p>
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
