import { SectionHeader } from "@/components/shared/section-header";
import { formatRupiah } from "@/components/shared/price-text";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { getAdminStats } from "@/lib/data";
import { StatList } from "@/components/dashboard/stat-list";
import { EmptyState } from "@/components/shared/empty-state";

const PAYMENT_STATUS_MAP: Record<
  string,
  { label: string; variant: "default" | "outline" | "destructive" }
> = {
  paid: { label: "Lunas", variant: "default" },
  pending: { label: "Pending", variant: "outline" },
  failed: { label: "Gagal", variant: "destructive" },
};

export default async function AdminOverviewPage() {
  const stats = await getAdminStats();

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Admin Panel"
        subtitle="Pantau platform, verifikasi seller, dan kelola listing."
      />

      <StatList
        items={[
          { label: "Total Seller", value: String(stats.totalSellers) },
          { label: "Total Listing", value: String(stats.totalListings) },
          {
            label: "Menunggu Verifikasi",
            value: String(stats.pendingVerifications),
            hint:
              stats.pendingVerifications > 0
                ? "Perlu ditindaklanjuti"
                : undefined,
          },
          {
            label: "Total Pendapatan",
            value: formatRupiah(stats.monthlyRevenue),
          },
        ]}
      />

      {/* Recent Transactions Table */}
      <div className="space-y-3">
        <div className="pb-2 border-b border-neutral-300">
          <h3 className="font-display text-lg text-neutral-900 font-semibold">
            Transaksi Terbaru
          </h3>
        </div>
        {stats.recentPayments.length === 0 ? (
          <EmptyState
            title="Belum Ada Transaksi"
            description="Riwayat pembayaran platform akan muncul di sini."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Order</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.recentPayments.map((pay) => {
                const statusConf =
                  PAYMENT_STATUS_MAP[pay.status] ?? PAYMENT_STATUS_MAP.pending;
                return (
                  <TableRow key={pay.id}>
                    <TableCell className="font-mono text-xs text-neutral-700">
                      {pay.midtransOrderId}
                    </TableCell>
                    <TableCell className="capitalize">{pay.type}</TableCell>
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
        )}
      </div>
    </div>
  );
}
