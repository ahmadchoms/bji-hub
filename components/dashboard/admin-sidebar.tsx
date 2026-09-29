"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Menu,
  X,
  LayoutDashboard,
  BadgeCheck,
  ClipboardList,
  Receipt,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

const ADMIN_NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin", label: "Ringkasan", icon: LayoutDashboard },
  { href: "/admin/verifikasi", label: "Antrean Verifikasi", icon: BadgeCheck },
  { href: "/admin/moderasi", label: "Moderasi Listing", icon: ClipboardList },
  { href: "/admin/transaksi", label: "Riwayat Transaksi", icon: Receipt },
];

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}

export function AdminSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 z-30 border-r border-neutral-300 bg-surface-base",
          "transition-[width] duration-300 ease-in-out",
          collapsed ? "lg:w-16" : "lg:w-56"
        )}
      >
        <div
          className={cn(
            "flex h-14 items-center border-b border-neutral-300",
            collapsed ? "justify-center px-2" : "justify-between px-4"
          )}
        >
          <Logo size="sm" iconOnly={collapsed} />
          <span
            className={cn(
              "text-[10px] font-mono text-neutral-500 uppercase tracking-widest overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out",
              collapsed ? "max-w-0 opacity-0" : "max-w-[60px] opacity-100"
            )}
          >
            ADMIN
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 px-2 py-3" aria-label="Menu Admin">
          {ADMIN_NAV.map((item) => {
            const active = isNavActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex w-full items-center min-h-[44px] border-l-2 rounded-sm text-sm font-medium transition-colors",
                  "outline-none focus-visible:underline",
                  collapsed ? "justify-center px-0" : "gap-3 px-3 py-2.5",
                  active
                    ? "border-primary-600 bg-neutral-900 text-neutral-50 font-semibold"
                    : "border-transparent text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                <span
                  className={cn(
                    "overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out",
                    collapsed ? "max-w-0 opacity-0" : "max-w-[160px] opacity-100"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-neutral-300 p-2 space-y-0.5">
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
            aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
            aria-expanded={!collapsed}
            className={cn(
              "flex w-full items-center min-h-[44px] rounded-sm text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900",
              collapsed ? "justify-center px-0" : "gap-3 px-3 py-2.5"
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4 shrink-0" aria-hidden />
            ) : (
              <PanelLeftClose className="size-4 shrink-0" aria-hidden />
            )}
            <span
              className={cn(
                "overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out",
                collapsed ? "max-w-0 opacity-0" : "max-w-[160px] opacity-100"
              )}
            >
              Ciutkan
            </span>
          </button>

          <Link
            href="/"
            title={collapsed ? "Keluar" : undefined}
            className={cn(
              "flex w-full items-center min-h-[44px] rounded-sm text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900",
              collapsed ? "justify-center px-0" : "gap-3 px-3 py-2.5"
            )}
          >
            <LogOut className="size-4 shrink-0" aria-hidden />
            <span
              className={cn(
                "overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out",
                collapsed ? "max-w-0 opacity-0" : "max-w-[160px] opacity-100"
              )}
            >
              Keluar
            </span>
          </Link>
        </div>
      </aside>

      <header className="lg:hidden sticky top-0 z-40 flex h-14 items-center justify-between border-b border-neutral-300 bg-surface-base px-4">
        <div className="flex items-center gap-2">
          <Logo size="sm" />
          <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
            ADMIN
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDrawerOpen(!drawerOpen)}
          aria-label={drawerOpen ? "Tutup menu admin" : "Buka menu admin"}
          aria-expanded={drawerOpen}
        >
          {drawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </header>

      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 top-14 z-50 bg-neutral-900/40"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="w-full bg-surface-base border-b border-neutral-300 p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="flex flex-col gap-0.5" aria-label="Menu Admin Mobile">
              {ADMIN_NAV.map((item) => {
                const active = isNavActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      "flex w-full items-center gap-3 min-h-[48px] border-l-2 px-3 py-3 rounded-sm text-sm font-medium transition-colors",
                      active
                        ? "border-primary-600 bg-primary-100 text-primary-900 font-bold"
                        : "border-transparent text-neutral-700 hover:bg-neutral-100"
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      <div
        className={cn(
          "transition-[padding] duration-300 ease-in-out",
          collapsed ? "lg:pl-16" : "lg:pl-56"
        )}
      >
        {children}
      </div>
    </>
  );
}
