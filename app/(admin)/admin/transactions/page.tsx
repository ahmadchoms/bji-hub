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
import { paymentTypeLabel } from "@/lib/payments";

const PAYMENT_STATUS_MAP: Record<
  string,
  { label: string; variant: "default" | "outline" | "destructive" }
> = {
  paid: { label: "Lunas", variant: "default" },
  pending: { label: "Pending", variant: "outline" },
  failed: { label: "Gagal", variant: "destructive" },
};

export default async function AdminTransaksiPage() {
  const [stats, sellers] = await Promise.all([getAdminStats(), getSellers()]);
  const payments = stats.recentPayments;

  const sellerMap = Object.fromEntries(
    sellers.map((s) => [s.id, s.businessName]),
  );

  const totalRevenue = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Riwayat Transaksi"
        subtitle={`${payments.length} transaksi · Total: ${formatRupiah(totalRevenue)}`}
      />

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
  );
}
