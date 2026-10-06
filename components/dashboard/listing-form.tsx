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
      toast.error("Gagal menyimpan produk", {
        description: "Terjadi kesalahan. Coba lagi.",
      });
    }
  };

  const selectedCategoryId = watch("categoryId");
  const selectedCategoryName = categories.find(
    (c) => c.id === selectedCategoryId,
  )?.name;

  const selectedStatus = watch("status");
  const selectedStatusLabel = STATUS_OPTIONS.find(
    (s) => s.value === selectedStatus,
  )?.label;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("space-y-8", className)}
    >
      <div className="space-y-5">
        <h3 className="font-display text-2xl text-neutral-900 font-semibold">
          Foto Produk
        </h3>
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
      <div className="space-y-5">
        <h3 className="font-display text-2xl text-neutral-900 font-semibold">
          Informasi Produk
        </h3>

        <FormField label="Judul Produk" required error={errors.title?.message}>
          <Input
            {...register("title")}
            placeholder="Contoh: Arabika Gayo Natural Anaerobic 200g"
          />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
              <SelectTrigger>
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

          <FormField label="Status" required error={errors.status?.message}>
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
              <SelectTrigger>
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
            placeholder="Jelaskan karakter, proses pengolahan, dan keunggulan kopi Anda..."
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <FormField label="Harga (Rp)" required error={errors.price?.message}>
            <Input
              type="number"
              {...register("price", { valueAsNumber: true })}
              placeholder="135000"
            />
          </FormField>

          <FormField label="Satuan" required error={errors.unit?.message}>
            <Input {...register("unit")} placeholder="kg, 250g, box" />
          </FormField>

          <FormField
            label="Min. Order"
            required
            error={errors.minOrderQty?.message}
          >
            <Input
              type="number"
              {...register("minOrderQty", { valueAsNumber: true })}
              placeholder="1"
            />
          </FormField>
        </div>
      </div>

      <div className="space-y-5">
        <h3 className="font-display text-2xl text-neutral-900 font-semibold">
          Profil Rasa
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField
            label="Daerah Asal"
            required
            error={errors.originRegion?.message}
          >
            <Input
              {...register("originRegion")}
              placeholder="Gayo, Toraja, Kintamani..."
            />
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
              <SelectTrigger>
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
            label="Tingkat Sangrai"
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
              <SelectTrigger>
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
        </div>

        <FormField
          label="Catatan Rasa"
          required
          error={errors.flavorNotes?.message}
          helperText="Pisahkan dengan koma, misal: Nangka, Anggur Merah, Gula Aren"
        >
          <Input
            {...register("flavorNotes")}
            placeholder="Nangka, Anggur Merah, Gula Aren"
          />
        </FormField>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-300">
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
          className="gap-2"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isEditing ? "Simpan Perubahan" : "Tambah Produk"}
        </Button>
      </div>
    </form>
  );
}
