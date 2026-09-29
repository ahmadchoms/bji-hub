import { getAdminStats } from "@/lib/mock/repository";
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

const PAYMENT_STATUS_MAP: Record<string, { label: string; variant: "default" | "outline" | "destructive" }> = {
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

      {/* Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-neutral-300 rounded-sm p-4">
          <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Total Seller</p>
          <p className="font-mono tabular-nums text-2xl text-primary-900 font-bold mt-1">{stats.totalSellers}</p>
        </div>
        <div className="border border-neutral-300 rounded-sm p-4">
          <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Total Listing</p>
          <p className="font-mono tabular-nums text-2xl text-primary-900 font-bold mt-1">{stats.totalListings}</p>
        </div>
        <div className="border border-neutral-300 rounded-sm p-4">
          <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Menunggu Verifikasi</p>
          <p className="font-mono tabular-nums text-2xl text-primary-900 font-bold mt-1">{stats.pendingVerifications}</p>
          {stats.pendingVerifications > 0 && (
            <p className="text-xs text-status-warning mt-1">Perlu ditindaklanjuti</p>
          )}
        </div>
        <div className="border border-neutral-300 rounded-sm p-4">
          <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Pendapatan Bulan Ini</p>
          <p className="font-mono tabular-nums text-lg text-primary-900 font-bold mt-1">{formatRupiah(stats.monthlyRevenue)}</p>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="space-y-3">
        <div className="pb-2 border-b border-neutral-300">
          <h3 className="font-display text-lg text-neutral-900 font-semibold">Transaksi Terbaru</h3>
        </div>
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
              const statusConf = PAYMENT_STATUS_MAP[pay.status] ?? PAYMENT_STATUS_MAP.pending;
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
                    <Badge variant={statusConf.variant} className="text-xs">{statusConf.label}</Badge>
                  </TableCell>
                  <TableCell className="text-neutral-500 font-mono text-xs">
                    {pay.paidAt
                      ? format(new Date(pay.paidAt), "d MMM yyyy", { locale: idLocale })
                      : "-"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}