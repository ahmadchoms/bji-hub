"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { formatRupiah } from "@/components/shared/price-text";
import { cn } from "@/lib/utils";

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

interface RevenueChartProps {
  data: RevenueDataPoint[];
  totalRevenue: number;
  className?: string;
}

export function RevenueChart({ data, totalRevenue, className }: RevenueChartProps) {
  if (data.length === 0 || totalRevenue === 0) {
    return (
      <div
        className={cn(
          "p-6 border border-neutral-300 bg-white rounded-lg text-center space-y-1.5 shadow-xs",
          className,
        )}
      >
        <p className="font-semibold text-sm text-neutral-800">
          Belum Ada Transaksi Penjualan Online
        </p>
        <p className="text-xs text-neutral-500">
          Grafik tren omzet akan muncul secara otomatis saat pesanan online mulai masuk dan dibayar.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "space-y-4 bg-white border border-neutral-300 rounded-lg p-5 shadow-xs",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-200">
        <div>
          <h3 className="font-display text-base font-bold text-neutral-900">
            Tren Omzet Penjualan
          </h3>
          <p className="text-xs text-neutral-500">
            Penerimaan bersih penjual dari pesanan langsung online
          </p>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-neutral-500">Total Omzet:</span>
          <p className="font-mono text-base font-bold text-emerald-700">
            {formatRupiah(totalRevenue)}
          </p>
        </div>
      </div>

      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE5" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "#737373", fontSize: 11 }}
              axisLine={{ stroke: "#E5E5E5" }}
            />
            <YAxis
              tick={{ fill: "#737373", fontSize: 10 }}
              axisLine={{ stroke: "#E5E5E5" }}
              tickFormatter={(v: number) =>
                v >= 1000000
                  ? `${(v / 1000000).toFixed(1)}jt`
                  : v >= 1000
                    ? `${(v / 1000).toFixed(0)}k`
                    : `${v}`
              }
            />
            <Tooltip
              formatter={(val) => [
                formatRupiah(Number(val || 0)),
                "Omzet",
              ]}
              labelFormatter={(label) => `Tanggal: ${label}`}
              contentStyle={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #D4D4D4",
                borderRadius: 4,
                fontSize: 12,
              }}
            />
            <Bar dataKey="revenue" name="Omzet" fill="#059669" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
