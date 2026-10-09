"use client";

import { useCompare } from "@/context/compare-context";
import { X, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState } from "react";

export function CompareDrawer() {
  const { compareList, removeFromCompare, clearCompare } = useCompare();
  const [openModal, setOpenModal] = useState(false);

  if (compareList.length === 0) return null;

  return (
    <>
      {/* Floating Bottom Bar */}
      <aside
        aria-label="Bar perbandingan produk"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-neutral-900 text-white px-4 py-3 rounded-xl shadow-xl border border-neutral-800 flex items-center gap-4 max-w-xl w-[92vw] sm:w-auto animate-in fade-in slide-in-from-bottom-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-medium text-neutral-300">
            Bandingkan ({compareList.length}/3):
          </span>
          <div className="flex -space-x-1.5 items-center">
            {compareList.map((item) => (
              <div
                key={item.id}
                className="relative size-7 rounded-full overflow-hidden border border-neutral-700 bg-neutral-800 shrink-0"
                title={item.title}
              >
                {item.images[0]?.url ? (
                  <Image
                    src={item.images[0].url}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-[8px] font-mono">
                    ☕
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={() => setOpenModal(true)}
            className="px-3 py-1 bg-white text-neutral-900 text-xs font-semibold rounded-md hover:bg-neutral-100 transition-colors flex items-center gap-1"
          >
            Bandingkan
            <ArrowRight className="size-3" />
          </button>

          <button
            type="button"
            onClick={clearCompare}
            className="p-1 text-neutral-400 hover:text-white transition-colors"
            title="Hapus semua"
            aria-label="Hapus semua perbandingan"
          >
            <X className="size-4" />
          </button>
        </div>
      </aside>

      {/* Comparison Modal */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-neutral-200 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                Side-by-Side Comparison
              </span>
              <button
                type="button"
                onClick={clearCompare}
                className="text-xs font-mono text-neutral-400 hover:text-neutral-700 underline"
              >
                Reset Perbandingan
              </button>
            </div>
            <DialogTitle className="font-display text-xl font-bold text-neutral-900 mt-1">
              Komparasi Spesifikasi Lot Kopi
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Bandingkan profil ketinggian, proses pascapanen, varietas, dan harga per kilogram.
            </DialogDescription>
          </DialogHeader>

          {/* Comparison Matrix Table */}
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="py-2.5 px-3 font-mono text-[10px] uppercase text-neutral-400 w-36">
                    Parameter
                  </th>
                  {compareList.map((item) => (
                    <th key={item.id} className="py-2.5 px-3 min-w-48 align-top">
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-1">
                          <Link
                            href={`/product/${item.slug}`}
                            className="font-display text-sm font-bold text-neutral-900 hover:underline line-clamp-2"
                          >
                            {item.title}
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeFromCompare(item.id)}
                            className="text-neutral-400 hover:text-neutral-700"
                            title="Hapus"
                            aria-label={`Hapus ${item.title}`}
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] text-neutral-500">{item.seller.businessName}</p>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                <tr>
                  <td className="py-2.5 px-3 font-mono text-[10px] uppercase text-neutral-400">Harga / Unit</td>
                  {compareList.map((item) => (
                    <td key={item.id} className="py-2.5 px-3 font-mono font-bold text-neutral-900 text-sm">
                      Rp {item.price.toLocaleString("id-ID")} <span className="text-xs font-normal text-neutral-500">/ {item.unit}</span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-mono text-[10px] uppercase text-neutral-400">Min. Order</td>
                  {compareList.map((item) => (
                    <td key={item.id} className="py-2.5 px-3 font-mono text-neutral-700">
                      {item.minOrderQty} {item.unit}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-mono text-[10px] uppercase text-neutral-400">Origin / Asal</td>
                  {compareList.map((item) => (
                    <td key={item.id} className="py-2.5 px-3 font-medium text-neutral-800">
                      {item.tasteProfile?.originRegion || item.seller.city}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-mono text-[10px] uppercase text-neutral-400">Metode Proses</td>
                  {compareList.map((item) => (
                    <td key={item.id} className="py-2.5 px-3 text-neutral-700">
                      {item.tasteProfile?.processMethod || "—"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-mono text-[10px] uppercase text-neutral-400">Tingkat Sangrai</td>
                  {compareList.map((item) => (
                    <td key={item.id} className="py-2.5 px-3 text-neutral-700">
                      {item.tasteProfile?.roastLevel || "—"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-mono text-[10px] uppercase text-neutral-400">Notes Rasa</td>
                  {compareList.map((item) => (
                    <td key={item.id} className="py-2.5 px-3 text-neutral-700">
                      {item.tasteProfile?.flavorNotes || "—"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-mono text-[10px] uppercase text-neutral-400">Skor Sensory</td>
                  {compareList.map((item) => (
                    <td key={item.id} className="py-2.5 px-3 font-mono text-neutral-600">
                      Acid: <span className="font-bold text-neutral-900">{item.tasteProfile?.acidityScore ?? "-"}/5</span> · Body: <span className="font-bold text-neutral-900">{item.tasteProfile?.bodyScore ?? "-"}/5</span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-mono text-[10px] uppercase text-neutral-400">Aksi</td>
                  {compareList.map((item) => (
                    <td key={item.id} className="py-2.5 px-3">
                      <Link
                        href={`/product/${item.slug}`}
                        onClick={() => setOpenModal(false)}
                        className="inline-block px-3 py-1.5 bg-neutral-900 text-white rounded text-xs font-semibold hover:bg-neutral-800 transition-colors"
                      >
                        Buka Detail Produk
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
