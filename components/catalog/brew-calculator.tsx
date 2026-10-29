"use client";

import { useState } from "react";
import { Coffee, Droplets, Thermometer, Timer, Sparkles, Check } from "lucide-react";
import {
  BREW_METHODS,
  BrewMethodId,
  calculateBrewRatio,
} from "@/lib/coffee/brew-methods";
import { Button } from "@/components/ui/button";

interface BrewCalculatorProps {
  initialMethod?: BrewMethodId;
  onSelectGrind?: (grind: string) => void;
  className?: string;
}

export function BrewCalculator({
  initialMethod = "v60",
  onSelectGrind,
  className,
}: BrewCalculatorProps) {
  const [selectedMethod, setSelectedMethod] = useState<BrewMethodId>(initialMethod);
  const [coffeeGrams, setCoffeeGrams] = useState<number>(15);
  const [ratio, setRatio] = useState<number>(BREW_METHODS[initialMethod].defaultRatio);
  const [activeTab, setActiveTab] = useState<"grams" | "water">("grams");
  const [waterMl, setWaterMl] = useState<number>(
    calculateBrewRatio({ coffeeGrams: 15, ratio: BREW_METHODS[initialMethod].defaultRatio }).waterMl
  );

  const method = BREW_METHODS[selectedMethod];

  const handleMethodChange = (id: BrewMethodId) => {
    setSelectedMethod(id);
    const newRatio = BREW_METHODS[id].defaultRatio;
    setRatio(newRatio);
    const res = calculateBrewRatio({ coffeeGrams, ratio: newRatio });
    setWaterMl(res.waterMl);
  };

  const handleCoffeeChange = (val: number) => {
    const safeVal = Math.max(1, Math.min(100, isNaN(val) ? 15 : val));
    setCoffeeGrams(safeVal);
    const res = calculateBrewRatio({ coffeeGrams: safeVal, ratio });
    setWaterMl(res.waterMl);
  };

  const handleWaterChange = (val: number) => {
    const safeVal = Math.max(10, Math.min(2000, isNaN(val) ? 240 : val));
    setWaterMl(safeVal);
    const res = calculateBrewRatio({ waterMl: safeVal, ratio });
    setCoffeeGrams(res.coffeeGrams);
  };

  return (
    <div className={`p-4 sm:p-5 bg-white border border-neutral-200 rounded-lg space-y-5 shadow-xs ${className || ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/60">
            <Sparkles className="w-4 h-4 text-amber-700" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900 text-sm">
              Kalkulator & Panduan Seduh
            </h3>
            <p className="text-xs text-neutral-600">
              Hitung takaran rasio air, suhu, dan ukuran gilingan pas
            </p>
          </div>
        </div>
      </div>

      {/* Method Selector Chips */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-neutral-700 block">
          Pilih Metode Seduh:
        </label>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(BREW_METHODS) as BrewMethodId[]).map((id) => {
            const m = BREW_METHODS[id];
            const isSelected = id === selectedMethod;
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleMethodChange(id)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors border cursor-pointer ${
                  isSelected
                    ? "bg-neutral-900 text-white border-neutral-900 shadow-xs"
                    : "bg-neutral-50 text-neutral-700 hover:bg-neutral-100 border-neutral-200"
                }`}
              >
                {m.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-neutral-50/70 p-3.5 rounded-lg border border-neutral-200/80">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-neutral-700 flex items-center gap-1.5">
              <Coffee className="w-3.5 h-3.5 text-neutral-600" />
              Takaran Kopi (gram)
            </label>
            <span className="font-mono text-xs text-neutral-600">1:1 - 1:20</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={100}
              value={coffeeGrams}
              onChange={(e) => handleCoffeeChange(Number(e.target.value))}
              className="w-full h-9 px-3 rounded-md border border-neutral-300 bg-white text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-400"
            />
            <span className="text-xs text-neutral-600 font-mono">gram</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-neutral-700 flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-sky-600" />
              Kebutuhan Air (ml)
            </label>
            <span className="font-mono text-xs text-neutral-600">Rasio 1:{ratio}</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={10}
              max={2000}
              value={waterMl}
              onChange={(e) => handleWaterChange(Number(e.target.value))}
              className="w-full h-9 px-3 rounded-md border border-neutral-300 bg-white text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-400"
            />
            <span className="text-xs text-neutral-600 font-mono">ml</span>
          </div>
        </div>
      </div>

      {/* Recipe Specs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2.5 rounded bg-neutral-50 border border-neutral-200 space-y-1">
          <div className="flex items-center gap-1 text-neutral-600 font-medium">
            <Coffee className="w-3 h-3 text-neutral-600" />
            <span>Gilingan</span>
          </div>
          <p className="font-bold text-neutral-900 leading-tight">
            {method.recommendedGrind}
          </p>
        </div>

        <div className="p-2.5 rounded bg-neutral-50 border border-neutral-200 space-y-1">
          <div className="flex items-center gap-1 text-neutral-600 font-medium">
            <Droplets className="w-3 h-3 text-sky-600" />
            <span>Rasio Air</span>
          </div>
          <p className="font-bold text-neutral-900 font-mono">
            1 : {ratio}
          </p>
        </div>

        <div className="p-2.5 rounded bg-neutral-50 border border-neutral-200 space-y-1">
          <div className="flex items-center gap-1 text-neutral-600 font-medium">
            <Thermometer className="w-3 h-3 text-rose-500" />
            <span>Suhu Air</span>
          </div>
          <p className="font-bold text-neutral-900 font-mono leading-tight">
            {method.waterTemp}
          </p>
        </div>

        <div className="p-2.5 rounded bg-neutral-50 border border-neutral-200 space-y-1">
          <div className="flex items-center gap-1 text-neutral-600 font-medium">
            <Timer className="w-3 h-3 text-amber-600" />
            <span>Waktu Seduh</span>
          </div>
          <p className="font-bold text-neutral-900 font-mono leading-tight">
            {method.brewTime}
          </p>
        </div>
      </div>

      {/* Guide Step */}
      <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-md text-xs space-y-1">
        <span className="font-semibold text-amber-950 block">Tips Seduh:</span>
        <p className="text-amber-900 leading-relaxed">{method.guideStep}</p>
      </div>

      {/* Action to select this grind */}
      {onSelectGrind && (
        <Button
          type="button"
          onClick={() => onSelectGrind(method.recommendedGrind)}
          className="w-full text-xs font-semibold py-2 bg-neutral-900 text-white hover:bg-neutral-800"
        >
          <Check className="w-3.5 h-3.5 mr-1.5" />
          Terapkan Gilingan Ini ({method.recommendedGrind.split(" ")[0]})
        </Button>
      )}
    </div>
  );
}
