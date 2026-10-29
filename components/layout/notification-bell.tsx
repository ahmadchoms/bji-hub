"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Loader2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  getNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
} from "@/actions/notification.actions";
import type { NotificationRecord } from "@/lib/data/notifications";

interface NotificationBellProps {
  initialCount?: number;
}

export function NotificationBell({ initialCount = 0 }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await getNotificationsAction(15);
      if (res.success) {
        setNotifications(res.data);
        setUnreadCount(res.data.filter((n) => !n.isRead).length);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = () => {
    if (!open) {
      loadNotifications();
    }
    setOpen((prev) => !prev);
  };

  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await markNotificationAsReadAction(id);
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await markAllNotificationsAsReadAction();
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-full text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none"
        aria-label="Notifikasi"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 text-xs font-bold text-white bg-rose-600 rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 overflow-hidden text-left">
          <div className="p-3 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/60">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-900">Notifikasi</span>
              {unreadCount > 0 && (
                <Badge variant="outline" className="text-xs px-1.5 py-0 border-rose-200 text-rose-700 bg-rose-50">
                  {unreadCount} baru
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-primary-700 hover:text-primary-900 font-medium flex items-center gap-1"
              >
                <CheckCheck className="w-3 h-3" />
                Tandai semua dibaca
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100">
            {isLoading && notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-600 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
                Memuat notifikasi...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-600">
                Belum ada notifikasi.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 transition-colors text-xs space-y-1 cursor-pointer ${
                    !notif.isRead ? "bg-amber-50/40" : "hover:bg-neutral-50"
                  }`}
                  onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className={`font-semibold ${!notif.isRead ? "text-amber-950" : "text-neutral-800"}`}>
                      {notif.title}
                    </p>
                    {!notif.isRead && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-neutral-600 leading-relaxed text-xs">
                    {notif.message}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-neutral-400">
                      {new Date(notif.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {notif.link && (
                      <Link
                        href={notif.link}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpen(false);
                          if (!notif.isRead) handleMarkAsRead(notif.id);
                        }}
                        className="text-xs font-medium text-primary-700 hover:text-primary-900 inline-flex items-center gap-0.5"
                      >
                        Buka <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
