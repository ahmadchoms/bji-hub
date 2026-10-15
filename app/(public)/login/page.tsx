"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { LogIn, Loader2 } from "lucide-react";
import { loginSchema, LoginFormValues } from "@/lib/validations/auth.schema";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Logo } from "@/components/shared/logo";
import { loginAction } from "@/actions/auth.actions";

function LoginForm() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      const result = await loginAction(
        values,
        searchParams.get("next") ?? undefined,
      );
      if (!result.success) {
        toast.error("Gagal masuk", { description: result.error });
        setIsLoading(false);
        return;
      }
      toast.success("Berhasil masuk!", {
        description: "Mengalihkan ke akun Anda...",
      });
      window.location.href = result.data.redirectTo;
    } catch {
      toast.error("Gagal masuk", {
        description: "Terjadi kesalahan. Coba lagi.",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="py-12 md:py-20 flex items-center justify-center min-h-[calc(100vh-16rem)]">
      <div className="w-full max-w-md mx-auto px-4">
        <div className="border border-neutral-300 bg-surface-base rounded-sm p-6 space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-2">
              <Logo size="md" />
            </div>
            <h1 className="font-display text-2xl text-neutral-900 font-semibold">
              Masuk ke Akun
            </h1>
            <p className="text-sm text-neutral-600">
              Kelola listing biji kopi dan tanggapi pesanan.
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <FormField
              label="Alamat Email"
              required
              error={errors.email?.message}
            >
              <Input
                type="email"
                {...register("email")}
                placeholder="nama@roastery.com"
                aria-invalid={!!errors.email}
              />
            </FormField>

            <FormField
              label="Kata Sandi"
              required
              error={errors.password?.message}
            >
              <Input
                type="password"
                {...register("password")}
                placeholder="••••••••"
                aria-invalid={!!errors.password}
              />
            </FormField>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-neutral-700">
                <Checkbox />
                <span>Ingat saya</span>
              </label>
              <button
                type="button"
                onClick={() =>
                  toast.info("Demo mode: gunakan kredensial apa saja")
                }
                className="text-primary-600 hover:underline font-medium"
              >
                Lupa sandi?
              </button>
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
                  <span>Mengalihkan...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Masuk</span>
                </>
              )}
            </Button>
          </form>

          {/* Quick Demo Credentials for Lecturer & Testing */}
          <div className="bg-amber-50/80 border border-amber-200 rounded p-3 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-amber-950 text-[11px]">Akun Pengujian Demo (1-Klik Isi):</span>
              <span className="text-[10px] text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded font-mono">Demo Mode</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setValue("email", "buyer@bijihub.com");
                  setValue("password", "password123");
                  toast.info("Akun Pembeli diisi (buyer@bijihub.com)");
                }}
                className="py-1 px-1.5 bg-white border border-amber-300 rounded text-center hover:bg-amber-100 transition-colors cursor-pointer"
              >
                <span className="block font-medium text-neutral-800 text-[11px]">Pembeli</span>
                <span className="block text-[10px] text-neutral-500 font-mono">buyer@</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setValue("email", "seller@bijihub.com");
                  setValue("password", "password123");
                  toast.info("Akun Penjual diisi (seller@bijihub.com)");
                }}
                className="py-1 px-1.5 bg-white border border-amber-300 rounded text-center hover:bg-amber-100 transition-colors cursor-pointer"
              >
                <span className="block font-medium text-neutral-800 text-[11px]">Penjual</span>
                <span className="block text-[10px] text-neutral-500 font-mono">seller@</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setValue("email", "admin@bijihub.com");
                  setValue("password", "password123");
                  toast.info("Akun Admin diisi (admin@bijihub.com)");
                }}
                className="py-1 px-1.5 bg-white border border-amber-300 rounded text-center hover:bg-amber-100 transition-colors cursor-pointer"
              >
                <span className="block font-medium text-neutral-800 text-[11px]">Admin</span>
                <span className="block text-[10px] text-neutral-500 font-mono">admin@</span>
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-neutral-600 pt-2 border-t border-neutral-300">
            <span>Belum punya toko? </span>
            <Link
              href="/register"
              className="font-medium text-primary-600 hover:underline"
            >
              Daftar Gratis
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
