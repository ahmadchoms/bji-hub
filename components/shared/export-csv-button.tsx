"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface CsvColumn<T, V = any> {
  key: keyof T | string;
  label: string;
  format?: (value: V, row: T) => string | number | null | undefined;
}

interface ExportCsvButtonProps<T> {
  data: T[];
  filename: string;
  columns: CsvColumn<T>[];
  label?: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
}

function escapeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function ExportCsvButton<T extends object>({
  data,
  filename,
  columns,
  label = "Ekspor CSV",
  className,
  size = "sm",
  variant = "outline",
}: ExportCsvButtonProps<T>) {
  const handleExport = () => {
    if (!data || data.length === 0) return;

    const headers = columns.map((col) => escapeCsvCell(col.label)).join(",");
    const rows = data.map((row) =>
      columns
        .map((col) => {
          const rawVal = (row as Record<string, unknown>)[col.key as string];
          const val = col.format ? col.format(rawVal, row) : rawVal;
          return escapeCsvCell(val);
        })
        .join(","),
    );

    const csvContent = [headers, ...rows].join("\r\n");
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      onClick={handleExport}
      disabled={data.length === 0}
      className={className}
    >
      <Download className="w-3.5 h-3.5 mr-1.5" />
      {label}
    </Button>
  );
}
