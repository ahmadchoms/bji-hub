"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { DailyMetric } from "@/types";
import { cn } from "@/lib/utils";

interface MetricsChartProps {
  data: DailyMetric[];
  className?: string;
}

export function MetricsChart({ data, className }: MetricsChartProps) {
  if (data.length === 0) {
    return (
      <div
        className={cn(
          "p-8 border border-neutral-300 bg-surface-base rounded-sm",
          className,
        )}
      >
        <p className="font-display text-sm text-neutral-500 italic">
          Belum ada data analitik untuk periode ini.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="pb-2 border-b border-neutral-300">
        <h3 className="font-display text-lg text-neutral-900 font-semibold">
          Tayangan & Klik
        </h3>
        <p className="text-xs text-neutral-500 font-mono">
          {data.length} hari terakhir
        </p>
      </div>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="0"
              stroke="#E5DDD2"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{
                fill: "#8C8078",
                fontSize: 10,
                fontFamily: "var(--font-mono)",
              }}
              axisLine={{ stroke: "#E5DDD2", strokeWidth: 1 }}
            />
            <YAxis
              tick={{
                fill: "#8C8078",
                fontSize: 10,
                fontFamily: "var(--font-mono)",
              }}
              axisLine={{ stroke: "#E5DDD2", strokeWidth: 1 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #D8CFC5",
                borderRadius: 2,
                fontSize: 12,
                fontFamily: "var(--font-sans)",
              }}
            />
            <Legend
              wrapperStyle={{
                fontSize: 11,
                paddingTop: 8,
                fontFamily: "var(--font-sans)",
              }}
            />
            <Line
              type="monotone"
              dataKey="views"
              name="Tayangan"
              stroke="#512615"
              strokeWidth={1}
              dot={false}
              activeDot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="clicks"
              name="Klik Kontak"
              stroke="#2F6D4F"
              strokeWidth={1}
              dot={false}
              activeDot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
