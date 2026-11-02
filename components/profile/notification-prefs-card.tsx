"use client";

import { useState } from "react";
import { Bell, Mail, Coffee } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { updateUserNotificationPrefsAction } from "@/actions/notification.actions";
import { toast } from "sonner";

interface NotificationPrefsCardProps {
  initialPrefs: {
    reminders: boolean;
    emailReminders: boolean;
  };
}

export function NotificationPrefsCard({ initialPrefs }: NotificationPrefsCardProps) {
  const [reminders, setReminders] = useState(initialPrefs.reminders);
  const [emailReminders, setEmailReminders] = useState(initialPrefs.emailReminders);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async (key: "reminders" | "emailReminders", nextVal: boolean) => {
    const prevReminders = reminders;
    const prevEmail = emailReminders;

    if (key === "reminders") setReminders(nextVal);
    if (key === "emailReminders") setEmailReminders(nextVal);

    setIsUpdating(true);
    try {
      const res = await updateUserNotificationPrefsAction({
        reminders: key === "reminders" ? nextVal : reminders,
        emailReminders: key === "emailReminders" ? nextVal : emailReminders,
      });

      if (!res.success) {
        // Rollback
        setReminders(prevReminders);
        setEmailReminders(prevEmail);
        toast.error("Gagal memperbarui preferensi", { description: res.error });
      } else {
        toast.success("Preferensi notifikasi diperbarui");
      }
    } catch {
      setReminders(prevReminders);
      setEmailReminders(prevEmail);
      toast.error("Gagal memperbarui preferensi. Silakan coba lagi.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="border-neutral-300 bg-surface-base">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-neutral-700" />
          <div>
            <CardTitle className="text-base text-neutral-900">
              Notifikasi & Pengingat Kopi
            </CardTitle>
            <CardDescription className="text-xs text-neutral-600">
              Atur pemberitahuan waktu seduh optimal dan pengingat stok kopi di akun Anda.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-1">
        {/* 1. In-app Reminders */}
        <div className="flex items-start justify-between gap-4 p-3 rounded-sm border border-neutral-200 bg-neutral-50/50">
          <div className="flex items-start gap-3">
            <Coffee className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <label
                htmlFor="toggle-reminders"
                className="text-xs font-semibold text-neutral-900 cursor-pointer"
              >
                Pengingat Waktu Seduh Optimal (In-App)
              </label>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Pemberitahuan cerdas saat biji kopi pesanan Anda mencapai usia istirahat ideal (peak flavor window) dan saat stok diperkirakan habis.
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
            <input
              id="toggle-reminders"
              type="checkbox"
              checked={reminders}
              disabled={isUpdating}
              onChange={(e) => handleToggle("reminders", e.target.checked)}
              className="sr-only peer"
              aria-label="Aktifkan pengingat waktu seduh optimal"
            />
            <div className="w-9 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-800"></div>
          </label>
        </div>

        {/* 2. Email Reminders */}
        <div className="flex items-start justify-between gap-4 p-3 rounded-sm border border-neutral-200 bg-neutral-50/50">
          <div className="flex items-start gap-3">
            <Mail className="w-4 h-4 text-primary-800 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <label
                htmlFor="toggle-email-reminders"
                className="text-xs font-semibold text-neutral-900 cursor-pointer"
              >
                Email Pengingat Seduh & Restok
              </label>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Kirimkan ringkasan jadwal seduh dan info restok ke alamat email akun Anda (opsional, dapat dihentikan kapan saja via tautan di email).
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
            <input
              id="toggle-email-reminders"
              type="checkbox"
              checked={emailReminders}
              disabled={isUpdating}
              onChange={(e) => handleToggle("emailReminders", e.target.checked)}
              className="sr-only peer"
              aria-label="Aktifkan email pengingat seduh dan restok"
            />
            <div className="w-9 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-800"></div>
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
