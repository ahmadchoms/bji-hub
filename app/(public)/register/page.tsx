"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import {
  registerSchema,
  RegisterFormValues,
} from "@/lib/validations/auth.schema";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Logo } from "@/components/shared/logo";
import { registerAction } from "@/actions/auth.actions";

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      termsAccepted: true,
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true);
    try {
      const result = await registerAction(values);
      if (!result.success) {
        toast.error("Pendaftaran gagal", { description: result.error });
        setIsLoading(false);
        return;
      }
      toast.success("Pendaftaran berhasil!", {
        description: `Selamat datang, ${values.name}. Mengalihkan...`,
      });
      window.location.href = result.data.redirectTo;
    } catch {
      toast.error("Pendaftaran gagal", {
        description: "Terjadi kesalahan. Coba lagi.",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="py-12 md:py-16 flex items-center justify-center">
      <div className="w-full max-w-md mx-auto px-4">
        <div className="border border-neutral-300 bg-surface-base rounded-sm p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-2">
              <Logo size="md" />
            </div>
            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
              Pendaftaran Akun
            </p>
            <h1 className="font-display text-2xl text-neutral-900 font-semibold">
              Buka Akun Pembeli
            </h1>
            <p className="text-sm text-neutral-600 max-w-sm mx-auto leading-relaxed">
              Daftar untuk mencari, membandingkan profil rasa, dan terhubung langsung dengan petani & roaster kopi lokal.
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <FormField
              label="Nama Lengkap"
              required
              error={errors.name?.message}
            >
              <Input
                type="text"
                {...register("name")}
                placeholder="Budi Santoso"
                aria-invalid={!!errors.name}
              />
            </FormField>

            <FormField label="Email" required error={errors.email?.message}>
              <Input
                type="email"
                {...register("email")}
                placeholder="budi@email.com"
                aria-invalid={!!errors.email}
              />
            </FormField>

            <FormField
              label="Kata Sandi"
              required
              error={errors.password?.message}
            >
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="Minimal 6 karakter"
                  className="pr-10"
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                  aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </FormField>

            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <Controller
                  control={control}
                  name="termsAccepted"
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(!!checked)}
                      className="mt-0.5"
                    />
                  )}
                />
                <span className="text-xs text-neutral-600 leading-snug">
                  Saya menyetujui{" "}
                  <Link
                    href="/terms"
                    target="_blank"
                    className="text-primary-600 underline hover:text-primary-700"
                  >
                    Syarat & Ketentuan
                  </Link>{" "}
                  platform direktori Biji Hub.
                </span>
              </label>
              {errors.termsAccepted && (
                <p className="text-xs text-status-error mt-1">
                  {errors.termsAccepted.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="default"
              disabled={isLoading}
              className="w-full h-10"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Mendaftarkan...
                </>
              ) : (
                "Daftar Sekarang"
              )}
            </Button>
          </form>

          <div className="pt-2 border-t border-neutral-200/80 space-y-3 text-center">
            <p className="text-xs text-neutral-600">
              Sudah punya akun?{" "}
              <Link
                href="/login"
                className="font-semibold text-primary-600 hover:text-primary-700 hover:underline"
              >
                Masuk di sini
              </Link>
            </p>
            <div className="p-3 rounded-md bg-primary-50/60 border border-primary-200/70 text-left">
              <p className="text-xs font-semibold text-primary-900">
                Punya kebun kopi atau roastery?
              </p>
              <p className="text-[11px] text-primary-800 mt-0.5">
                Buka toko dan pasang katalog kopi specialty Anda gratis.
              </p>
              <Link
                href="/open-store"
                className="text-xs font-semibold text-primary-700 hover:underline mt-1.5 inline-block"
              >
                Buka Toko Mitra di sini →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
