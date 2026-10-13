"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Store } from "lucide-react";
import {
  sellerOnboardingSchema,
  SellerOnboardingFormValues,
} from "@/lib/validations/auth.schema";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { fetchProvinces, fetchRegencies, type RegionItem } from "@/lib/regions";
import { becomeSellerAction } from "@/actions/auth.actions";

export function SellerOnboardingForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [provinces, setProvinces] = useState<RegionItem[]>([]);
  const [cities, setCities] = useState<RegionItem[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>("");
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const {
    register,
    handleSubmit,
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

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provinceName = e.target.value;
    setValue("province", provinceName, { shouldValidate: true });
    setValue("city", "", { shouldValidate: true });
    const matched = provinces.find((p) => p.name === provinceName);
    setSelectedProvinceId(matched ? matched.id : "");
  };

  const onSubmit = async (values: SellerOnboardingFormValues) => {
    setIsLoading(true);
    try {
      const result = await becomeSellerAction(values);
      if (!result.success) {
        toast.error("Gagal membuka toko", { description: result.error });
        return;
      }
      toast.success("Toko berhasil dibuka!", {
        description: `Selamat datang di Biji Hub, ${values.businessName}.`,
      });
      router.push(result.data.redirectTo);
      router.refresh();
    } catch {
      toast.error("Gagal membuka toko", {
        description: "Terjadi kesalahan saat memproses data.",
      });
    } finally {
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
        <input
          type="text"
          {...register("businessName")}
          placeholder="Contoh: Puntang Highland Coffee"
          className="w-full h-10 px-3 text-sm bg-surface-base border border-neutral-300 rounded-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
        />
      </FormField>

      <FormField
        label="Nomor WhatsApp Toko"
        required
        error={errors.whatsappNumber?.message}
        helperText="Nomor aktif untuk menerima pesanan langsung dari pembeli (contoh: 08123456789)"
      >
        <input
          type="tel"
          {...register("whatsappNumber")}
          placeholder="081234567890"
          className="w-full h-10 px-3 text-sm bg-surface-base border border-neutral-300 rounded-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          label="Provinsi"
          required
          error={errors.province?.message}
        >
          <select
            {...register("province")}
            onChange={(e) => {
              register("province").onChange(e);
              handleProvinceChange(e);
            }}
            disabled={loadingProvinces}
            className="w-full h-10 px-3 text-sm bg-surface-base border border-neutral-300 rounded-sm text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 disabled:opacity-50"
          >
            <option value="">
              {loadingProvinces ? "Memuat provinsi..." : "Pilih Provinsi"}
            </option>
            {provinces.map((prov) => (
              <option key={prov.id} value={prov.name}>
                {prov.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Kota / Kabupaten"
          required
          error={errors.city?.message}
        >
          <select
            {...register("city")}
            disabled={!selectedProvinceId || loadingCities}
            className="w-full h-10 px-3 text-sm bg-surface-base border border-neutral-300 rounded-sm text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 disabled:opacity-50"
          >
            <option value="">
              {loadingCities
                ? "Memuat kota/kabupaten..."
                : !selectedProvinceId
                  ? "Pilih provinsi dahulu"
                  : "Pilih Kota / Kabupaten"}
            </option>
            {cities.map((city) => (
              <option key={city.id} value={city.name}>
                {city.name}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField
        label="Alamat Lengkap Usaha"
        required
        error={errors.address?.message}
      >
        <input
          type="text"
          {...register("address")}
          placeholder="Jl. Raya Perkebunan Kopi No. 12"
          className="w-full h-10 px-3 text-sm bg-surface-base border border-neutral-300 rounded-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
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
            Membuka Toko...
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
