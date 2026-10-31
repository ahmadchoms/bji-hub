import { requireRole } from "@/lib/auth/session";
import { enrollMfaAction } from "@/actions/mfa.actions";
import { AdminMfaEnrollClient } from "./mfa-enroll-client";

export const dynamic = "force-dynamic";

export default async function AdminMfaEnrollPage() {
  await requireRole(["admin"], "/admin/mfa/enroll");
  const enrollRes = await enrollMfaAction();

  return (
    <div className="max-w-xl mx-auto py-8 px-4 sm:px-6">
      <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
        <h1 className="text-xl font-bold text-foreground mb-2">
          Aktivasi Autentikasi Dua Faktor (2FA) Admin
        </h1>
        <p className="text-sm text-neutral-600 mb-6">
          Akun administrator wajib menggunakan verifikasi 2 langkah untuk melindungi data platform Biji Corp.
        </p>

        {enrollRes.success ? (
          <AdminMfaEnrollClient
            factorId={enrollRes.data.factorId}
            qrCode={enrollRes.data.qrCode}
            secret={enrollRes.data.secret}
          />
        ) : (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
            {enrollRes.error}
          </div>
        )}
      </div>
    </div>
  );
}
