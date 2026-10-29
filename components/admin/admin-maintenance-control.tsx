"use client";

import { useState, useTransition } from "react";
import { runManualMaintenanceAction, type MaintenanceRunResult } from "@/actions/maintenance.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

export function AdminMaintenanceControl() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<MaintenanceRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRun = () => {
    setError(null);
    startTransition(async () => {
      const res = await runManualMaintenanceAction();
      if (res.success) {
        setResult(res.data);
      } else {
        setError(res.error || "Gagal menjalankan pemeliharaan");
      }
    });
  };

  return (
    <Card className="border border-border">
      <CardHeader>
        <CardTitle className="text-lg">Jalankan Pemeliharaan Sistem</CardTitle>
        <CardDescription>
          Memicu pembatalan pesanan kedaluwarsa (&gt;75 menit) dan penyelesaian otomatis pesanan terkirim (&gt;48 jam) secara instan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleRun}
          disabled={isPending}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
          {isPending ? "Menjalankan Pemeliharaan..." : "Jalankan Pemeliharaan Sekarang"}
        </Button>

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="flex flex-col gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-800">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              <span>Pemeliharaan Berhasil Dijalankan</span>
            </div>
            <p className="mt-1">
              • Pesanan kedaluwarsa dibatalkan: <strong>{result.canceledOrdersCount}</strong>
            </p>
            <p>
              • Pesanan diselesaikan otomatis: <strong>{result.completedOrdersCount}</strong>
            </p>
            <p className="text-xs opacity-75">
              Waktu eksekusi: {new Date(result.timestamp).toLocaleString("id-ID")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
