"use client";

import { useState, useEffect } from "react";
import { Truck, MapPin, Loader2 } from "lucide-react";
import { calculateShippingRates, ShippingRate } from "@/lib/shipping";
import { formatRupiah } from "@/components/shared/price-text";

interface ProductShippingEstimatorProps {
  originCity: string;
  originProvince?: string;
}

export function ProductShippingEstimator({
  originCity,
  originProvince,
}: ProductShippingEstimatorProps) {
  const [destCity, setDestCity] = useState("Jakarta Selatan");
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let canceled = false;
    const cleanCity = destCity.trim();
    if (cleanCity.length < 3) {
      setRates([]);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await calculateShippingRates({
          originCity,
          originProvince,
          destinationCity: cleanCity,
          weightGrams: 1000,
        });
        if (!canceled) {
          setRates(res.slice(0, 3));
        }
      } catch {
        // ignore: UI estimation error toast already handled
        if (!canceled) setRates([]);
      } finally {
        if (!canceled) setLoading(false);
      }
    }, 300);

    return () => {
      canceled = true;
      clearTimeout(timer);
    };
  }, [destCity, originCity, originProvince]);

  return (
    <div className="p-3.5 bg-neutral-50/80 border border-neutral-200 rounded-sm text-xs space-y-2.5">
      <div className="flex items-center justify-between text-neutral-700">
        <span className="font-semibold flex items-center gap-1.5 text-neutral-900">
          <Truck className="w-3.5 h-3.5 text-primary-600" /> Estimasi Ongkir
        </span>
        <span className="text-xs text-neutral-600 font-mono">
          Dari {originCity}
        </span>
      </div>

      <div className="flex items-center gap-1.5 bg-white border border-neutral-300 rounded px-2.5 py-1">
        <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
        <input
          type="text"
          value={destCity}
          onChange={(e) => setDestCity(e.target.value)}
          placeholder="Ketik kota tujuan (contoh: Surabaya, Medan)"
          className="w-full text-xs outline-none focus-visible:ring-1 focus-visible:ring-primary-600 rounded-xs bg-transparent text-neutral-900 placeholder:text-neutral-400"
        />
        {loading && (
          <Loader2 className="w-3.5 h-3.5 text-neutral-400 animate-spin shrink-0" />
        )}
      </div>

      {rates.length > 0 && (
        <div className="space-y-1 pt-0.5">
          {rates.map((rate) => (
            <div
              key={rate.id}
              className="flex items-center justify-between text-xs py-1 border-b border-neutral-200/50 last:border-0"
            >
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-neutral-800">
                  {rate.courierName}
                </span>
                <span className="text-neutral-600">({rate.service})</span>
                <span className="text-neutral-400 text-xs">
                  • {rate.etd}
                </span>
              </div>
              <span className="font-mono font-medium text-neutral-900">
                {formatRupiah(rate.cost)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
