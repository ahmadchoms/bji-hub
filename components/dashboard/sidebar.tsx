"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Menu,
  X,
  LayoutDashboard,
  Package,
  BarChart3,
  CreditCard,
  Store,
  MessageSquare,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { logoutAction } from "@/actions/auth.actions";

const SELLER_NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Ringkasan", icon: LayoutDashboard },
  { href: "/dashboard/listing", label: "Produk Saya", icon: Package },
  { href: "/dashboard/analytics", label: "Analitik", icon: BarChart3 },
  { href: "/dashboard/billing", label: "Langganan", icon: CreditCard },
  { href: "/dashboard/profile", label: "Profil Toko", icon: Store },
  { href: "/dashboard/inquiry", label: "Pesan Masuk", icon: MessageSquare },
];

const BOTTOM_NAV = SELLER_NAV.slice(0, 5);

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

export function DashboardSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 z-30 border-r border-neutral-300 bg-surface-alt",
          "transition-[width] duration-300 ease-in-out",
          collapsed ? "lg:w-16" : "lg:w-56",
        )}
      >
        <div
          className={cn(
            "flex h-14 items-center border-b border-neutral-300",
            collapsed ? "justify-center px-2" : "px-4",
          )}
        >
          <Logo size="sm" iconOnly={collapsed} />
        </div>

        <nav
          className="flex flex-1 flex-col gap-0.5 px-2 py-3"
          aria-label="Menu Dashboard Seller"
        >
          {SELLER_NAV.map((item) => {
            const active = isNavActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "group relative flex w-full items-center min-h-11 border-l-2 rounded-sm text-sm font-medium transition-colors",
                  "outline-none focus-visible:underline",
                  collapsed ? "justify-center px-0" : "gap-3 px-3 py-2.5",
                  active
                    ? "border-primary-600 bg-primary text-neutral-50 font-semibold"
                    : "border-transparent text-neutral-700 hover:bg-secondary hover:text-primary",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                <span
                  className={cn(
                    "overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out",
                    collapsed ? "max-w-0 opacity-0" : "max-w-40 opacity-100",
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
              "flex w-full items-center min-h-11 rounded-sm text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900",
              collapsed ? "justify-center px-0" : "gap-3 px-3 py-2.5",
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
                collapsed ? "max-w-0 opacity-0" : "max-w-40 opacity-100",
              )}
            >
              Ciutkan
            </span>
          </button>

          <form action={logoutAction}>
            <button
              type="submit"
              title={collapsed ? "Keluar" : undefined}
              className={cn(
                "flex w-full items-center min-h-11 rounded-sm text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900",
                collapsed ? "justify-center px-0" : "gap-3 px-3 py-2.5",
              )}
            >
              <LogOut className="size-4 shrink-0" aria-hidden />
              <span
                className={cn(
                  "overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out",
                  collapsed ? "max-w-0 opacity-0" : "max-w-40 opacity-100",
                )}
              >
                Keluar
              </span>
            </button>
          </form>
        </div>
      </aside>

      <header className="lg:hidden sticky top-0 z-40 flex h-14 items-center justify-between border-b border-neutral-300 bg-surface-alt px-4">
        <Logo size="sm" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDrawerOpen(!drawerOpen)}
          aria-label={drawerOpen ? "Tutup menu" : "Buka menu"}
          aria-expanded={drawerOpen}
        >
          {drawerOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
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
            <nav
              className="flex flex-col gap-0.5"
              aria-label="Menu Dashboard Mobile"
            >
              {SELLER_NAV.map((item) => {
                const active = isNavActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      "flex w-full items-center gap-3 min-h-12 border-l-2 px-3 py-3 rounded-sm text-sm font-medium transition-colors",
                      active
                        ? "border-primary-600 bg-primary-100 text-primary-900 font-bold"
                        : "border-transparent text-neutral-700 hover:bg-neutral-100",
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

      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-base border-t border-neutral-300 safe-area-bottom"
        aria-label="Navigasi Bawah"
      >
        <div className="flex items-center justify-around h-14 px-1">
          {BOTTOM_NAV.map((item) => {
            const active = isNavActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 min-w-12 min-h-12 px-2 py-1 rounded-sm transition-colors text-center",
                  "outline-none focus-visible:ring-2 focus-visible:ring-primary-400",
                  active
                    ? "text-primary-600"
                    : "text-neutral-500 hover:text-neutral-900",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                <span
                  className={cn(
                    "text-[10px] font-medium leading-tight",
                    active && "font-semibold",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div
        className={cn(
          "transition-[padding] duration-300 ease-in-out",
          collapsed ? "lg:pl-16" : "lg:pl-56",
        )}
      >
        {children}
      </div>
    </>
  );
}
