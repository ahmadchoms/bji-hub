"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ListingWithRelations } from "@/types";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface CuppingSheetModalProps {
  listing: ListingWithRelations;
}

export function CuppingSheetModal({ listing }: CuppingSheetModalProps) {
  const tp = listing.tasteProfile;
  const roastDateFormatted = tp?.roastDate
    ? format(new Date(tp.roastDate), "dd MMMM yyyy", { locale: id })
    : "-";

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs font-mono uppercase tracking-wider text-neutral-600 border-neutral-300 hover:bg-neutral-50 justify-center gap-1.5"
        >
          <Printer className="size-3.5 text-neutral-500" />
          Cetak Cupping Spec Sheet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-neutral-200 pb-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
              Technical Spec & Cupping Sheet
            </span>
            <Button
              type="button"
              size="sm"
              onClick={handlePrint}
              className="h-7 text-xs font-mono uppercase tracking-wider gap-1.5 bg-neutral-900 text-white hover:bg-neutral-800"
            >
              <Printer className="size-3" />
              Print / Simpan PDF
            </Button>
          </div>
          <DialogTitle className="font-display text-lg font-bold text-neutral-900 mt-1">
            {listing.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-500">
            Lembar spesifikasi teknis dan formulir evaluasi cupping untuk roaster & Q-grader.
          </DialogDescription>
        </DialogHeader>

        {/* Print-Ready Content Area */}
        <div id="cupping-sheet-print" className="space-y-4 pt-2">
          {/* Header Metadata */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-md text-xs">
            <div>
              <p className="text-[10px] font-mono text-neutral-400 uppercase">Produser / Petani</p>
              <p className="font-semibold text-neutral-900">{listing.seller.businessName}</p>
              <p className="text-neutral-500">{listing.seller.city}, {listing.seller.province}</p>
            </div>
            <div>
              <p className="text-[10px] font-mono text-neutral-400 uppercase">Harga & Minimum Order</p>
              <p className="font-mono font-semibold text-neutral-900">
                Rp {listing.price.toLocaleString("id-ID")} / {listing.unit}
              </p>
              <p className="text-neutral-500 font-mono text-[11px]">Min. order {listing.minOrderQty} {listing.unit}</p>
            </div>
          </div>

          {/* Technical Specs Grid */}
          <div>
            <h5 className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-semibold mb-2">
              Spesifikasi Fisik & Pascapanen
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="border border-neutral-200 p-2 rounded-sm bg-white">
                <span className="block text-[10px] font-mono text-neutral-400 uppercase">Origin</span>
                <span className="font-medium text-neutral-900">{tp?.originRegion || listing.seller.city}</span>
              </div>
              <div className="border border-neutral-200 p-2 rounded-sm bg-white">
                <span className="block text-[10px] font-mono text-neutral-400 uppercase">Metode Proses</span>
                <span className="font-medium text-neutral-900">{tp?.processMethod || "-"}</span>
              </div>
              <div className="border border-neutral-200 p-2 rounded-sm bg-white">
                <span className="block text-[10px] font-mono text-neutral-400 uppercase">Tingkat Sangrai</span>
                <span className="font-medium text-neutral-900">{tp?.roastLevel || "-"}</span>
              </div>
              <div className="border border-neutral-200 p-2 rounded-sm bg-white">
                <span className="block text-[10px] font-mono text-neutral-400 uppercase">Tanggal Roast</span>
                <span className="font-medium text-neutral-900">{roastDateFormatted}</span>
              </div>
              <div className="border border-neutral-200 p-2 rounded-sm bg-white">
                <span className="block text-[10px] font-mono text-neutral-400 uppercase">Elevasi / mdpl</span>
                <span className="font-medium text-neutral-900">1.200–1.600 mdpl</span>
              </div>
              <div className="border border-neutral-200 p-2 rounded-sm bg-white">
                <span className="block text-[10px] font-mono text-neutral-400 uppercase">Varietas</span>
                <span className="font-medium text-neutral-900">Typica / Kartika</span>
              </div>
            </div>
          </div>

          {/* Flavor Notes & Sensory Scores */}
          <div className="border border-neutral-200 rounded-md p-3 space-y-2 bg-white">
            <h5 className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-semibold">
              Profil Sensorik
            </h5>
            <p className="text-xs text-neutral-700">
              <span className="font-semibold text-neutral-900">Flavor Notes:</span>{" "}
              {tp?.flavorNotes || "Belum ada catatan rasa khusus."}
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
              <div className="bg-neutral-50 p-2 rounded border border-neutral-100 flex justify-between">
                <span className="text-neutral-500">Acidity Score:</span>
                <span className="font-bold text-neutral-900">{tp?.acidityScore ?? "-"}/5</span>
              </div>
              <div className="bg-neutral-50 p-2 rounded border border-neutral-100 flex justify-between">
                <span className="text-neutral-500">Body Score:</span>
                <span className="font-bold text-neutral-900">{tp?.bodyScore ?? "-"}/5</span>
              </div>
            </div>
          </div>

          {/* Blank Cupping Evaluation Table (for physical cupping test) */}
          <div className="border border-dashed border-neutral-300 rounded-md p-3 space-y-2 bg-neutral-50/50">
            <h5 className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-semibold">
              Formulir Cupping Evaluasi Roaster (Catatan Fisik)
            </h5>
            <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono">
              <div className="border border-neutral-200 bg-white p-1.5 rounded">
                <span className="text-neutral-400 block">FRAGRANCE</span>
                <span className="text-neutral-300 block text-xs">__ / 10</span>
              </div>
              <div className="border border-neutral-200 bg-white p-1.5 rounded">
                <span className="text-neutral-400 block">FLAVOR</span>
                <span className="text-neutral-300 block text-xs">__ / 10</span>
              </div>
              <div className="border border-neutral-200 bg-white p-1.5 rounded">
                <span className="text-neutral-400 block">AFTERTASTE</span>
                <span className="text-neutral-300 block text-xs">__ / 10</span>
              </div>
              <div className="border border-neutral-200 bg-white p-1.5 rounded">
                <span className="text-neutral-400 block">BALANCE</span>
                <span className="text-neutral-300 block text-xs">__ / 10</span>
              </div>
            </div>
            <div className="border border-neutral-200 bg-white p-2 rounded text-[11px] text-neutral-400 font-mono h-12">
              Catatan Roaster:
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
