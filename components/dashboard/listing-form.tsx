"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  listingSchema,
  type ListingFormValues,
} from "@/lib/validations/listing.schema";
import { Category, Producer } from "@/types";
import { COFFEE_VARIETIES } from "@/lib/coffee/taxonomy";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Save, Plus, Trash2, Package, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  saveListingAction,
  saveGreenBeanSpecsAction,
  savePriceTiersAction,
  saveBundleItemsAction,
} from "@/actions/seller.actions";
import { useState } from "react";
import { ImageUploader } from "./image-uploader";

export interface ListingChildOption {
  id: string;
  title: string;
  stock?: number;
  price?: number;
}

interface ListingFormProps {
  categories: Category[];
  producers?: Producer[];
  hasRoastBatches?: boolean;
  defaultValues?: Partial<ListingFormValues>;
  initialPriceTiers?: Array<{ minQty: number; unitPrice: number }>;
  initialGreenBeanSpecs?: {
    screenSize?: string | null;
    moisturePct?: number | null;
    densityGl?: number | null;
    waterActivity?: number | null;
    primaryDefects?: number | null;
    secondaryDefects?: number | null;
    coaUrl?: string | null;
  } | null;
  initialBundleItems?: Array<{ childListingId: string; quantity: number }>;
  availableChildren?: ListingChildOption[];
  isEditing?: boolean;
  listingId?: string;
  className?: string;
}

const PROCESS_METHODS = [
  "Wash",
  "Natural",
  "Honey",
  "Wet Hulled",
  "Anaerobic",
] as const;
const ROAST_LEVELS = [
  "Light",
  "Medium-Light",
  "Medium",
  "Medium-Dark",
  "Dark",
] as const;
const STATUS_OPTIONS = [
  { value: "active", label: "Aktif" },
  { value: "draft", label: "Draf" },
  { value: "archived", label: "Arsip" },
] as const;

const FLAVOR_TAG_OPTIONS = [
  "Floral",
  "Melati",
  "Citrus",
  "Jeruk",
  "Berries",
  "Blackcurrant",
  "Stone Fruit",
  "Peach",
  "Tropical Fruit",
  "Nangka",
  "Chocolate",
  "Caramel",
  "Gula Aren",
  "Madu",
  "Nutty",
  "Spices",
  "Rempah",
  "Herbal",
] as const;

const MONTH_OPTIONS = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
] as const;

export function ListingForm({
  categories,
  producers = [],
  hasRoastBatches = false,
  defaultValues,
  initialPriceTiers = [],
  initialGreenBeanSpecs = null,
  initialBundleItems = [],
  availableChildren = [],
  isEditing = false,
  listingId,
  className,
}: ListingFormProps) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);

  // B2B Tiered Pricing State (J3)
  const [priceTiers, setPriceTiers] = useState<Array<{ minQty: number; unitPrice: number }>>(
    initialPriceTiers || [],
  );

  // Green Bean Technical Specs State (J3)
  const [greenBeanSpecs, setGreenBeanSpecs] = useState({
    screenSize: initialGreenBeanSpecs?.screenSize || "",
    moisturePct: initialGreenBeanSpecs?.moisturePct ?? "",
    densityGl: initialGreenBeanSpecs?.densityGl ?? "",
    waterActivity: initialGreenBeanSpecs?.waterActivity ?? "",
    primaryDefects: initialGreenBeanSpecs?.primaryDefects ?? "",
    secondaryDefects: initialGreenBeanSpecs?.secondaryDefects ?? "",
    coaUrl: initialGreenBeanSpecs?.coaUrl || "",
  });

  // Tasting Bundle State (J3)
  const [isBundle, setIsBundle] = useState<boolean>(
    Boolean(initialBundleItems && initialBundleItems.length > 0),
  );
  const [bundleItems, setBundleItems] = useState<Array<{ childListingId: string; quantity: number }>>(
    initialBundleItems || [],
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      processMethod: "Wash",
      roastLevel: "Medium",
      status: "draft",
      images: [],
      acidityScore: 0,
      bodyScore: 0,
      minOrderQty: 1,
      stock: 100,
      varieties: [],
      flavorTags: [],
      ...defaultValues,
    },
  });

  const getPriceTierError = (): string | null => {
    const basePrice = Number(watch("price") || 0);
    for (let i = 0; i < priceTiers.length; i++) {
      const t = priceTiers[i];
      if (t.minQty < 2) return `Tier ${i + 1}: Minimal pembelian minimal 2`;
      if (basePrice > 0 && t.unitPrice >= basePrice) {
        return `Tier ${i + 1}: Harga satuan (Rp${t.unitPrice.toLocaleString()}) harus lebih murah dari harga normal (Rp${basePrice.toLocaleString()})`;
      }
      if (i > 0) {
        const prev = priceTiers[i - 1];
        if (t.minQty <= prev.minQty) {
          return `Tier ${i + 1}: Minimal pembelian harus lebih besar dari Tier ${i} (${prev.minQty})`;
        }
        if (t.unitPrice >= prev.unitPrice) {
          return `Tier ${i + 1}: Harga satuan harus lebih murah dari Tier ${i} (Rp${prev.unitPrice.toLocaleString()})`;
        }
      }
    }
    return null;
  };

  const selectedCategoryId = watch("categoryId");
  const selectedCategory = categories.find(
    (c) => c.id === selectedCategoryId,
  );
  const isGreenBean =
    selectedCategory?.slug === "green-beans" ||
    selectedCategory?.name?.toLowerCase().includes("green") ||
    false;

  const onSubmit = async (data: ListingFormValues) => {
    // Validate price tiers monotonic constraint if present (J3)
    const tierErr = getPriceTierError();
    if (tierErr) {
      toast.error("Validasi Harga Bertingkat Gagal", { description: tierErr });
      return;
    }

    // Validate bundle items count if bundle is selected (J3)
    if (isBundle && (bundleItems.length < 2 || bundleItems.length > 5)) {
      toast.error("Validasi Paket Cicip (Bundle) Gagal", {
        description: "Paket cicip/bundle harus terdiri dari 2 hingga 5 varian produk.",
      });
      return;
    }

    try {
      const result = await saveListingAction(data, listingId);
      if (!result.success) {
        for (const [field, messages] of Object.entries(
          result.fieldErrors ?? {},
        )) {
          if (field in data)
            setError(field as keyof ListingFormValues, {
              message: messages[0],
            });
        }
        toast.error("Gagal menyimpan produk", { description: result.error });
        return;
      }

      const savedListingId = result.data.id;

      // 1. Save green bean technical specs if applicable (J3)
      if (isGreenBean) {
        await saveGreenBeanSpecsAction({
          listingId: savedListingId,
          screenSize: greenBeanSpecs.screenSize || null,
          moisturePct: greenBeanSpecs.moisturePct !== "" ? Number(greenBeanSpecs.moisturePct) : null,
          densityGl: greenBeanSpecs.densityGl !== "" ? Number(greenBeanSpecs.densityGl) : null,
          waterActivity: greenBeanSpecs.waterActivity !== "" ? Number(greenBeanSpecs.waterActivity) : null,
          primaryDefects: greenBeanSpecs.primaryDefects !== "" ? Number(greenBeanSpecs.primaryDefects) : null,
          secondaryDefects: greenBeanSpecs.secondaryDefects !== "" ? Number(greenBeanSpecs.secondaryDefects) : null,
          coaUrl: greenBeanSpecs.coaUrl || null,
        });
      }

      // 2. Save price tiers if defined (J3)
      if (priceTiers.length > 0) {
        await savePriceTiersAction({
          listingId: savedListingId,
          tiers: priceTiers.map((t) => ({
            minQty: Number(t.minQty),
            unitPrice: Number(t.unitPrice),
          })),
        });
      }

      // 3. Save bundle items if configured (J3)
      if (isBundle && bundleItems.length >= 2) {
        await saveBundleItemsAction({
          bundleListingId: savedListingId,
          items: bundleItems.map((b) => ({
            childListingId: b.childListingId,
            quantity: Number(b.quantity),
          })),
        });
      }

      toast.success(
        isEditing
          ? "Produk berhasil diperbarui"
          : "Produk berhasil ditambahkan",
        {
          description: data.title,
        },
      );
      router.push("/dashboard/listing");
      router.refresh();
    } catch {
      // ignore: UI error toast already handled
      toast.error("Gagal menyimpan produk", {
        description: "Terjadi kesalahan. Coba lagi.",
      });
    }
  };

  const selectedCategoryName = selectedCategory?.name;
  const isEquipment = selectedCategory?.slug === "equipment";

  const selectedStatus = watch("status");
  const selectedStatusLabel = STATUS_OPTIONS.find(
    (s) => s.value === selectedStatus,
  )?.label;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("space-y-6", className)}
    >
      {/* 1. Foto Produk */}
      <div className="border border-neutral-300 bg-surface-base rounded-sm p-6 space-y-4">
        <div>
          <h3 className="font-display text-lg text-neutral-900 font-semibold">
            Foto Produk
          </h3>
          <p className="text-xs text-neutral-600 mt-0.5">
            Unggah foto kemasan atau biji kopi (maksimal 3 foto, format JPG/PNG/WebP).
          </p>
        </div>
        <ImageUploader
          value={watch("images")}
          onChange={(images) =>
            setValue("images", images, {
              shouldValidate: true,
              shouldDirty: true,
            })
          }
          onBusyChange={setUploading}
          error={errors.images?.message}
          disabled={isSubmitting}
        />
      </div>

      {/* 2. Informasi Utama Produk */}
      <div className="border border-neutral-300 bg-surface-base rounded-sm p-6 space-y-5">
        <div>
          <h3 className="font-display text-lg text-neutral-900 font-semibold">
            Informasi Produk
          </h3>
          <p className="text-xs text-neutral-600 mt-0.5">
            Detail utama varian kopi yang akan ditampilkan di katalog publik.
          </p>
        </div>

        <FormField label="Judul Produk" required error={errors.title?.message}>
          <Input
            {...register("title")}
            placeholder="Contoh: Arabika Gayo Natural Anaerobic 200g"
          />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Kategori"
            required
            error={errors.categoryId?.message}
          >
            <Select
              value={selectedCategoryId ?? ""}
              onValueChange={(v) =>
                setValue("categoryId", v ?? "", { shouldValidate: true })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih kategori">
                  {selectedCategoryName || "Pilih kategori"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Status Publikasi" required error={errors.status?.message}>
            <Select
              value={selectedStatus ?? "draft"}
              onValueChange={(v) =>
                setValue(
                  "status",
                  (v as ListingFormValues["status"]) || "draft",
                  {
                    shouldValidate: true,
                  },
                )
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih status">
                  {selectedStatusLabel || "Pilih status"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>

        <FormField
          label="Deskripsi Produk"
          required
          error={errors.description?.message}
        >
          <Textarea
            {...register("description")}
            rows={4}
            placeholder="Jelaskan karakter rasa, proses pengolahan, varietas tanaman, dan keunggulan biji kopi Anda..."
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <FormField label="Harga (Rp)" required error={errors.price?.message}>
            <Input
              type="number"
              {...register("price", { valueAsNumber: true })}
              placeholder="135000"
            />
          </FormField>

          <FormField label="Satuan Kemasan" required error={errors.unit?.message}>
            <Input {...register("unit")} placeholder="kg, 250g, 500g, box" />
          </FormField>

          <FormField
            label="Min. Pemesanan"
            required
            error={errors.minOrderQty?.message}
          >
            <Input
              type="number"
              {...register("minOrderQty", { valueAsNumber: true })}
              placeholder="1"
            />
          </FormField>

          <FormField
            label="Stok Tersedia"
            error={errors.stock?.message}
            helperText="Jumlah inventaris produk"
          >
            <Input
              type="number"
              min="0"
              {...register("stock", {
                setValueAs: (v) => (v === "" || isNaN(v) ? undefined : Number(v)),
              })}
              placeholder="100"
            />
          </FormField>
        </div>

        {/* Harga Grosir / Bertingkat (B2B Tiers) */}
        <div className="pt-4 border-t border-neutral-200 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-neutral-900">
                Harga Grosir / Bertingkat (B2B Tiers)
              </h4>
              <p className="text-xs text-neutral-600">
                Tawarkan diskon volume untuk pembelian grosir. Minimal kuantitas harus meningkat dan harga satuan harus menurun.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const lastTier = priceTiers[priceTiers.length - 1];
                const basePrice = Number(watch("price") || 0);
                const nextQty = lastTier ? lastTier.minQty + 5 : 5;
                const nextPrice = lastTier
                  ? Math.max(1000, Math.floor(lastTier.unitPrice * 0.95))
                  : Math.max(1000, Math.floor((basePrice || 100000) * 0.9));
                setPriceTiers([...priceTiers, { minQty: nextQty, unitPrice: nextPrice }]);
              }}
              className="gap-1.5 text-xs coarse:min-h-11"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Tier</span>
            </Button>
          </div>

          {priceTiers.length > 0 && (
            <div className="space-y-2">
              {priceTiers.map((tier, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-neutral-50 p-2.5 rounded-sm border border-neutral-200">
                  <span className="text-xs font-medium text-neutral-600 w-16">
                    Tier {idx + 1}
                  </span>
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-neutral-600 block mb-1">
                        Min. Pembelian ({watch("unit") || "unit"})
                      </label>
                      <Input
                        type="number"
                        min="2"
                        value={tier.minQty}
                        onChange={(e) => {
                          const updated = [...priceTiers];
                          updated[idx] = { ...updated[idx], minQty: Number(e.target.value) };
                          setPriceTiers(updated);
                        }}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-neutral-600 block mb-1">
                        Harga Satuan (Rp)
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={tier.unitPrice}
                        onChange={(e) => {
                          const updated = [...priceTiers];
                          updated[idx] = { ...updated[idx], unitPrice: Number(e.target.value) };
                          setPriceTiers(updated);
                        }}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Hapus tier ${idx + 1}`}
                    onClick={() => {
                      setPriceTiers(priceTiers.filter((_, i) => i !== idx));
                    }}
                    className="text-neutral-600 hover:text-red-600 coarse:min-h-11"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {getPriceTierError() && (
                <p className="text-xs text-red-600 font-medium">
                  ⚠️ {getPriceTierError()}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2b. Paket Cicip / Bundle (Tasting Flight) */}
      <div className="border border-neutral-300 bg-surface-base rounded-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-neutral-700" />
            <div>
              <h3 className="font-display text-lg text-neutral-900 font-semibold">
                Paket Cicip / Bundle (Tasting Flight)
              </h3>
              <p className="text-xs text-neutral-600 mt-0.5">
                Gabungkan 2 hingga 5 produk menjadi 1 paket cicip. Stok dihitung otomatis dari produk komponen.
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isBundle}
              onChange={(e) => {
                const checked = e.target.checked;
                setIsBundle(checked);
                if (!checked) {
                  setBundleItems([]);
                } else if (bundleItems.length === 0 && availableChildren.length >= 2) {
                  setBundleItems([
                    { childListingId: availableChildren[0].id, quantity: 1 },
                    { childListingId: availableChildren[1].id, quantity: 1 },
                  ]);
                }
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-800"></div>
          </label>
        </div>

        {isBundle && (
          <div className="pt-3 border-t border-neutral-200 space-y-3">
            {availableChildren.length === 0 ? (
              <p className="text-xs text-neutral-600 bg-neutral-50 p-3 rounded-sm border border-neutral-200">
                Belum ada produk aktif lain di toko Anda untuk dijadikan komponen bundle. Buat produk satuan terlebih dahulu.
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  {bundleItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 bg-neutral-50 p-2.5 rounded-sm border border-neutral-200"
                    >
                      <span className="text-xs font-medium text-neutral-600 w-16">
                        Item #{idx + 1}
                      </span>
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="text-xs text-neutral-600 block mb-1">
                            Pilih Produk Komponen
                          </label>
                          <select
                            value={item.childListingId}
                            onChange={(e) => {
                              const updated = [...bundleItems];
                              updated[idx] = { ...updated[idx], childListingId: e.target.value };
                              setBundleItems(updated);
                            }}
                            className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs bg-white"
                          >
                            {availableChildren.map((child) => (
                              <option key={child.id} value={child.id}>
                                {child.title} (Stok: {child.stock ?? 0})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-neutral-600 block mb-1">
                            Jumlah per Paket
                          </label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const updated = [...bundleItems];
                              updated[idx] = {
                                ...updated[idx],
                                quantity: Math.max(1, Number(e.target.value)),
                              };
                              setBundleItems(updated);
                            }}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Hapus komponen ${idx + 1}`}
                        onClick={() => {
                          setBundleItems(bundleItems.filter((_, i) => i !== idx));
                        }}
                        className="text-neutral-600 hover:text-red-600 coarse:min-h-11"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <p className="text-xs text-neutral-600">
                    Terpilih: {bundleItems.length} dari 2–5 komponen.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={bundleItems.length >= 5 || bundleItems.length >= availableChildren.length}
                    onClick={() => {
                      const unusedChild = availableChildren.find(
                        (c) => !bundleItems.some((bi) => bi.childListingId === c.id),
                      );
                      if (unusedChild) {
                        setBundleItems([
                          ...bundleItems,
                          { childListingId: unusedChild.id, quantity: 1 },
                        ]);
                      }
                    }}
                    className="gap-1.5 text-xs coarse:min-h-11"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Komponen</span>
                  </Button>
                </div>

                {bundleItems.length < 2 && (
                  <p className="text-xs text-amber-700 font-medium">
                    ⚠️ Paket cicip harus memiliki minimal 2 komponen produk.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* 3. Spesifikasi & Profil Rasa */}
      {isEquipment ? (
        <div className="border border-neutral-300 bg-surface-base rounded-sm p-6 space-y-2">
          <h3 className="font-display text-lg text-neutral-900 font-semibold">
            Spesifikasi Produk (Alat & Peralatan)
          </h3>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Kategori alat seduh dan perlengkapan barista (Equipment) tidak memerlukan spesifikasi profil rasa kopi (seperti origin daerah asal, proses paska panen, tingkat sangrai, dan catatan rasa). Informasi judul, foto, deskripsi, harga, dan stok di atas sudah mencukupi untuk pembeli.
          </p>
        </div>
      ) : (
        <div className="border border-neutral-300 bg-surface-base rounded-sm p-6 space-y-5">
          <div>
            <h3 className="font-display text-lg text-neutral-900 font-semibold">
              Spesifikasi & Karakter Rasa
            </h3>
            <p className="text-xs text-neutral-600 mt-0.5">
              Data origin, sangrai, dan skor evaluasi cupping untuk visualisasi radar chart rasa.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormField
            label="Daerah Asal (Origin)"
            required
            error={errors.originRegion?.message}
            helperText="Pilih saran atau ketik daerah asal lainnya"
          >
            <Input
              {...register("originRegion")}
              list="origin-suggestions"
              placeholder="Contoh: Aceh Gayo, Toraja, Yirgacheffe..."
            />
            <datalist id="origin-suggestions">
              <option value="Aceh Gayo" />
              <option value="Mandheling" />
              <option value="Java Preanger" />
              <option value="Toraja Sapan" />
              <option value="Kintamani" />
              <option value="Flores Bajawa" />
              <option value="Wamena" />
              <option value="Temanggung" />
              <option value="Ijen Raung" />
              <option value="Kerinci" />
              <option value="Yirgacheffe (Ethiopia)" />
              <option value="Sidama (Ethiopia)" />
              <option value="Huila (Colombia)" />
              <option value="Antigua (Guatemala)" />
              <option value="Tarrazú (Costa Rica)" />
              <option value="Nyeri (Kenya)" />
            </datalist>
          </FormField>

          <FormField
            label="Metode Proses"
            required
            error={errors.processMethod?.message}
          >
            <Select
              value={watch("processMethod") ?? "Wash"}
              onValueChange={(v) =>
                setValue(
                  "processMethod",
                  (v as ListingFormValues["processMethod"]) || "Wash",
                  { shouldValidate: true },
                )
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih metode">
                  {watch("processMethod") || "Pilih metode"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PROCESS_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            label="Tingkat Sangrai (Roast Level)"
            required
            error={errors.roastLevel?.message}
          >
            <Select
              value={watch("roastLevel") ?? "Medium"}
              onValueChange={(v) =>
                setValue(
                  "roastLevel",
                  (v as ListingFormValues["roastLevel"]) || "Medium",
                  { shouldValidate: true },
                )
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih tingkat">
                  {watch("roastLevel") || "Pilih tingkat"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ROAST_LEVELS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            label="Tanggal Sangrai"
            required
            error={errors.roastDate?.message}
            helperText={
              hasRoastBatches
                ? "Tanggal sangrai diturunkan otomatis dari batch pemanggangan Anda."
                : "Tanggal pemanggangan batch kopi"
            }
          >
            <Input
              type="date"
              max={new Date().toLocaleDateString("en-CA")}
              readOnly={hasRoastBatches}
              className={hasRoastBatches ? "bg-neutral-100 cursor-not-allowed text-neutral-600" : ""}
              {...register("roastDate")}
            />
          </FormField>

          <FormField
            label="Jadwal Sangrai Berikutnya"
            error={errors.nextRoastDate?.message}
            helperText="Opsional: Tanggal perkiraan batch berikutnya untuk mengaktifkan antrean waitlist"
          >
            <Input
              type="date"
              min={new Date().toLocaleDateString("en-CA")}
              {...register("nextRoastDate")}
            />
          </FormField>

          <FormField
            label="Tahun Panen (Crop Year)"
            error={errors.cropYear?.message}
            helperText="Opsional (standar B2B, misal: 2024/2025)"
          >
            <Input
              {...register("cropYear")}
              placeholder="Contoh: 2024/2025"
            />
          </FormField>

          <FormField
            label="Kadar Air / Moisture (%)"
            error={errors.moistureContent?.message}
            helperText="Opsional (spesialti: 10.0 - 12.5%)"
          >
            <Input
              type="number"
              step="0.1"
              min="0"
              max="100"
              {...register("moistureContent", {
                setValueAs: (v) => (v === "" || isNaN(v) ? undefined : Number(v)),
              })}
              placeholder="Contoh: 11.2"
            />
          </FormField>

          <FormField
            label="Skor Cupping (SCA)"
            error={errors.cuppingScore?.message}
            helperText="Opsional (spesialti: 80 - 100)"
          >
            <Input
              type="number"
              step="0.25"
              min="0"
              max="100"
              {...register("cuppingScore", {
                setValueAs: (v) => (v === "" || isNaN(v) ? undefined : Number(v)),
              })}
              placeholder="Contoh: 85.5"
            />
          </FormField>

          <FormField
            label="Ketinggian (Altitude)"
            error={errors.altitude?.message}
            helperText="Opsional (misal: 1.400 - 1.600 mdpl)"
          >
            <Input
              {...register("altitude")}
              placeholder="Contoh: 1.400 - 1.600 mdpl"
            />
          </FormField>
        </div>

        <div>
          <label className="text-xs font-semibold text-neutral-900 uppercase tracking-wide block mb-1.5">
            Tag Roda Rasa Kopi (Flavor Wheel)
          </label>
          <p className="text-xs text-neutral-600 mb-2">
            Pilih tag aroma dan rasa dominan untuk mempermudah pembeli mencari profil kopi serupa.
          </p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {FLAVOR_TAG_OPTIONS.map((tag) => {
              const currentTags = watch("flavorTags") || [];
              const isSelected = currentTags.includes(tag);
              return (
                <button
                  type="button"
                  key={tag}
                  onClick={() => {
                    const updated = isSelected
                      ? currentTags.filter((t) => t !== tag)
                      : [...currentTags, tag];
                    setValue("flavorTags", updated, { shouldValidate: true });
                  }}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors coarse:min-h-11 ${
                    isSelected
                      ? "bg-amber-800 text-white"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-300"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        <FormField
          label="Catatan Rasa Bebas (Flavor Notes)"
          required
          error={errors.flavorNotes?.message}
          helperText="Pisahkan dengan tanda koma, contoh: Nangka, Madu, Gula Aren, Floral"
        >
          <Input
            {...register("flavorNotes")}
            placeholder="Nangka, Madu, Gula Aren, Floral"
          />
        </FormField>

        <div className="space-y-2 pt-3 border-t border-neutral-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-900 uppercase tracking-wide">
              Skor Karakter Rasa (0.0 - 5.0)
            </span>
            <span className="text-xs text-neutral-600 font-mono">
              Skala 0 hingga 5
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <FormField
              label="Acidity"
              required
              error={errors.acidityScore?.message}
            >
              <Input
                type="number"
                step="0.1"
                min="0"
                max="5"
                {...register("acidityScore", { valueAsNumber: true })}
              />
            </FormField>
            <FormField label="Body" required error={errors.bodyScore?.message}>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="5"
                {...register("bodyScore", { valueAsNumber: true })}
              />
            </FormField>
            <FormField label="Sweetness" error={errors.sweetnessScore?.message}>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="5"
                {...register("sweetnessScore", { valueAsNumber: true })}
              />
            </FormField>
            <FormField label="Aroma" error={errors.aromaScore?.message}>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="5"
                {...register("aromaScore", { valueAsNumber: true })}
              />
            </FormField>
            <FormField label="Aftertaste" error={errors.aftertasteScore?.message}>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="5"
                {...register("aftertasteScore", { valueAsNumber: true })}
              />
            </FormField>
          </div>
        </div>
      </div>
      )}

      {/* 3b. Spesifikasi Teknis Green Bean (J3) */}
      {isGreenBean && (
        <div className="border border-neutral-300 bg-surface-base rounded-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-neutral-700" />
            <div>
              <h3 className="font-display text-lg text-neutral-900 font-semibold">
                Spesifikasi Teknis Green Bean (Standar SCA / Ekspor)
              </h3>
              <p className="text-xs text-neutral-600 mt-0.5">
                Parameter fisik biji mentah untuk kebutuhan roastery dan pembeli grosir B2B.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FormField
              label="Ukuran Layar (Screen Size)"
              helperText="Misal: 16-18, 14, PB"
            >
              <Input
                value={greenBeanSpecs.screenSize}
                onChange={(e) =>
                  setGreenBeanSpecs({ ...greenBeanSpecs, screenSize: e.target.value })
                }
                placeholder="16-18"
              />
            </FormField>

            <FormField
              label="Kadar Air / Moisture (%)"
              helperText="Rentang ideal: 10.0 - 12.0%"
            >
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={greenBeanSpecs.moisturePct}
                onChange={(e) =>
                  setGreenBeanSpecs({ ...greenBeanSpecs, moisturePct: e.target.value })
                }
                placeholder="11.2"
              />
            </FormField>

            <FormField
              label="Densitas / Kepadatan (g/L)"
              helperText="Misal: 700 - 850 g/L"
            >
              <Input
                type="number"
                step="1"
                min="0"
                value={greenBeanSpecs.densityGl}
                onChange={(e) =>
                  setGreenBeanSpecs({ ...greenBeanSpecs, densityGl: e.target.value })
                }
                placeholder="720"
              />
            </FormField>

            <FormField
              label="Aktivitas Air (Water Activity - aw)"
              helperText="Maksimal: 0.70 aw"
            >
              <Input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={greenBeanSpecs.waterActivity}
                onChange={(e) =>
                  setGreenBeanSpecs({ ...greenBeanSpecs, waterActivity: e.target.value })
                }
                placeholder="0.55"
              />
            </FormField>

            <FormField
              label="Cacat Primer (Primary Defects)"
              helperText="Jumlah biji cacat primer per 350g"
            >
              <Input
                type="number"
                min="0"
                value={greenBeanSpecs.primaryDefects}
                onChange={(e) =>
                  setGreenBeanSpecs({ ...greenBeanSpecs, primaryDefects: e.target.value })
                }
                placeholder="0"
              />
            </FormField>

            <FormField
              label="Cacat Sekunder (Secondary Defects)"
              helperText="Jumlah biji cacat sekunder per 350g"
            >
              <Input
                type="number"
                min="0"
                value={greenBeanSpecs.secondaryDefects}
                onChange={(e) =>
                  setGreenBeanSpecs({ ...greenBeanSpecs, secondaryDefects: e.target.value })
                }
                placeholder="3"
              />
            </FormField>

            <div className="sm:col-span-2">
              <FormField
                label="URL Certificate of Analysis (COA)"
                helperText="Tautan file PDF / lab cupping report jika ada"
              >
                <Input
                  type="url"
                  value={greenBeanSpecs.coaUrl}
                  onChange={(e) =>
                    setGreenBeanSpecs({ ...greenBeanSpecs, coaUrl: e.target.value })
                  }
                  placeholder="https://storage.example.com/coa/gayo-lot-1.pdf"
                />
              </FormField>
            </div>
          </div>
        </div>
      )}

      {/* 4. Asal-usul & Ketertelusuran Petani */}
      {!isEquipment && (
        <div className="border border-neutral-300 bg-surface-base rounded-sm p-6 space-y-5">
          <div>
            <h3 className="font-display text-lg text-neutral-900 font-semibold">
              Asal-usul & Ketertelusuran (Traceability)
            </h3>
            <p className="text-xs text-neutral-600 mt-0.5">
              Identitas produser, kode lot, varietas tanaman, dan protokol pascapanen kopi untuk transparansi pembeli.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField
              label="Produser / Mitra Tani"
              error={errors.producerId?.message}
              helperText="Pilih mitra petani terdaftar atau kosongkan jika mandiri"
            >
              <select
                {...register("producerId")}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm bg-white"
              >
                <option value="">Tanpa produser terdaftar / Mandiri</option>
                {producers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.kind}{p.claimsVerifiedAt ? " - Terverifikasi" : ""})
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Identitas Kode Lot"
              error={errors.lotCode?.message}
              helperText="Opsional (misal: LOT-GAYO-2025-01)"
            >
              <Input {...register("lotCode")} placeholder="LOT-GAYO-2025-01" />
            </FormField>

            <FormField
              label="Bulan Panen (Harvest Month)"
              error={errors.harvestMonth?.message}
              helperText="Opsional: Bulan pemetikan ceri kopi"
            >
              <select
                {...register("harvestMonth", {
                  setValueAs: (v) => (v === "" || isNaN(v) ? undefined : Number(v)),
                })}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm bg-white"
              >
                <option value="">Pilih bulan panen</option>
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Durasi Fermentasi (Jam)"
              error={errors.fermentationHours?.message}
              helperText="Opsional: Jam fermentasi ceri"
            >
              <Input
                type="number"
                min="0"
                max="720"
                {...register("fermentationHours", {
                  setValueAs: (v) => (v === "" || isNaN(v) ? undefined : Number(v)),
                })}
                placeholder="Contoh: 72"
              />
            </FormField>

            <FormField
              label="Durasi Penjemuran (Hari)"
              error={errors.dryingDays?.message}
              helperText="Opsional: Hari pengeringan di bed jemur"
            >
              <Input
                type="number"
                min="0"
                max="90"
                {...register("dryingDays", {
                  setValueAs: (v) => (v === "" || isNaN(v) ? undefined : Number(v)),
                })}
                placeholder="Contoh: 14"
              />
            </FormField>
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-900 uppercase tracking-wide block mb-1.5">
              Varietas Tanaman Kopi
            </label>
            <p className="text-xs text-neutral-600 mb-2">
              Pilih satu atau lebih varietas kultivar tanaman kopi pada lot ini.
            </p>
            <div className="flex flex-wrap gap-2">
              {COFFEE_VARIETIES.map((v) => {
                const currentVarieties = watch("varieties") || [];
                const isSelected = currentVarieties.includes(v.id);
                return (
                  <button
                    type="button"
                    key={v.id}
                    onClick={() => {
                      const updated = isSelected
                        ? currentVarieties.filter((x) => x !== v.id)
                        : [...currentVarieties, v.id];
                      setValue("varieties", updated, { shouldValidate: true });
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors coarse:min-h-11 ${
                      isSelected
                        ? "bg-primary-800 text-white border-primary-800"
                        : "bg-neutral-100 text-neutral-700 border-neutral-300 hover:bg-neutral-200"
                    }`}
                  >
                    {v.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          disabled={isSubmitting}
          onClick={() => router.back()}
        >
          Batal
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting || uploading}
          className="min-w-[140px] justify-center gap-2"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isEditing ? "Simpan Perubahan" : "Tambah Produk"}</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
