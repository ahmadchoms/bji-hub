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
import { AlertTriangle } from "lucide-react";

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

  const missingEnvVars: string[] = [];
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missingEnvVars.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!process.env.CRON_SECRET) missingEnvVars.push("CRON_SECRET");
  if (!process.env.RESEND_API_KEY && process.env.EMAIL_MODE !== "disabled") missingEnvVars.push("RESEND_API_KEY");

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Admin Panel"
        subtitle="Pantau platform, verifikasi toko penjual, dan kelola produk."
      />

      {missingEnvVars.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm text-amber-900">
            <p className="font-semibold">Peringatan Konfigurasi Lingkungan (Degraded)</p>
            <p className="text-xs text-amber-800">
              Variabel operasional berikut belum diatur: <span className="font-mono font-medium">{missingEnvVars.join(", ")}</span>. Operasi otomatisasi hapus akun Supabase, endpoint cron terjadwal, atau email transaksi beroperasi dalam mode terbatas.
            </p>
          </div>
        </div>
      )}

      <StatList
        items={[
          { label: "Total Penjual", value: String(stats.totalSellers) },
          { label: "Total Produk", value: String(stats.totalListings) },
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
                    <TableCell className="text-neutral-600 font-mono text-xs">
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
