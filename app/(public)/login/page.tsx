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
import { safeNextPath } from "@/lib/auth/roles";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

function LoginForm() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
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
        let desc = result.error;
        if (result.error?.toLowerCase().includes("invalid login credentials")) {
          desc = "Kredensial tidak valid. Jika Anda mendaftar dengan Google, gunakan tombol Lanjutkan dengan Google.";
        }
        toast.error("Gagal masuk", { description: desc });
        setIsLoading(false);
        return;
      }
      toast.success("Berhasil masuk!", {
        description: "Mengalihkan ke akun Anda...",
      });
      try {
        localStorage.removeItem("biji_wishlist_items");
        localStorage.removeItem("biji_cart_items");
        localStorage.removeItem("biji_compare_items");
      } catch {
        // ignore: storage clean on login
      }
      window.location.href = result.data.redirectTo;
    } catch {
      // ignore: optional cookie read fallback
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

          {searchParams.get("verify") === "1" && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded text-emerald-900 text-xs leading-relaxed space-y-1">
              <p className="font-semibold">Pendaftaran Berhasil!</p>
              <p>
                Kami telah mengirimkan tautan konfirmasi ke email Anda. Silakan periksa inbox (atau folder spam) untuk mengaktifkan akun Anda sebelum masuk.
              </p>
            </div>
          )}

          {searchParams.get("reset") === "success" && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded text-emerald-900 text-xs leading-relaxed space-y-1">
              <p className="font-semibold">Kata Sandi Berhasil Diperbarui!</p>
              <p>
                Silakan masuk menggunakan kata sandi baru Anda.
              </p>
            </div>
          )}

          {searchParams.get("error") === "verification_failed" && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 rounded text-rose-900 text-xs leading-relaxed space-y-1">
              <p className="font-semibold">Verifikasi Gagal</p>
              <p>
                Verifikasi gagal atau kedaluwarsa, silakan coba lagi.
              </p>
            </div>
          )}

          {searchParams.get("error") === "suspended" && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 rounded text-rose-900 text-xs leading-relaxed space-y-1">
              <p className="font-semibold">Akun Ditangguhkan</p>
              <p>
                Akun atau toko Anda sedang ditangguhkan karena pelanggaran ketentuan layanan. Hubungi bantuan admin jika ini adalah kekeliruan.
              </p>
            </div>
          )}

          {searchParams.get("error") === "auth_code_error" && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded text-amber-900 text-xs leading-relaxed space-y-1">
              <p className="font-semibold">Tautan Tidak Valid atau Perangkat Berbeda</p>
              <p>
                Tautan konfirmasi atau reset password harus dibuka pada peramban (browser) dan perangkat yang sama saat diminta. Silakan minta tautan baru.
              </p>
            </div>
          )}

          <GoogleSignInButton next={safeNextPath(searchParams.get("next"), "/")} />

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-300" />
            </div>
            <div className="relative bg-surface-base px-3 text-xs uppercase text-neutral-500 font-medium">
              atau
            </div>
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
              <Link
                href="/forgot-password"
                className="text-primary-600 hover:underline font-medium"
              >
                Lupa sandi?
              </Link>
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
