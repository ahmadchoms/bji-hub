"use client";

import { useEffect, useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  sellerProfileSchema,
  type SellerProfileFormValues,
} from "@/lib/validations/seller-profile.schema";
import { SellerProfile } from "@/types";
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
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { useRouter } from "next/navigation";
import { updateProfileAction } from "@/actions/seller.actions";
import { fetchProvinces, fetchRegencies, type RegionItem } from "@/lib/regions";

interface ProfileFormProps {
  seller: SellerProfile;
  className?: string;
}

export function ProfileForm({ seller, className }: ProfileFormProps) {
  const router = useRouter();
  const isInitialMount = useRef(true);

  const [provinces, setProvinces] = useState<RegionItem[]>([]);
  const [cities, setCities] = useState<RegionItem[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>("");
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SellerProfileFormValues>({
    resolver: zodResolver(sellerProfileSchema),
    defaultValues: {
      businessName: seller.businessName,
      province: seller.province,
      city: seller.city,
      address: seller.address,
      whatsappNumber: seller.whatsappNumber,
      bio: seller.bio ?? "",
    },
  });

  // 1. Fetch daftar provinsi saat komponen mount
  useEffect(() => {
    let ignore = false;

    async function loadProvinces() {
      setLoadingProvinces(true);
      try {
        const data = await fetchProvinces();
        if (ignore) return;
        setProvinces(data);

        if (seller.province) {
          const matched = data.find(
            (p) =>
              p.name.toLowerCase() === seller.province.trim().toLowerCase(),
          );
          if (matched) {
            setSelectedProvinceId(matched.id);
            setValue("province", matched.name);
          }
        }
      } catch {
        if (!ignore) toast.error("Gagal memuat data provinsi");
      } finally {
        if (!ignore) setLoadingProvinces(false);
      }
    }

    loadProvinces();
    return () => {
      ignore = true;
    };
  }, [seller.province, setValue]);

  // 2. Fetch kota/kabupaten ketika selectedProvinceId berubah
  useEffect(() => {
    if (!selectedProvinceId) {
      setCities([]);
      return;
    }

    let ignore = false;

    async function loadCities() {
      setLoadingCities(true);
      try {
        const data = await fetchRegencies(selectedProvinceId);
        if (ignore) return;
        setCities(data);

        if (isInitialMount.current && seller.city) {
          isInitialMount.current = false;
          const matchedCity = data.find(
            (c) => c.name.toLowerCase() === seller.city.trim().toLowerCase(),
          );
          if (matchedCity) {
            setValue("city", matchedCity.name);
          }
        }
      } catch {
        if (!ignore) toast.error("Gagal memuat data kota/kabupaten");
      } finally {
        if (!ignore) setLoadingCities(false);
      }
    }

    loadCities();
    return () => {
      ignore = true;
    };
  }, [selectedProvinceId, seller.city, setValue]);

  const handleProvinceChange = (provinceName: string | null) => {
    const val = provinceName ?? "";
    setValue("province", val, { shouldValidate: true });
    // Reset kota setiap kali provinsi berganti
    setValue("city", "", { shouldValidate: true });

    if (!val) {
      setSelectedProvinceId("");
      setCities([]);
      return;
    }

    const selected = provinces.find((p) => p.name === val);
    setSelectedProvinceId(selected ? selected.id : "");
  };

  const onSubmit = async (data: SellerProfileFormValues) => {
    try {
      const result = await updateProfileAction(data);
      if (!result.success) {
        for (const [field, messages] of Object.entries(
          result.fieldErrors ?? {},
        )) {
          if (field in data) {
            setError(field as keyof SellerProfileFormValues, {
              message: messages[0],
            });
          }
        }
        toast.error("Gagal memperbarui profil", { description: result.error });
        return;
      }
      toast.success("Profil toko berhasil diperbarui", {
        description: data.businessName,
      });
      router.refresh();
    } catch {
      toast.error("Gagal memperbarui profil", {
        description: "Terjadi kesalahan. Coba lagi.",
      });
    }
  };

  return (
    <div className={cn("space-y-8", className)}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="border border-neutral-300 bg-surface-base rounded-sm p-5 space-y-5">
          <h3 className="font-display text-lg text-neutral-900 font-semibold pb-3 border-b border-neutral-300">
            Informasi Toko
          </h3>

          <FormField
            label="Nama Usaha"
            required
            error={errors.businessName?.message}
          >
            <Input {...register("businessName")} />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Field Provinsi */}
            <FormField
              label="Provinsi"
              required
              error={errors.province?.message}
            >
              <Controller
                name="province"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || undefined}
                    onValueChange={handleProvinceChange}
                    disabled={loadingProvinces}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          loadingProvinces
                            ? "Memuat provinsi..."
                            : "Pilih Provinsi"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {provinces.map((province) => (
                        <SelectItem key={province.id} value={province.name}>
                          {province.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            {/* Field Kota / Kabupaten */}
            <FormField
              label="Kota / Kabupaten"
              required
              error={errors.city?.message}
            >
              <Controller
                name="city"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || undefined}
                    onValueChange={(val) =>
                      setValue("city", val ?? "", { shouldValidate: true })
                    }
                    disabled={!selectedProvinceId || loadingCities}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          loadingCities
                            ? "Memuat kota/kabupaten..."
                            : !selectedProvinceId
                              ? "Pilih provinsi dahulu"
                              : "Pilih Kota / Kabupaten"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {/* Tampilkan nilai lama sebagai opsi jika belum ada di daftar hasil fetch */}
                      {field.value &&
                        !cities.some((c) => c.name === field.value) && (
                          <SelectItem value={field.value}>
                            {field.value}
                          </SelectItem>
                        )}
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.name}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </div>

          <FormField
            label="Alamat Lengkap"
            required
            error={errors.address?.message}
          >
            <Textarea {...register("address")} rows={2} />
          </FormField>

          <FormField
            label="Nomor WhatsApp"
            required
            error={errors.whatsappNumber?.message}
            helperText="Format: 08123456789 atau 628123456789"
          >
            <Input {...register("whatsappNumber")} placeholder="08123456789" />
          </FormField>

          <FormField label="Bio / Deskripsi Toko" error={errors.bio?.message}>
            <Textarea
              {...register("bio")}
              rows={3}
              placeholder="Ceritakan tentang usaha kopi Anda..."
            />
          </FormField>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-300">
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Simpan Profil
          </Button>
        </div>
      </form>

      <div className="border border-neutral-300 bg-surface-base rounded-sm p-5 space-y-4">
        <h3 className="font-display text-lg text-neutral-900 font-semibold pb-3 border-b border-neutral-300">
          Verifikasi Toko
        </h3>

        {seller.isVerified ? (
          <div className="flex items-center gap-3 p-4 bg-accent-100 rounded-sm">
            <VerifiedBadge />
            <p className="text-sm text-accent-700">
              Toko Anda sudah terverifikasi oleh tim Biji.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-neutral-600 leading-relaxed">
              Verifikasi toko untuk mendapat badge kepercayaan dan meningkatkan
              kredibilitas di mata pembeli.
            </p>

            <div className="border-2 border-dashed border-neutral-300 rounded-sm p-8 text-center hover:border-neutral-500 transition-colors cursor-pointer">
              <p className="text-sm font-medium text-neutral-700">
                Unggah Dokumen Verifikasi
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                SIUP, NIB, atau sertifikat organik (PDF/JPG, maks 2MB)
              </p>
            </div>

            <Button variant="secondary" className="gap-2">
              <span>Ajukan Verifikasi</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
