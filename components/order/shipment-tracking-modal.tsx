"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { trackShipmentAction } from "@/actions/order.actions";
import type { WaybillTrackingResult } from "@/lib/shipping";
import { toast } from "sonner";
import {
  Truck,
  Loader2,
  Copy,
  Clock,
  MapPin,
  RefreshCw,
} from "lucide-react";

interface ShipmentTrackingModalProps {
  trackingNumber: string;
  courierCode?: string;
  orderNumber?: string;
  className?: string;
}

export function ShipmentTrackingModal({
  trackingNumber,
  courierCode = "jne",
  orderNumber,
  className,
}: ShipmentTrackingModalProps) {
  const [open, setOpen] = useState(false);
  const [trackingData, setTrackingData] = useState<WaybillTrackingResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpen = () => {
    setOpen(true);
    if (!trackingData) {
      loadTracking();
    }
  };

  const loadTracking = () => {
    startTransition(async () => {
      const res = await trackShipmentAction(trackingNumber, courierCode);
      if (res.success) {
        setTrackingData(res.data);
      } else {
        toast.error(res.error || "Gagal memuat status pengiriman");
      }
    });
  };

  const copyResi = () => {
    navigator.clipboard.writeText(trackingNumber);
    toast.success("Nomor resi berhasil disalin");
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleOpen}
        className={`h-7 px-2.5 text-xs text-primary-800 border-primary-200 bg-primary-50/50 hover:bg-primary-100/70 gap-1 font-medium ${className}`}
      >
        <Truck className="w-3.5 h-3.5" />
        Lacak Resi
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader className="border-b border-neutral-100 pb-3">
            <div className="flex items-center justify-between pr-4">
              <DialogTitle className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-primary-600" />
                Lacak Pengiriman {orderNumber ? `(${orderNumber})` : ""}
              </DialogTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={loadTracking}
                disabled={isPending}
                className="h-7 w-7 p-0"
                title="Perbarui status"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-neutral-500 ${isPending ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
            <DialogDescription className="text-xs text-neutral-500">
              Informasi live tracking posisi paket dari sistem logistik ekspedisi.
            </DialogDescription>
          </DialogHeader>

          {isPending && !trackingData ? (
            <div className="py-12 flex flex-col items-center justify-center text-xs text-neutral-500 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
              <span>Menghubungi gateway logistik kurir...</span>
            </div>
          ) : trackingData ? (
            <div className="space-y-4 pt-1">
              {/* Summary Card */}
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-800">
                    {trackingData.courierName} ({trackingData.service})
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      trackingData.status === "DELIVERED"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-medium"
                        : "bg-blue-50 text-blue-800 border-blue-300 font-medium"
                    }
                  >
                    {trackingData.status === "DELIVERED" ? "Terkirim" : "Dalam Pengiriman"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-neutral-200/60">
                  <span className="text-neutral-500 font-mono text-[11px]">
                    No. Resi: <strong className="text-neutral-900 font-bold">{trackingData.waybillNumber}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={copyResi}
                    className="text-primary-700 hover:text-primary-900 text-[11px] font-medium flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    Salin
                  </button>
                </div>
              </div>

              {/* Manifest Timeline */}
              <div className="space-y-3 pt-1">
                <p className="text-xs font-semibold text-neutral-800 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-500" /> Riwayat Perjalanan Paket
                </p>

                <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200">
                  {trackingData.manifests.map((m, idx) => {
                    const isLatest = idx === 0;
                    return (
                      <div key={idx} className="relative text-xs space-y-0.5">
                        <div
                          className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full flex items-center justify-center ${
                            isLatest
                              ? "bg-primary-600 text-white ring-4 ring-primary-100"
                              : "bg-neutral-300 text-white"
                          }`}
                        >
                          {isLatest ? (
                            <Truck className="w-2.5 h-2.5" />
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>

                        <p
                          className={`leading-snug ${
                            isLatest ? "font-semibold text-neutral-900" : "text-neutral-700"
                          }`}
                        >
                          {m.manifestDescription}
                        </p>

                        <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono">
                          <span>{m.manifestDate} {m.manifestTime}</span>
                          {m.cityName && (
                            <>
                              <span>&bull;</span>
                              <span className="flex items-center gap-0.5">
                                <MapPin className="w-2.5 h-2.5" />
                                {m.cityName}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-neutral-500">
              Tidak ada data pelacakan yang dapat ditampilkan.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
