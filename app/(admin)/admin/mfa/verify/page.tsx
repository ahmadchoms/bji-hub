import { requireRole } from "@/lib/auth/session";
import { AdminMfaVerifyClient } from "./mfa-verify-client";

export const dynamic = "force-dynamic";

export default async function AdminMfaVerifyPage() {
  await requireRole(["admin"], "/admin/mfa/verify");

  return (
    <div className="max-w-md mx-auto py-12 px-4 sm:px-6">
      <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
        <h1 className="text-xl font-bold text-foreground mb-2 text-center">
          Verifikasi Dua Langkah Admin
        </h1>
        <p className="text-sm text-neutral-600 mb-6 text-center">
          Masukkan 6 digit kode dari aplikasi authenticator Anda untuk melanjutkan.
        </p>

        <AdminMfaVerifyClient />
      </div>
    </div>
  );
}
