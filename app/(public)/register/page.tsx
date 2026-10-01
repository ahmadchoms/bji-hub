"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  registerSchema,
  RegisterFormValues,
} from "@/lib/validations/auth.schema";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";
import { registerAction } from "@/actions/auth.actions";

const PROVINCES = [
  "Aceh",
  "Sumatera Utara",
  "Sumatera Barat",
  "Jawa Barat",
  "Jawa Tengah",
  "Jawa Timur",
  "Bali",
  "Nusa Tenggara Barat",
  "Nusa Tenggara Timur",
  "Sulawesi Selatan",
  "Papua",
];

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const initialRole =
    searchParams.get("role") === "seller" ? "seller" : "buyer";

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      businessName: "",
      email: "",
      whatsappNumber: "",
      province: "",
      city: "",
      address: "",
      password: "",
      termsAccepted: true,
      role: initialRole as "buyer" | "seller",
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true);
    try {
      const result = await registerAction(values);
      if (!result.success) {
        toast.error("Pendaftaran gagal", { description: result.error });
        return;
      }
      toast.success("Pendaftaran berhasil", {
        description: `Selamat datang, ${values.businessName}.`,
      });
      router.push(result.data.redirectTo);
      router.refresh();
    } catch {
      toast.error("Pendaftaran gagal", {
        description: "Terjadi kesalahan. Coba lagi.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-12 md:py-16 flex items-center justify-center">
      <div className="w-full max-w-xl mx-auto px-4">
        <div className="border border-neutral-300 bg-surface-base rounded-sm p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-2">
              <Logo size="md" />
            </div>
            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
              Pendaftaran Kopi Biji
            </p>
            <h1 className="font-display text-2xl text-neutral-900 font-semibold">
              Buka Akun
            </h1>
            <p className="text-sm text-neutral-600 max-w-md mx-auto leading-relaxed">
              Daftar sebagai penjual untuk menjual biji kopi, atau sebagai
              pembeli untuk mencari kopi specialty.
            </p>
          </div>

          {/* Role selector */}
          <div>
            <span className="text-xs text-neutral-700 block mb-2">
              Saya ingin
            </span>
            <div
              className="grid grid-cols-2 gap-2"
              role="radiogroup"
              aria-label="Pilih tipe akun"
            >
              <label
                className={cn(
                  "flex items-center justify-center rounded-sm border px-3 py-3 text-sm font-medium cursor-pointer transition-colors",
                  selectedRole === "buyer"
                    ? "border-primary-600 bg-primary-50 text-primary-900"
                    : "border-neutral-300 bg-surface-base text-neutral-700 hover:border-neutral-400",
                )}
              >
                <input
                  type="radio"
                  value="buyer"
                  {...register("role")}
                  className="sr-only"
                />
                Membeli Kopi
              </label>
              <label
                className={cn(
                  "flex items-center justify-center rounded-sm border px-3 py-3 text-sm font-medium cursor-pointer transition-colors",
                  selectedRole === "seller"
                    ? "border-primary-600 bg-primary-50 text-primary-900"
                    : "border-neutral-300 bg-surface-base text-neutral-700 hover:border-neutral-400",
                )}
              >
                <input
                  type="radio"
                  value="seller"
                  {...register("role")}
                  className="sr-only"
                />
                Menjual Kopi
              </label>
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Nama Pemilik"
                required
                error={errors.name?.message}
              >
                <input
                  type="text"
                  {...register("name")}
                  placeholder="Budi Santoso"
                  className="w-full h-10 px-3 text-sm bg-surface-base border border-neutral-300 rounded-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
                />
              </FormField>
              <FormField
                label="Nama Toko / Roastery"
                required
                error={errors.businessName?.message}
              >
                <input
                  type="text"
                  {...register("businessName")}
                  placeholder="Puntang Highland Coffee"
                  className="w-full h-10 px-3 text-sm bg-surface-base border border-neutral-300 rounded-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Email" required error={errors.email?.message}>
                <input
                  type="email"
                  {...register("email")}
                  placeholder="budi@roastery.com"
                  className="w-full h-10 px-3 text-sm bg-surface-base border border-neutral-300 rounded-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
                />
              </FormField>
              <FormField
                label="WhatsApp"
                required
                error={errors.whatsappNumber?.message}
                helperText="Untuk chat & order langsung"
              >
                <input
                  type="tel"
                  {...register("whatsappNumber")}
                  placeholder="081234567890"
                  className="w-full h-10 px-3 text-sm bg-surface-base border border-neutral-300 rounded-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Provinsi"
                required
                error={errors.province?.message}
              >
                <select
                  {...register("province")}
                  className="w-full h-10 px-3 text-sm bg-surface-base border border-neutral-300 rounded-sm text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
                >
                  <option value="">Pilih Provinsi</option>
                  {PROVINCES.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField
                label="Kota / Kabupaten"
                required
                error={errors.city?.message}
              >
                <input
                  type="text"
                  {...register("city")}
                  placeholder="Bandung Barat"
                  className="w-full h-10 px-3 text-sm bg-surface-base border border-neutral-300 rounded-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
                />
              </FormField>
            </div>

            <FormField
              label="Alamat Lengkap"
              required
              error={errors.address?.message}
            >
              <input
                type="text"
                {...register("address")}
                placeholder="Jl. Raya Perkebunan No. 12"
                className="w-full h-10 px-3 text-sm bg-surface-base border border-neutral-300 rounded-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
              />
            </FormField>

            <FormField
              label="Kata Sandi"
              required
              error={errors.password?.message}
            >
              <input
                type="password"
                {...register("password")}
                placeholder="Minimal 6 karakter"
                className="w-full h-10 px-3 text-sm bg-surface-base border border-neutral-300 rounded-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
              />
            </FormField>

            <div className="pt-1">
              <label className="flex items-start gap-2 cursor-pointer text-xs text-neutral-700">
                <input
                  type="checkbox"
                  {...register("termsAccepted")}
                  className="mt-0.5 w-4 h-4 rounded text-primary-600 focus:ring-primary-400 border-neutral-300"
                />
                <span className="leading-relaxed">
                  Saya setuju dengan{" "}
                  <Link
                    href="/terms"
                    className="text-primary-600 hover:underline"
                  >
                    Syarat & Ketentuan
                  </Link>{" "}
                  Direktori Kopi Biji.
                </span>
              </label>
              {errors.termsAccepted?.message && (
                <p className="text-xs text-status-error mt-1">
                  {errors.termsAccepted.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isLoading}
              className="w-full justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mendaftarkan...</span>
                </>
              ) : (
                <span>Daftarkan Akun</span>
              )}
            </Button>
          </form>

          <div className="text-center text-xs text-neutral-600 pt-2 border-t border-neutral-300">
            <span>Sudah punya akun? </span>
            <Link
              href="/login"
              className="font-medium text-primary-600 hover:underline"
            >
              Masuk
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
