"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Store } from "lucide-react";
import {
  sellerOnboardingSchema,
  SellerOnboardingFormValues,
} from "@/lib/validations/auth.schema";
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
import { fetchProvinces, fetchRegencies, type RegionItem } from "@/lib/regions";
import { becomeSellerAction } from "@/actions/auth.actions";

export function SellerOnboardingForm() {
  const [isLoading, setIsLoading] = useState(false);
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
    formState: { errors },
  } = useForm<SellerOnboardingFormValues>({
    resolver: zodResolver(sellerOnboardingSchema),
    defaultValues: {
      businessName: "",
      whatsappNumber: "",
      province: "",
      city: "",
      address: "",
    },
  });

  useEffect(() => {
    let ignore = false;
    async function loadProvinces() {
      setLoadingProvinces(true);
      try {
        const data = await fetchProvinces();
        if (!ignore) setProvinces(data);
      } catch {
        if (!ignore) toast.error("Gagal memuat daftar provinsi");
      } finally {
        if (!ignore) setLoadingProvinces(false);
      }
    }
    loadProvinces();
    return () => {
      ignore = true;
    };
  }, []);

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
        if (!ignore) setCities(data);
      } catch {
        if (!ignore) toast.error("Gagal memuat daftar kota/kabupaten");
      } finally {
        if (!ignore) setLoadingCities(false);
      }
    }
    loadCities();
    return () => {
      ignore = true;
    };
  }, [selectedProvinceId]);

  const handleProvinceChange = (provinceName: string | null) => {
    const val = provinceName ?? "";
    setValue("province", val, { shouldValidate: true });
    setValue("city", "", { shouldValidate: true });
    const matched = provinces.find((p) => p.name === val);
    setSelectedProvinceId(matched ? matched.id : "");
  };

  const onSubmit = async (values: SellerOnboardingFormValues) => {
    setIsLoading(true);
    try {
      const result = await becomeSellerAction(values);
      if (!result.success) {
        toast.error("Gagal membuka toko", { description: result.error });
        setIsLoading(false);
        return;
      }
      toast.success("Toko berhasil dibuka!", {
        description: `Selamat datang di Biji Hub, ${values.businessName}. Mengalihkan...`,
      });
      window.location.href = result.data.redirectTo;
    } catch {
      toast.error("Gagal membuka toko", {
        description: "Terjadi kesalahan saat memproses data.",
      });
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormField
        label="Nama Toko / Kebun / Roastery"
        required
        error={errors.businessName?.message}
      >
        <Input
          type="text"
          {...register("businessName")}
          placeholder="Contoh: Puntang Highland Coffee"
          aria-invalid={!!errors.businessName}
        />
      </FormField>

      <FormField
        label="Nomor WhatsApp Toko"
        required
        error={errors.whatsappNumber?.message}
        helperText="Nomor aktif untuk menerima pesanan langsung dari pembeli (contoh: 08123456789)"
      >
        <Input
          type="tel"
          {...register("whatsappNumber")}
          placeholder="081234567890"
          aria-invalid={!!errors.whatsappNumber}
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      loadingProvinces ? "Memuat provinsi..." : "Pilih Provinsi"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {provinces.map((prov) => (
                    <SelectItem key={prov.id} value={prov.name}>
                      {prov.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>

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
        label="Alamat Lengkap Usaha"
        required
        error={errors.address?.message}
      >
        <Textarea
          rows={2}
          {...register("address")}
          placeholder="Jl. Raya Perkebunan Kopi No. 12"
          className="resize-y"
          aria-invalid={!!errors.address}
        />
      </FormField>

      <Button
        type="submit"
        variant="primary"
        size="default"
        disabled={isLoading}
        className="w-full h-10 gap-2 mt-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Mengalihkan...
          </>
        ) : (
          <>
            <Store className="h-4 w-4" />
            Buka Toko Sekarang
          </>
        )}
      </Button>
    </form>
  );
}
