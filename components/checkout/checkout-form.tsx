"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import {
  ShieldCheck,
  Truck,
  Minus,
  Plus,
  ArrowLeft,
  Loader2,
  Lock,
} from "lucide-react";
import { ListingWithRelations } from "@/types";
import { formatRupiah } from "@/components/shared/price-text";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
    city: string;
    address: string;
  };
}

export function CheckoutForm({ listing, initialBuyer }: CheckoutFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [quantity, setQuantity] = useState<number>(listing.minOrderQty || 1);
  const [buyerName, setBuyerName] = useState(initialBuyer.name);
  const [buyerEmail, setBuyerEmail] = useState(initialBuyer.email);
  const [buyerPhone, setBuyerPhone] = useState(initialBuyer.phone);
  const [buyerCity, setBuyerCity] = useState(initialBuyer.city || "Jakarta");
  const [buyerAddress, setBuyerAddress] = useState(initialBuyer.address);
  const [notes, setNotes] = useState("");

  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([
    {
      id: "jne-reg",
      courierCode: "jne",
      courierName: "JNE",
      service: "Reguler",
      cost: 15000,
      etd: "2-3 hari",
      description: "Pengiriman standar kilat.",
    },
    {
      id: "jnt-cargo",
      courierCode: "jnt_cargo",
      courierName: "J&T Cargo",
      service: "Kargo Hemat B2B",
      cost: 25000,
      etd: "3-5 hari",
      description: "Rekomendasi terbaik untuk karung & pesanan grosir (≥ 5 kg).",
    },
  ]);
  const [selectedCourierId, setSelectedCourierId] = useState<string>("jne-reg");

  const selectedCourier =
    shippingRates.find((r) => r.id === selectedCourierId) || shippingRates[0];

  const itemPrice = Number(listing.price);
  const subtotal = itemPrice * quantity;
  const shippingCost = selectedCourier?.cost || 0;
  const serviceFee = 1500;
  const totalAmount = subtotal + shippingCost + serviceFee;

  const handleCityChange = async (newCity: string) => {
    setBuyerCity(newCity);
    if (newCity.trim().length >= 3) {
      const rates = await calculateShippingRates({
        originCity: listing.seller.city,
        originProvince: listing.seller.province,
        destinationCity: newCity,
        weightGrams: quantity * 1000,
      });
      setShippingRates(rates);
      if (!rates.some((r) => r.id === selectedCourierId)) {
        setSelectedCourierId(rates[0]?.id || "jne-reg");
      }
    }
  };

  const handlePay = () => {
    if (!buyerName.trim()) {
      toast.error("Nama penerima wajib diisi");
      return;
    }
    if (!buyerPhone.trim()) {
      toast.error("Nomor WhatsApp/HP penerima wajib diisi");
      return;
    }
    if (!buyerAddress.trim()) {
      toast.error("Alamat pengiriman lengkap wajib diisi");
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

        {/* Informasi Penerima & Alamat */}
        <div className="border border-neutral-300 bg-surface-base rounded-sm p-5 space-y-4">
          <div>
            <h3 className="font-display text-base font-semibold text-neutral-900">
              Alamat Pengiriman
            </h3>
            <p className="text-xs text-neutral-600 mt-0.5">
              Pastikan alamat dan nomor kontak aktif untuk koordinasi kurir.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Nama Penerima" required>
              <Input
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Budi Pratama"
              />
            </FormField>
            <FormField label="Nomor WhatsApp / HP" required>
              <Input
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                placeholder="08123456789"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Email Konfirmasi" required>
              <Input
                type="email"
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                placeholder="budi@example.com"
              />
            </FormField>
            <FormField label="Kota / Kabupaten Tujuan" required>
              <Input
                value={buyerCity}
                onChange={(e) => handleCityChange(e.target.value)}
                placeholder="Jakarta Selatan, Bandung, dll"
              />
            </FormField>
          </div>

          <FormField label="Alamat Lengkap" required>
            <Textarea
              value={buyerAddress}
              onChange={(e) => setBuyerAddress(e.target.value)}
              rows={2}
              placeholder="Nama jalan, nomor rumah/kantor/kedai, RT/RW, kelurahan, kode pos..."
            />
          </FormField>

          <FormField label="Catatan Tambahan (Opsional)">
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Misal: Titipkan ke pos satpam, request giling halus, dll."
            />
          </FormField>
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
              <span>Ongkos Kirim ({selectedCourier.courierName}):</span>
              <span className="font-mono tabular-nums font-medium text-neutral-900">
                {formatRupiah(shippingCost)}
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

          {/* Garansi Rekening Bersama (Escrow) */}
          <div className="p-3 rounded bg-emerald-50/60 border border-emerald-200 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Garansi Aman Rekening Bersama</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Dana Anda disimpan aman oleh Biji Hub dan baru diteruskan ke {listing.seller.businessName} setelah kopi sampai dengan selamat.
            </p>
          </div>

          <Button
            type="button"
            variant="primary"
            size="lg"
            disabled={isPending}
            onClick={handlePay}
            className="w-full justify-center gap-2 font-semibold"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menghubungkan Pembayaran...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Bayar Sekarang ({formatRupiah(totalAmount)})</span>
              </>
            )}
          </Button>

          <p className="text-[11px] text-neutral-500 text-center leading-normal">
            Mendukung QRIS, GoPay, BCA/Mandiri/BRI Virtual Account, & Kartu Kredit via Midtrans.
          </p>
        </div>
      </div>
    </div>
  );
}
