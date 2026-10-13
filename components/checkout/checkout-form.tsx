"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import {
  Truck,
  Minus,
  Plus,
  ArrowLeft,
  Loader2,
  Lock,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { ListingWithRelations } from "@/types";
import { formatRupiah } from "@/components/shared/price-text";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { calculateShippingRates, ShippingRate } from "@/lib/shipping";
import { createCheckoutOrderAction } from "@/actions/order.actions";
import { cn } from "@/lib/utils";

interface CheckoutFormProps {
  listing: ListingWithRelations;
  initialBuyer: {
    name: string;
    email: string;
    phone: string;
    province?: string;
    city: string;
    postalCode?: string;
    address: string;
  };
}

export function CheckoutForm({ listing, initialBuyer }: CheckoutFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [quantity, setQuantity] = useState<number>(listing.minOrderQty || 1);
  const buyerName = initialBuyer.name;
  const buyerEmail = initialBuyer.email;
  const buyerPhone = initialBuyer.phone;
  const buyerCity = initialBuyer.city || "";
  const buyerAddress = initialBuyer.address;
  const [notes, setNotes] = useState("");

  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedCourierId, setSelectedCourierId] = useState<string>("");
  const [isLoadingShipping, setIsLoadingShipping] = useState<boolean>(false);

  const selectedCourier =
    shippingRates.find((r) => r.id === selectedCourierId) || null;

  const itemPrice = Number(listing.price);
  const subtotal = itemPrice * quantity;
  const shippingCost = selectedCourier?.cost || 0;
  const serviceFee = 1500;
  const totalAmount = subtotal + shippingCost + serviceFee;

  useEffect(() => {
    let canceled = false;
    const cleanCity = buyerCity.trim();

    if (cleanCity.length < 3) {
      setShippingRates([]);
      setSelectedCourierId("");
      setIsLoadingShipping(false);
      return;
    }

    setIsLoadingShipping(true);
    const timer = setTimeout(async () => {
      try {
        const rates = await calculateShippingRates({
          originCity: listing.seller.city,
          originProvince: listing.seller.province,
          destinationCity: cleanCity,
          weightGrams: quantity * 1000,
        });
        if (!canceled) {
          setShippingRates(rates);
          if (rates.length > 0) {
            setSelectedCourierId((prev) =>
              rates.some((r) => r.id === prev) ? prev : rates[0].id,
            );
          } else {
            setSelectedCourierId("");
          }
        }
      } finally {
        if (!canceled) setIsLoadingShipping(false);
      }
    }, 350);

    return () => {
      canceled = true;
      clearTimeout(timer);
    };
  }, [quantity, buyerCity, listing.seller.city, listing.seller.province]);

  const handlePay = () => {
    if (!buyerName.trim()) {
      toast.error("Nama penerima wajib diisi");
      return;
    }
    if (!buyerPhone.trim()) {
      toast.error("Nomor WhatsApp/HP penerima wajib diisi");
      return;
    }
    if (!buyerCity.trim()) {
      toast.error("Kota / Kabupaten tujuan pengiriman wajib diisi");
      return;
    }
    if (!buyerAddress.trim()) {
      toast.error("Alamat pengiriman lengkap wajib diisi");
      return;
    }
    if (!selectedCourier) {
      toast.error("Silakan masukkan kota dan pilih opsi pengiriman terlebih dahulu");
      return;
    }

    startTransition(async () => {
      try {
        const res = await createCheckoutOrderAction({
          listingId: listing.id,
          quantity,
          buyerName,
          buyerEmail: buyerEmail || "buyer@bijihub.com",
          buyerPhone,
          buyerAddress,
          buyerCity,
          shippingCourier: `${selectedCourier.courierName} ${selectedCourier.service}`,
          shippingCost,
          notes,
        });

        if (!res.success) {
          toast.error("Gagal memproses pesanan", { description: res.error });
          return;
        }

        const { snapToken, orderNumber } = res.data;

        // If Midtrans Snap is loaded on window
        if (
          snapToken &&
          typeof window !== "undefined" &&
          (window as unknown as { snap?: { pay: (token: string, options: unknown) => void } }).snap
        ) {
          const snap = (window as unknown as { snap: { pay: (token: string, options: unknown) => void } }).snap;
          snap.pay(snapToken, {
            onSuccess: () => {
              toast.success("Pembayaran berhasil!");
              router.push(`/order/success?orderNumber=${orderNumber}`);
            },
            onPending: () => {
              toast.info("Menunggu pembayaran Anda diselesaikan.");
              router.push(`/order/success?orderNumber=${orderNumber}`);
            },
            onError: () => {
              toast.error("Pembayaran dibatalkan atau gagal.");
            },
          });
        } else {
          // Mock or offline fallback
          toast.success("Pesanan berhasil dibuat!", {
            description: `Nomor pesanan: ${orderNumber}`,
          });
          router.push(`/order/success?orderNumber=${orderNumber}`);
        }
      } catch {
        toast.error("Terjadi kesalahan saat memproses pembayaran.");
      }
    });
  };

  const firstImage = listing.images[0]?.url;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto">
      {/* Kolom Kiri: Formulir Pengiriman & Produk */}
      <div className="lg:col-span-7 space-y-6">
        <Link
          href={`/product/${listing.slug}`}
          className="inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-primary-700 transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Detail Produk
        </Link>

        {/* Ringkasan Produk */}
        <div className="border border-neutral-300 bg-surface-base rounded-sm p-5 space-y-4">
          <div className="flex gap-4">
            <div className="w-16 h-16 rounded-sm bg-neutral-100 relative overflow-hidden shrink-0 border border-neutral-200">
              {firstImage && (
                <Image
                  src={firstImage}
                  alt={listing.title}
                  fill
                  className="object-cover"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                {listing.category.name}
              </span>
              <h2 className="font-medium text-sm text-neutral-900 truncate">
                {listing.title}
              </h2>
              <p className="text-xs text-neutral-600 mt-0.5">
                Toko: <span className="font-semibold text-neutral-800">{listing.seller.businessName}</span> ({listing.seller.city})
              </p>
              <p className="text-sm font-mono tabular-nums font-bold text-primary-900 mt-1">
                {formatRupiah(listing.price)} / {listing.unit}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-neutral-200 text-xs">
            <span className="text-neutral-600">Jumlah Pesanan ({listing.unit}):</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(listing.minOrderQty, q - 1))}
                disabled={quantity <= listing.minOrderQty}
                className="w-7 h-7 rounded border border-neutral-300 flex items-center justify-center text-neutral-700 hover:bg-neutral-100 disabled:opacity-40"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="font-mono tabular-nums font-bold text-neutral-900 px-2 min-w-8 text-center">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-7 h-7 rounded border border-neutral-300 flex items-center justify-center text-neutral-700 hover:bg-neutral-100"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Alamat Pengiriman Tersimpan (Checking Data) */}
        <div className="border border-neutral-300 bg-surface-base rounded-sm p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
            <h3 className="font-display text-base font-semibold text-neutral-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary-600" /> Alamat Pengiriman Penerima
            </h3>
            <Link
              href={`/profile?next=${encodeURIComponent(`/checkout/${listing.slug}`)}`}
              className="text-xs font-semibold text-primary-700 hover:text-primary-800 hover:underline flex items-center gap-1"
            >
              Ubah Alamat <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="text-xs space-y-1.5 text-neutral-700">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-neutral-900">
                {buyerName}
              </span>
              <span className="font-mono text-neutral-500 font-normal">
                • {buyerPhone}
              </span>
            </div>
            <p className="leading-relaxed text-neutral-800">
              {buyerAddress}
            </p>
            <p className="text-neutral-600 font-medium">
              {buyerCity}
              {initialBuyer.province ? `, ${initialBuyer.province}` : ""}
              {initialBuyer.postalCode ? ` (${initialBuyer.postalCode})` : ""}
            </p>
            <p className="text-neutral-500 text-[11px] font-mono pt-1">
              Konfirmasi transaksi dikirim ke: {buyerEmail}
            </p>
          </div>

          <div className="pt-2 border-t border-neutral-100">
            <FormField label="Catatan Tambahan untuk Penjual (Opsional)">
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Misal: Request giling medium, titip ke satpam, dll."
                className="text-xs"
              />
            </FormField>
          </div>
        </div>

        {/* Pilihan Ekspedisi / Kurir */}
        <div className="border border-neutral-300 bg-surface-base rounded-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-semibold text-neutral-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-primary-700" /> Pilihan Pengiriman
              </h3>
              <p className="text-xs text-neutral-600 mt-0.5">
                Estimasi dari gudang {listing.seller.businessName} ({listing.seller.city}).
              </p>
            </div>
          </div>

          {isLoadingShipping ? (
            <div className="p-6 border border-dashed border-neutral-300 rounded-sm text-center text-xs text-neutral-600 space-y-2 bg-neutral-50/50">
              <Loader2 className="w-5 h-5 mx-auto animate-spin text-primary-600" />
              <p>Menghubungkan ke ekspedisi & menghitung tarif pengiriman...</p>
            </div>
          ) : !buyerCity.trim() || buyerCity.trim().length < 3 ? (
            <div className="p-6 border border-dashed border-neutral-300 rounded-sm text-center text-xs text-neutral-500 space-y-1.5 bg-neutral-50/60">
              <MapPin className="w-5 h-5 mx-auto text-neutral-400" />
              <p className="font-semibold text-neutral-800">Tujuan Belum Diisi</p>
              <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
                Silakan isi Kota / Kabupaten tujuan pada formulir di atas untuk menampilkan daftar ekspedisi dan tarif ongkir.
              </p>
            </div>
          ) : shippingRates.length === 0 ? (
            <div className="p-6 border border-dashed border-amber-300 bg-amber-50/40 rounded-sm text-center text-xs text-amber-900 space-y-1">
              <p className="font-semibold">Opsi Pengiriman Tidak Ditemukan</p>
              <p className="text-[11px] text-amber-700">
                Pastikan nama kota sudah benar (contoh: &quot;Bandung&quot;, &quot;Surabaya&quot;, &quot;Jakarta Selatan&quot;).
              </p>
            </div>
          ) : (
            <RadioGroup
              value={selectedCourierId}
              onValueChange={setSelectedCourierId}
              className="grid grid-cols-1 gap-2 pt-1"
            >
              {shippingRates.map((rate) => (
                <label
                  key={rate.id}
                  htmlFor={`courier-${rate.id}`}
                  className={cn(
                    "flex items-start justify-between border p-3 rounded-sm cursor-pointer transition-colors text-xs",
                    selectedCourierId === rate.id
                      ? "border-primary-600 bg-primary-50/40 text-primary-950"
                      : "border-neutral-300 hover:border-neutral-400 text-neutral-800",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <RadioGroupItem
                      id={`courier-${rate.id}`}
                      value={rate.id}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="font-semibold text-sm">
                        {rate.courierName} — {rate.service}
                      </p>
                      <p className="text-[11px] text-neutral-600 mt-0.5">
                        Estimasi: {rate.etd} • {rate.description}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono tabular-nums font-bold text-sm text-neutral-900 shrink-0 ml-2">
                    {formatRupiah(rate.cost)}
                  </span>
                </label>
              ))}
            </RadioGroup>
          )}
        </div>
      </div>

      {/* Kolom Kanan: Ringkasan Biaya & Tombol Bayar (Sticky) */}
      <div className="lg:col-span-5">
        <div className="border border-neutral-300 bg-surface-base rounded-sm p-5 space-y-5 lg:sticky lg:top-24">
          <h3 className="font-display text-lg font-semibold text-neutral-900 pb-2 border-b border-neutral-200">
            Rincian Pembayaran
          </h3>

          <div className="space-y-2.5 text-xs text-neutral-700">
            <div className="flex justify-between">
              <span>Subtotal Produk ({quantity} {listing.unit}):</span>
              <span className="font-mono tabular-nums font-medium text-neutral-900">
                {formatRupiah(subtotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>
                Ongkos Kirim {selectedCourier ? `(${selectedCourier.courierName})` : ""}:
              </span>
              <span className="font-mono tabular-nums font-medium text-neutral-900">
                {selectedCourier ? (
                  formatRupiah(shippingCost)
                ) : (
                  <span className="text-neutral-400 font-sans font-normal italic">
                    Belum dihitung
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Biaya Layanan Platform:</span>
              <span className="font-mono tabular-nums font-medium text-neutral-900">
                {formatRupiah(serviceFee)}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-200 flex items-baseline justify-between">
            <span className="font-semibold text-sm text-neutral-900">
              Total Pembayaran:
            </span>
            <span className="font-mono tabular-nums text-xl font-bold text-primary-900">
              {formatRupiah(totalAmount)}
            </span>
          </div>

          <Button
            type="button"
            variant="primary"
            size="lg"
            disabled={isPending || !selectedCourier}
            onClick={handlePay}
            className="w-full justify-center gap-2 font-semibold"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses Transaksi...</span>
              </>
            ) : !selectedCourier ? (
              <>
                <MapPin className="w-4 h-4" />
                <span>Pilih Kurir Terlebih Dahulu</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Bayar Sekarang ({formatRupiah(totalAmount)})</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
