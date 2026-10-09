"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

const PRESET_RATIOS = [
  { label: "1:15 (V60 Standar)", ratio: 15, desc: "Seimbang & Ekstraksi Optimal" },
  { label: "1:16 (Filter Ringan)", ratio: 16, desc: "Aroma Jernih & Asam Bersih" },
  { label: "1:12 (Japanese / Es)", ratio: 12, desc: "Pekat Ditambah Es Batu" },
  { label: "1:10 (Tubruk Bold)", ratio: 10, desc: "Body Tebal & Mantap" },
];

export function BrewCalculator() {
  const [coffeeGrams, setCoffeeGrams] = useState<number>(15);
  const [selectedRatio, setSelectedRatio] = useState<number>(15);

  const totalWater = Math.round(coffeeGrams * selectedRatio);
  const bloomWater = Math.round(coffeeGrams * 3);

  const adjustGrams = (delta: number) => {
    setCoffeeGrams((prev) => Math.min(100, Math.max(8, prev + delta)));
  };

  return (
    <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
            Brew Guide
          </span>
          <h4 className="font-display text-base font-semibold text-neutral-900">
            Kalkulator Rasio Seduh
          </h4>
        </div>
        <span className="text-[11px] font-mono text-neutral-400">
          Rasio 1:{selectedRatio}
        </span>
      </div>

      {/* Preset Rasio */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 font-medium">
          Pilih Metode / Rasio
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PRESET_RATIOS.map((item) => (
            <button
              key={item.ratio}
              type="button"
              onClick={() => setSelectedRatio(item.ratio)}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                selectedRatio === item.ratio
                  ? "border-neutral-900 bg-neutral-900 text-white shadow-2xs"
                  : "border-neutral-200/80 bg-neutral-50/50 text-neutral-700 hover:bg-neutral-100 hover:border-neutral-300"
              }`}
            >
              <p className="text-xs font-semibold">{item.label}</p>
              <p
                className={`text-[10px] truncate mt-0.5 ${
                  selectedRatio === item.ratio
                    ? "text-neutral-300"
                    : "text-neutral-500"
                }`}
              >
                {item.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Input Berat Kopi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-neutral-50 border border-neutral-200/60">
        <div>
          <span className="text-xs font-semibold text-neutral-900 block">
            Takaran Biji Kopi
          </span>
          <span className="text-[11px] text-neutral-500">
            Sesuaikan dengan kapasitas dripper / cangkir
          </span>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => adjustGrams(-1)}
            disabled={coffeeGrams <= 8}
            className="flex items-center justify-center size-8 rounded-md bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-700 disabled:opacity-40 transition-colors shadow-2xs"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <div className="w-16 text-center">
            <span className="font-mono text-base font-bold text-neutral-900 tabular-nums">
              {coffeeGrams}
            </span>
            <span className="text-xs font-medium text-neutral-500 ml-1">gr</span>
          </div>
          <button
            type="button"
            onClick={() => adjustGrams(1)}
            disabled={coffeeGrams >= 100}
            className="flex items-center justify-center size-8 rounded-md bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-700 disabled:opacity-40 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Hasil Perhitungan Seduh */}
      <div className="grid grid-cols-3 gap-2.5 pt-1">
        <div className="p-3 bg-neutral-50/70 rounded-lg border border-neutral-200/70 space-y-1">
          <span className="block text-neutral-400 text-[10px] font-mono uppercase tracking-wider">
            Air Total
          </span>
          <p className="font-mono text-lg font-bold text-neutral-900 tabular-nums">
            {totalWater}{" "}
            <span className="text-xs font-normal text-neutral-500">ml</span>
          </p>
        </div>

        <div className="p-3 bg-neutral-50/70 rounded-lg border border-neutral-200/70 space-y-1">
          <span className="block text-neutral-400 text-[10px] font-mono uppercase tracking-wider">
            Blooming
          </span>
          <p className="font-mono text-lg font-bold text-neutral-900 tabular-nums">
            {bloomWater}{" "}
            <span className="text-xs font-normal text-neutral-500">ml</span>
          </p>
          <p className="text-[10px] text-neutral-400 font-mono">Tunggu 40 dtk</p>
        </div>

        <div className="p-3 bg-neutral-50/70 rounded-lg border border-neutral-200/70 space-y-1">
          <span className="block text-neutral-400 text-[10px] font-mono uppercase tracking-wider">
            Suhu Ideal
          </span>
          <p className="font-mono text-lg font-bold text-neutral-900 tabular-nums">
            91°–93°{" "}
            <span className="text-xs font-normal text-neutral-500">C</span>
          </p>
          <p className="text-[10px] text-neutral-400 font-mono">Diamkan 1m</p>
        </div>
      </div>
    </div>
  );
}
