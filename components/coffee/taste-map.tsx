"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface TasteMapItem {
  id: string;
  slug: string;
  title: string;
  originRegion?: string;
  roastLevel?: string;
  acidityScore: number; // 1-5
  bodyScore: number; // 1-5
  cuppingScore?: number | null;
  price: number;
}

interface TasteMapProps {
  items: TasteMapItem[];
  className?: string;
}

export function TasteMap({ items, className }: TasteMapProps) {
  const [selected, setSelected] = useState<TasteMapItem | null>(
    items[0] || null
  );

  // SVG viewBox dimensions
  const width = 500;
  const height = 400;
  const padding = 50;
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;

  // Coordinate scales (1 to 5)
  const getX = (acidity: number) =>
    padding + ((Math.min(5, Math.max(1, acidity)) - 1) / 4) * plotWidth;
  const getY = (body: number) =>
    height -
    padding -
    ((Math.min(5, Math.max(1, body)) - 1) / 4) * plotHeight;

  return (
    <div className={`space-y-4 ${className || ""}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-foreground">
            Peta Rasa Kopi (Taste Map)
          </h3>
          <p className="text-xs text-muted-foreground">
            Sebaran profil rasa biji kopi berdasarkan tingkat keasaman (X) dan
            ketebalan rasa/body (Y).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* SVG Scatter Plot */}
        <div className="lg:col-span-8 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-card shadow-xs">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto"
            role="img"
            aria-label="Peta sebaran rasa kopi berdasarkan keasaman dan body"
          >
            {/* Background grid */}
            <rect
              x={padding}
              y={padding}
              width={plotWidth}
              height={plotHeight}
              fill="currentColor"
              className="text-neutral-50 dark:text-neutral-900/50"
            />

            {/* Grid lines */}
            {[1, 2, 3, 4, 5].map((val) => {
              const x = getX(val);
              const y = getY(val);
              return (
                <g key={val} className="text-neutral-200 dark:text-neutral-800">
                  <line
                    x1={x}
                    y1={padding}
                    x2={x}
                    y2={height - padding}
                    stroke="currentColor"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <line
                    x1={padding}
                    y1={y}
                    x2={width - padding}
                    y2={y}
                    stroke="currentColor"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                </g>
              );
            })}

            {/* Axes */}
            <line
              x1={padding}
              y1={height - padding}
              x2={width - padding}
              y2={height - padding}
              stroke="currentColor"
              strokeWidth="2"
              className="text-neutral-400"
            />
            <line
              x1={padding}
              y1={padding}
              x2={padding}
              y2={height - padding}
              stroke="currentColor"
              strokeWidth="2"
              className="text-neutral-400"
            />

            {/* Labels */}
            <text
              x={width / 2}
              y={height - 12}
              textAnchor="middle"
              className="text-xs fill-neutral-600 dark:fill-neutral-400 font-medium"
            >
              Tingkat Keasaman (Acidity: 1 Rendah → 5 Tinggi)
            </text>

            <text
              x={-height / 2}
              y={18}
              transform="rotate(-90)"
              textAnchor="middle"
              className="text-xs fill-neutral-600 dark:fill-neutral-400 font-medium"
            >
              Ketebalan Rasa (Body: 1 Ringan → 5 Tebal)
            </text>

            {/* Quadrant labels */}
            <text
              x={padding + 10}
              y={padding + 20}
              className="text-xs fill-neutral-400 select-none font-bold"
            >
              TEBAL & LEMBUT
            </text>
            <text
              x={width - padding - 100}
              y={padding + 20}
              className="text-xs fill-neutral-400 select-none font-bold"
            >
              KOMPLEKS & JUICY
            </text>
            <text
              x={padding + 10}
              y={height - padding - 15}
              className="text-xs fill-neutral-400 select-none font-bold"
            >
              RINGAN & SEIMBANG
            </text>
            <text
              x={width - padding - 110}
              y={height - padding - 15}
              className="text-xs fill-neutral-400 select-none font-bold"
            >
              CERAH & FLORAL
            </text>

            {/* Coffee points */}
            {items.map((item) => {
              const cx = getX(item.acidityScore);
              const cy = getY(item.bodyScore);
              const isSelected = selected?.id === item.id;
              const radius = item.cuppingScore
                ? Math.max(6, Math.min(14, (item.cuppingScore - 75) * 1.2))
                : 8;

              return (
                <g
                  key={item.id}
                  className="cursor-pointer transition-transform"
                  onClick={() => setSelected(item)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${item.title}, Asam: ${item.acidityScore}, Body: ${item.bodyScore}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelected(item);
                    }
                  }}
                >
                  {isSelected && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={radius + 4}
                      className="fill-amber-500/20 stroke-amber-500 stroke-2"
                    />
                  )}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={radius}
                    className={`${
                      isSelected
                        ? "fill-amber-600 stroke-white stroke-2"
                        : "fill-amber-500/80 hover:fill-amber-600 stroke-white stroke-1"
                    } transition-colors`}
                  />
                </g>
              );
            })}
          </svg>

          {/* Accessible Table for Screen Readers */}
          <div className="sr-only">
            <table>
              <caption>Daftar Kopi dan Koordinat Profil Rasa</caption>
              <thead>
                <tr>
                  <th scope="col">Nama Kopi</th>
                  <th scope="col">Asal Daerah</th>
                  <th scope="col">Keasaman (1-5)</th>
                  <th scope="col">Body (1-5)</th>
                  <th scope="col">Skor Cupping</th>
                  <th scope="col">Harga</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.title}</td>
                    <td>{item.originRegion || "-"}</td>
                    <td>{item.acidityScore}</td>
                    <td>{item.bodyScore}</td>
                    <td>{item.cuppingScore || "-"}</td>
                    <td>Rp {item.price.toLocaleString("id-ID")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Product Card */}
        <div className="lg:col-span-4 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-card shadow-xs space-y-3">
          {selected ? (
            <>
              <div className="flex items-center justify-between">
                <Badge
                  variant="outline"
                  className="text-xs font-semibold text-amber-600"
                >
                  {selected.originRegion || "Nusantara"}
                </Badge>
                {selected.cuppingScore && (
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    SCA {selected.cuppingScore}
                  </span>
                )}
              </div>

              <div>
                <h4 className="font-bold text-base text-foreground leading-snug">
                  {selected.title}
                </h4>
                {selected.roastLevel && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Sangrai: {selected.roastLevel}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-800 text-xs">
                <div>
                  <span className="text-muted-foreground">Keasaman:</span>
                  <span className="font-bold ml-1 text-foreground">
                    {selected.acidityScore}/5
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Ketebalan:</span>
                  <span className="font-bold ml-1 text-foreground">
                    {selected.bodyScore}/5
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800">
                <span className="font-bold text-sm text-foreground">
                  Rp {selected.price.toLocaleString("id-ID")}
                </span>
                <Link href={`/catalog/${selected.slug || selected.id}`}>
                  <Button size="sm" className="gap-1.5 text-xs">
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Lihat Produk</span>
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-muted-foreground text-xs">
              Klik salah satu titik pada peta untuk melihat detail kopi.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
