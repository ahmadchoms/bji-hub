"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  listingSchema,
  type ListingFormValues,
} from "@/lib/validations/listing.schema";
import { Category } from "@/types";
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
import { Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { saveListingAction } from "@/actions/seller.actions";
import { useState } from "react";
import { ImageUploader } from "./image-uploader";

interface ListingFormProps {
  categories: Category[];
  defaultValues?: Partial<ListingFormValues>;
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

export function ListingForm({
  categories,
  defaultValues,
  isEditing = false,
  listingId,
  className,
}: ListingFormProps) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
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
      ...defaultValues,
    },
  });

  const onSubmit = async (data: ListingFormValues) => {
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

  const selectedCategoryId = watch("categoryId");
  const selectedCategory = categories.find(
    (c) => c.id === selectedCategoryId,
  );
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
          >
            <Input type="date" {...register("roastDate")} />
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

        <FormField
          label="Catatan Rasa (Flavor Notes)"
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
            <span className="text-[11px] text-neutral-500 font-mono">
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
