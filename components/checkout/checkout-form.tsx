"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Edit2,
  Check,
  Package,
} from "lucide-react";
import { ListingWithRelations, BuyerAddress } from "@/types";
import { formatRupiah } from "@/components/shared/price-text";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { calculateShippingRates, ShippingRate } from "@/lib/shipping";
import { createCheckoutOrderAction } from "@/actions/order.actions";
import { updateBuyerProfileAction } from "@/actions/auth.actions";
import { useCart } from "@/lib/cart";
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
  savedAddresses?: BuyerAddress[];
}

export function CheckoutForm({
  listing,
  initialBuyer,
  savedAddresses = [],
}: CheckoutFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  const isCart = searchParams.get("cart") === "1";
  const itemsParam = searchParams.get("items");
  const selectedListingIds = itemsParam
    ? itemsParam.split(",").filter(Boolean)
    : null;
  const { items: cartItems, removeFromCart } = useCart();

  // Multi-item cart detection (filtered by selected items if provided)
  const sellerCartItems = isCart
    ? cartItems.filter((item) => {
        if (item.sellerId !== listing.sellerId) return false;
        if (selectedListingIds && selectedListingIds.length > 0) {
          return selectedListingIds.includes(item.listingId);
        }
        return true;
      })
    : [];
  const activeItems = sellerCartItems.length > 0 ? sellerCartItems : null;
  const grindParam = searchParams.get("grind") || undefined;
  const qtyParam = searchParams.get("qty") || searchParams.get("quantity");
  const parsedQty = qtyParam ? parseInt(qtyParam, 10) : undefined;
  const initialQuantity =
    parsedQty && !isNaN(parsedQty)
      ? Math.max(listing.minOrderQty || 1, parsedQty)
      : listing.minOrderQty || 1;

  const [quantity, setQuantity] = useState<number>(initialQuantity);

  // Editable recipient / shipping address state
  const [buyerName, setBuyerName] = useState(initialBuyer.name);
  const [buyerEmail] = useState(initialBuyer.email);
  const [buyerPhone, setBuyerPhone] = useState(initialBuyer.phone);
  const [buyerCity, setBuyerCity] = useState(initialBuyer.city || "");
  const [buyerProvince, setBuyerProvince] = useState(initialBuyer.province || "");
  const [buyerPostalCode, setBuyerPostalCode] = useState(initialBuyer.postalCode || "");
  const [buyerAddress, setBuyerAddress] = useState(initialBuyer.address);
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  const [notes, setNotes] = useState("");

  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedCourierId, setSelectedCourierId] = useState<string>("");
  const [isLoadingShipping, setIsLoadingShipping] = useState<boolean>(false);

  const selectedCourier =
    shippingRates.find((r) => r.id === selectedCourierId) || null;

  // Compute active totals and weight
  const activeQuantity = activeItems
    ? activeItems.reduce((acc, i) => acc + i.quantity, 0)
    : quantity;

  const subtotal = activeItems
    ? activeItems.reduce((acc, i) => acc + i.price * i.quantity, 0)
    : Number(listing.price) * quantity;

  const totalWeightGrams = Math.max(1000, activeQuantity * 1000);
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
          weightGrams: totalWeightGrams,
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
  }, [totalWeightGrams, buyerCity, listing.seller.city, listing.seller.province]);

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

    if (listing.stock === 0) {
      toast.error("Maaf, stok produk ini telah habis");
      return;
    }

    startTransition(async () => {
      try {
        const res = await createCheckoutOrderAction({
          listingId: listing.id,
          quantity: activeQuantity,
          buyerName,
          buyerEmail: buyerEmail || "buyer@bijihub.com",
          buyerPhone,
          buyerAddress,
          buyerCity,
          shippingCourier: `${selectedCourier.courierName} ${selectedCourier.service}`,
          shippingCost,
          grindSize: grindParam,
          notes,
          ...(activeItems && activeItems.length > 0
            ? {
                items: activeItems.map((i) => ({
                  listingId: i.listingId,
                  quantity: i.quantity,
                  grindSize: i.grindSize,
                })),
              }
            : {}),
        });

        if (!res.success) {
          toast.error("Gagal memproses pesanan", { description: res.error });
          return;
        }

        // Clean items from cart if checkout came from cart
        if (activeItems && activeItems.length > 0) {
          activeItems.forEach((i) => removeFromCart(i.listingId, i.grindSize));
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
        <div className="flex items-center justify-between">
          <Link
            href={activeItems ? "/cart" : `/product/${listing.slug}`}
            className="inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-primary-700 transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {activeItems ? "Kembali ke Keranjang Belanja" : "Kembali ke Detail Produk"}
          </Link>
          {activeItems && (
            <span className="text-xs bg-primary-50 text-primary-800 font-medium px-2 py-0.5 rounded border border-primary-200">
              Checkout Keranjang ({activeItems.length} Produk)
            </span>
          )}
        </div>

        {/* Ringkasan Produk (Multi-Item atau Single Item) */}
        <div className="border border-neutral-300 bg-surface-base rounded-sm p-5 space-y-4">
          <div className="border-b border-neutral-200 pb-2 flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-500">Dikirim dari:</p>
              <h2 className="text-sm font-bold text-neutral-900">
                {listing.seller.businessName} ({listing.seller.city})
              </h2>
            </div>
            <span className="text-[11px] font-mono text-neutral-500">
              Est. Bobot: {Math.round(totalWeightGrams / 1000)} kg
            </span>
          </div>

          {activeItems && activeItems.length > 0 ? (
            <div className="divide-y divide-neutral-100">
              {activeItems.map((item) => (
                <div
                  key={item.listingId}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded bg-neutral-100 relative overflow-hidden shrink-0 border border-neutral-200 flex items-center justify-center text-neutral-400">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <Package className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-neutral-900 truncate">
                        {item.title}
                      </p>
                      {item.grindSize && (
                        <span className="inline-block text-[10px] font-medium bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded border border-neutral-200 mt-0.5">
                          Gilingan: {item.grindSize}
                        </span>
                      )}
                      <p className="text-neutral-500 text-[11px] mt-0.5">
                        {formatRupiah(item.price)} × {item.quantity} {item.unit}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-neutral-900">
                      {formatRupiah(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
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
                  {grindParam && (
                    <span className="inline-block text-[10px] font-medium bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded border border-neutral-200 mt-0.5">
                      Gilingan: {grindParam}
                    </span>
                  )}
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
                    onClick={() =>
                      setQuantity((q) =>
                        listing.stock !== undefined ? Math.min(listing.stock, q + 1) : q + 1,
                      )
                    }
                    disabled={listing.stock !== undefined && quantity >= listing.stock}
                    className="w-7 h-7 rounded border border-neutral-300 flex items-center justify-center text-neutral-700 hover:bg-neutral-100 disabled:opacity-40"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Alamat Pengiriman Tersimpan & Quick Switcher / Inline Editor */}
        <div className="border border-neutral-300 bg-surface-base rounded-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
            <h3 className="font-display text-base font-semibold text-neutral-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary-600" /> Alamat Pengiriman Penerima
            </h3>
            <div className="flex items-center gap-3">
              {savedAddresses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(true)}
                  className="text-xs font-semibold text-primary-700 hover:text-primary-800 flex items-center gap-1 cursor-pointer"
                >
                  <MapPin className="w-3 h-3" />
                  Pilih Alamat Lain
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsEditingAddress((prev) => !prev)}
                className="text-xs font-semibold text-neutral-600 hover:text-neutral-800 flex items-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                {isEditingAddress ? "Tutup Editor" : "Ubah Alamat"}
              </button>
              <Link
                href={`/profile?next=${encodeURIComponent(
                  activeItems
                    ? `/checkout/${listing.slug}?cart=1&sellerId=${listing.sellerId}`
                    : `/checkout/${listing.slug}`,
                )}`}
                className="text-xs text-neutral-500 hover:text-neutral-700 flex items-center gap-1"
                title="Kelola profil akun"
              >
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {isEditingAddress ? (
            <div className="bg-neutral-50/70 border border-neutral-200 rounded p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between text-[11px] text-neutral-600 pb-1 border-b border-neutral-200">
                <span className="font-semibold text-neutral-800">
                  Edit Alamat untuk Pesanan Ini
                </span>
                <span className="text-primary-700">
                  Perubahan kota otomatis memperbarui ongkir
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Nama Penerima">
                  <Input
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Nama lengkap penerima"
                    className="text-xs h-9 bg-white"
                  />
                </FormField>
                <FormField label="No. WhatsApp / HP">
                  <Input
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="text-xs h-9 bg-white"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Kota / Kabupaten Tujuan">
                  <Input
                    value={buyerCity}
                    onChange={(e) => setBuyerCity(e.target.value)}
                    placeholder="Contoh: Bandung, Surabaya, Jakarta Selatan"
                    className="text-xs h-9 bg-white"
                  />
                </FormField>
                <FormField label="Provinsi & Kode Pos (Opsional)">
                  <div className="flex gap-2">
                    <Input
                      value={buyerProvince}
                      onChange={(e) => setBuyerProvince(e.target.value)}
                      placeholder="Provinsi"
                      className="text-xs h-9 bg-white flex-1"
                    />
                    <Input
                      value={buyerPostalCode}
                      onChange={(e) => setBuyerPostalCode(e.target.value)}
                      placeholder="Kodepos"
                      className="text-xs h-9 bg-white w-24"
                    />
                  </div>
                </FormField>
              </div>

              <FormField label="Alamat Lengkap & Patokan">
                <Input
                  value={buyerAddress}
                  onChange={(e) => setBuyerAddress(e.target.value)}
                  placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan"
                  className="text-xs h-9 bg-white"
                />
              </FormField>

              <div className="pt-1 flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    if (!buyerCity.trim() || !buyerAddress.trim() || !buyerName.trim()) {
                      toast.error("Nama, kota, dan alamat lengkap wajib diisi");
                      return;
                    }
                    setIsEditingAddress(false);
                    // Sync to cloud in background so address persists across devices
                    updateBuyerProfileAction({
                      name: buyerName.trim(),
                      phone: buyerPhone.trim(),
                      province: buyerProvince.trim(),
                      city: buyerCity.trim(),
                      postalCode: buyerPostalCode.trim(),
                      address: buyerAddress.trim(),
                    }).catch(() => {});
                    toast.success("Alamat pengiriman diperbarui");
                  }}
                  className="text-xs h-8 gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" /> Gunakan Alamat Ini
                </Button>
              </div>
            </div>
          ) : (
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
                {buyerProvince ? `, ${buyerProvince}` : ""}
                {buyerPostalCode ? ` (${buyerPostalCode})` : ""}
              </p>
              <p className="text-neutral-500 text-[11px] font-mono pt-1">
                Konfirmasi transaksi dikirim ke: {buyerEmail}
              </p>
            </div>
          )}

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

          {/* Modal Dialog: Pilih Alamat Pengiriman Tersimpan */}
          <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
            <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary-600" /> Pilih Alamat Pengiriman
                </DialogTitle>
                <DialogDescription className="text-xs text-neutral-500">
                  Pilih alamat tujuan tersimpan untuk menghitung estimasi ongkir otomatis.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2.5 pt-1">
                {savedAddresses.map((addr) => {
                  const isSelected =
                    buyerAddress === addr.address && buyerCity === addr.city;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => {
                        setBuyerName(addr.recipientName || buyerName);
                        setBuyerPhone(addr.phone || buyerPhone);
                        setBuyerCity(addr.city || "");
                        setBuyerProvince(addr.province || "");
                        setBuyerPostalCode(addr.postalCode || "");
                        setBuyerAddress(addr.address || "");
                        setIsEditingAddress(false);
                        setIsAddressModalOpen(false);
                        toast.success(`Alamat pengiriman diubah: ${addr.label || addr.city}`);
                      }}
                      className={cn(
                        "p-3 rounded border text-xs cursor-pointer transition-all space-y-1.5",
                        isSelected
                          ? "border-primary-600 bg-primary-50/50 ring-1 ring-primary-600"
                          : "border-neutral-200 hover:border-neutral-400 bg-white",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-neutral-900 font-mono uppercase text-[11px]">
                            {addr.label || "Alamat"}
                          </span>
                          {addr.isPrimary && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-primary-700 bg-primary-50 border-primary-300">
                              Utama
                            </Badge>
                          )}
                        </div>
                        {isSelected && (
                          <span className="text-[11px] font-semibold text-primary-700 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Digunakan
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-neutral-800">
                        {addr.recipientName} • <span className="font-mono text-neutral-600">{addr.phone}</span>
                      </p>
                      <p className="text-neutral-600 leading-snug">
                        {addr.address}
                      </p>
                      <p className="text-neutral-500 text-[11px]">
                        {addr.city}, {addr.province} {addr.postalCode ? `(${addr.postalCode})` : ""}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                <Link
                  href={`/profile?next=${encodeURIComponent(
                    activeItems
                      ? `/checkout/${listing.slug}?cart=1&sellerId=${listing.sellerId}`
                      : `/checkout/${listing.slug}`,
                  )}`}
                  className="text-xs text-primary-600 font-medium hover:underline flex items-center gap-1"
                >
                  + Kelola / Tambah Alamat
                </Link>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="text-xs h-8"
                >
                  Tutup
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Pilihan Ekspedisi / Kurir */}
        <div className="border border-neutral-300 bg-surface-base rounded-sm p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-2.5">
            <div>
              <h3 className="font-display text-base font-semibold text-neutral-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-primary-700" /> Pilihan Pengiriman
              </h3>
              <p className="text-xs text-neutral-600 mt-0.5">
                Estimasi dari gudang {listing.seller.businessName} ({listing.seller.city}).
              </p>
            </div>
            <span className="text-[11px] font-mono font-medium text-neutral-700 bg-neutral-100 border border-neutral-300 px-2 py-0.5 rounded">
              Bobot Paket: {(totalWeightGrams / 1000).toFixed(1)} kg
            </span>
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
                        Estimasi Tiba: <strong className="text-neutral-900 font-semibold">{rate.etd}</strong> • {rate.description}
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
              <span>
                Subtotal Produk ({activeItems ? `${activeQuantity} item` : `${quantity} ${listing.unit}`}):
              </span>
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

          {selectedCourier && (
            <div className="p-3 bg-neutral-50 rounded border border-neutral-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between font-medium text-neutral-900">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-primary-700" />
                  {selectedCourier.courierName} ({selectedCourier.service})
                </span>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                  Tiba: {selectedCourier.etd}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1 border-t border-neutral-200/60">
                <span>Total Berat Paket:</span>
                <span className="font-mono font-semibold text-neutral-800">
                  {(totalWeightGrams / 1000).toFixed(1)} kg
                </span>
              </div>
            </div>
          )}

          {listing.stock === 0 && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-800 text-xs">
              ⚠️ Maaf, produk ini saat ini telah habis terjual (sold out).
            </div>
          )}

          <Button
            type="button"
            variant="primary"
            size="lg"
            disabled={isPending || !selectedCourier || listing.stock === 0}
            onClick={handlePay}
            className="w-full justify-center gap-2 font-semibold"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses Transaksi...</span>
              </>
            ) : listing.stock === 0 ? (
              <span>Stok Habis Terjual</span>
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
