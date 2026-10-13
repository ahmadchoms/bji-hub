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

          <div className="rounded-sm bg-neutral-50 p-3 text-xs text-neutral-700 space-y-1.5 border border-neutral-200">
            <p className="font-semibold text-neutral-900">
              Akun Seed Demo (Password: <code className="bg-white px-1 py-0.5 rounded border border-neutral-300 font-mono text-primary-700">password123</code>):
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setValue("email", "admin@example.com");
                  setValue("password", "password123");
                }}
                className="px-2 py-1 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-sm text-[11px] font-medium text-neutral-800 transition-colors"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setValue("email", "gayo-highland-agro@example.com");
                  setValue("password", "password123");
                }}
                className="px-2 py-1 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-sm text-[11px] font-medium text-neutral-800 transition-colors"
              >
                Seller (Gayo)
              </button>
              <button
                type="button"
                onClick={() => {
                  setValue("email", "akbarhakim@gmail.com");
                  setValue("password", "password123");
                }}
                className="px-2 py-1 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-sm text-[11px] font-medium text-neutral-800 transition-colors"
              >
                Buyer (Akbar)
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
