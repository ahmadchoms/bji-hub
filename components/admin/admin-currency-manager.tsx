"use client";

import { useState, useEffect, useTransition } from "react";
import {
  getCurrencyRatesAction,
  updateCurrencyRateAction,
  type CurrencyRateItem,
} from "@/actions/currency.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Coins, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function AdminCurrencyManager() {
  const [rates, setRates] = useState<CurrencyRateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCode, setSelectedCode] = useState<string>("USD");
  const [inputRate, setInputRate] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const fetchRates = async () => {
    setLoading(true);
    const res = await getCurrencyRatesAction();
    if (res.success) {
      setRates(res.data.rates);
      const current = res.data.rates.find((r) => r.code === selectedCode);
      if (current) setInputRate(String(current.perIdr));
    } else {
      setError(res.error || "Gagal memuat kurs mata uang");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleSelectCode = (code: string) => {
    setSelectedCode(code);
    const found = rates.find((r) => r.code === code);
    if (found) setInputRate(String(found.perIdr));
  };

  const handleSave = () => {
    setError(null);
    const num = parseFloat(inputRate);
    if (isNaN(num) || num <= 0) {
      setError("Masukkan nilai kurs angka positif yang valid");
      return;
    }

    startTransition(async () => {
      const res = await updateCurrencyRateAction(selectedCode, num);
      if (res.success) {
        toast.success(`Kurs ${selectedCode} berhasil diperbarui`);
        await fetchRates();
      } else {
        setError(res.error || "Gagal memperbarui kurs mata uang");
      }
    });
  };

  return (
    <Card className="border border-border">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary-700" />
          <CardTitle className="text-lg">Pengaturan Kurs Mata Uang (C5)</CardTitle>
        </div>
        <CardDescription>
          Kelola nilai konversi tampilan mata uang asing per 1 IDR untuk pengunjung internasional.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {rates.map((r) => (
            <button
              key={r.code}
              type="button"
              onClick={() => handleSelectCode(r.code)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors ${
                selectedCode === r.code
                  ? "bg-primary-800 text-white shadow-2xs"
                  : "bg-neutral-100 text-neutral-800 hover:bg-neutral-200"
              }`}
            >
              {r.code}: {r.perIdr}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-800">1 IDR =</span>
            <Input
              type="number"
              step="0.00000001"
              value={inputRate}
              onChange={(e) => setInputRate(e.target.value)}
              placeholder="Contoh: 0.000063"
              className="w-44 text-xs font-mono"
              disabled={isPending || loading}
            />
            <span className="text-xs font-bold text-neutral-900">{selectedCode}</span>
          </div>

          <Button
            onClick={handleSave}
            disabled={isPending || loading}
            className="text-xs flex items-center gap-1.5"
          >
            {isPending ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Simpan Kurs {selectedCode}</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
