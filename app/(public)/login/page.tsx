"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { LogIn, Loader2 } from "lucide-react";
import { loginSchema, LoginFormValues } from "@/lib/validations/auth.schema";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";

export default function LoginPage() {
  const router = useRouter();
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
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsLoading(false);
    toast.success("Login Berhasil (Demo)", { description: `Selamat datang, ${values.email}!` });
    router.push("/dashboard");
  };

  return (
    <div className="py-12 md:py-20 flex items-center justify-center min-h-[calc(100vh-16rem)]">
      <div className="w-full max-w-md mx-auto px-4">
        <div className="border border-neutral-300 bg-surface-base rounded-sm p-6 space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-2"><Logo size="md" /></div>
            <h1 className="font-display text-2xl text-neutral-900 font-semibold">Masuk ke Akun</h1>
            <p className="text-sm text-neutral-600">Kelola listing biji kopi dan tanggapi pesanan.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField label="Alamat Email" required error={errors.email?.message}>
              <input
                type="email"
                {...register("email")}
                placeholder="nama@roastery.com"
                className="w-full h-10 px-3 text-sm bg-surface-base border border-neutral-300 rounded-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
              />
            </FormField>

            <FormField label="Kata Sandi" required error={errors.password?.message}>
              <input
                type="password"
                {...register("password")}
                placeholder="••••••••"
                className="w-full h-10 px-3 text-sm bg-surface-base border border-neutral-300 rounded-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
              />
            </FormField>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-neutral-700">
                <input type="checkbox" className="w-4 h-4 rounded text-primary-600 focus:ring-primary-400 border-neutral-300" />
                <span>Ingat saya</span>
              </label>
              <button
                type="button"
                onClick={() => toast.info("Demo mode: gunakan kredensial apa saja")}
                className="text-primary-600 hover:underline font-medium"
              >
                Lupa sandi?
              </button>
            </div>

            <Button type="submit" variant="primary" size="lg" disabled={isLoading} className="w-full justify-center gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi...</span>
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
            <Link href="/register" className="font-medium text-primary-600 hover:underline">Daftar Gratis</Link>
          </div>
        </div>
      </div>
    </div>
  );
}