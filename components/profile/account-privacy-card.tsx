"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Trash2, ShieldAlert, AlertTriangle, Loader2 } from "lucide-react";
import { deleteAccountAction } from "@/actions/account.actions";
import { toast } from "sonner";

export function AccountPrivacyCard() {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmInput.trim().toUpperCase() !== "HAPUS AKUN") {
      toast.error("Konfirmasi tidak cocok", {
        description: "Ketik 'HAPUS AKUN' dengan tepat untuk melanjutkan.",
      });
      return;
    }

    setIsDeleting(true);
    try {
      const res = await deleteAccountAction(confirmInput);
      if (!res.success) {
        toast.error("Gagal menghapus akun", { description: res.error });
        setIsDeleting(false);
        return;
      }

      toast.success("Akun berhasil dihapus", {
        description: "Mengalihkan ke halaman utama...",
      });
      router.push(res.data.redirectTo);
    } catch {
      toast.error("Terjadi kesalahan sistem saat memproses penghapusan akun.");
      setIsDeleting(false);
    }
  };

  return (
    <Card className="border-neutral-200">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-neutral-100 text-neutral-800">
            <ShieldAlert className="h-5 w-5 text-neutral-600" />
          </div>
          <div>
            <CardTitle className="text-base text-neutral-900">
              Hak Data Pribadi & Privasi (UU PDP)
            </CardTitle>
            <CardDescription className="text-xs text-neutral-600">
              Akses hak portabilitas data pribadi Anda atau ajukan penghapusan akun sesuai UU No. 27 Tahun 2022.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-1">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-neutral-50 rounded border border-neutral-200">
          <div>
            <p className="text-xs font-semibold text-neutral-900">Unduh Salinan Data Pribadi</p>
            <p className="text-[11px] text-neutral-600">
              Ekspor seluruh riwayat profil, alamat tersimpan, dan transaksi Anda dalam format JSON standar.
            </p>
          </div>
          <a
            href="/api/user/export"
            download
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-800 shrink-0 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Unduh Data (JSON)
          </a>
        </div>

        <div className="p-3 bg-rose-50/50 rounded border border-rose-200 space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-rose-950">Zona Bahaya: Hapus Akun</p>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                Tindakan ini permanen. Alamat pengiriman akan dihapus dan identitas Anda dianonimkan. Catatan transaksi finansial yang sudah selesai diarsipkan untuk kepatuhan pembukuan.
              </p>
            </div>
          </div>

          {!showConfirm ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfirm(true)}
              className="text-xs text-rose-700 hover:text-rose-900 border-rose-300 hover:bg-rose-100/60 gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus Akun Saya
            </Button>
          ) : (
            <div className="space-y-2 pt-2 border-t border-rose-200">
              <p className="text-[11px] text-rose-900">
                Ketik <strong className="font-mono bg-rose-100 px-1 py-0.5 rounded">HAPUS AKUN</strong> untuk konfirmasi:
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder="Ketik HAPUS AKUN"
                  className="text-xs h-8 bg-white border-rose-300 focus-visible:ring-rose-500"
                  disabled={isDeleting}
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={confirmInput.trim().toUpperCase() !== "HAPUS AKUN" || isDeleting}
                    onClick={handleDelete}
                    className="text-xs h-8 bg-rose-700 hover:bg-rose-800 text-white shrink-0"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        Memproses...
                      </>
                    ) : (
                      "Konfirmasi Hapus"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowConfirm(false);
                      setConfirmInput("");
                    }}
                    disabled={isDeleting}
                    className="text-xs h-8 text-neutral-600 hover:text-neutral-900"
                  >
                    Batal
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
