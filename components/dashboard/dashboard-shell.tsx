"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  LogOut,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { logoutAction } from "@/actions/auth.actions";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface DashboardNavItem {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  group?: string;
}

interface DashboardShellProps {
  nav: readonly DashboardNavItem[];
  rootHref: string;
  title: string;
  children: React.ReactNode;
}

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-primary-600";

function NavLinks({
  nav,
  rootHref,
  collapsed = false,
  onNavigate,
}: {
  nav: readonly DashboardNavItem[];
  rootHref: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === rootHref ? pathname === href : pathname.startsWith(href);

  // Group items by category
  const groups: { name: string; items: DashboardNavItem[] }[] = [];
  nav.forEach((item) => {
    const groupName = item.group || "";
    let g = groups.find((grp) => grp.name === groupName);
    if (!g) {
      g = { name: groupName, items: [] };
      groups.push(g);
    }
    g.items.push(item);
  });

  return (
    <div className="flex flex-col gap-2 p-2">
      {groups.map((group, groupIdx) => (
        <div key={group.name || `group-${groupIdx}`} className="space-y-1">
          {group.name && !collapsed && (
            <p className="px-3 pt-2 pb-1 font-mono text-xs uppercase tracking-widest text-neutral-600">
              {group.name}
            </p>
          )}
          {group.name && collapsed && groupIdx > 0 && (
            <div className="my-1.5 mx-2 border-t border-neutral-200" />
          )}
          {group.items.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            if (collapsed) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  title={item.label}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex h-10 w-10 mx-auto items-center justify-center rounded-md transition-all duration-150 select-none coarse:min-h-11 coarse:min-w-11",
                    focusRing,
                    active
                      ? "bg-primary-50 text-primary-900 font-semibold shadow-xs"
                      : "text-neutral-600 hover:bg-neutral-100/80 hover:text-neutral-900",
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary-600" />
                  )}
                  {Icon && (
                    <Icon
                      className={cn(
                        "h-5 w-5 shrink-0 transition-colors",
                        active
                          ? "text-primary-600"
                          : "text-neutral-600 group-hover:text-neutral-900",
                      )}
                    />
                  )}
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "font-mono group relative flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-semibold tracking-wide transition-all duration-150 select-none coarse:min-h-11",
                  focusRing,
                  active
                    ? "bg-primary-50/90 text-primary-900 font-bold shadow-xs"
                    : "text-neutral-600 hover:bg-neutral-100/70 hover:text-neutral-900",
                )}
              >
                {active && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary-600" />
                )}
                {Icon && (
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      active
                        ? "text-primary-600"
                        : "text-neutral-600 group-hover:text-neutral-900",
                    )}
                  />
                )}
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function LogoutButton({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <form className={cn("w-full", collapsed ? "px-1" : "px-2")} action={logoutAction}>
      <button
        type="submit"
        title="Keluar"
        aria-label="Keluar"
        className={cn(
          "cursor-pointer font-mono font-semibold flex text-sm text-neutral-600 hover:text-red-600 hover:bg-red-50 transition-colors rounded-md",
          focusRing,
          collapsed
            ? "h-10 w-10 mx-auto items-center justify-center coarse:min-h-11 coarse:min-w-11"
            : "min-h-10 w-full items-center gap-2.5 px-3 text-left coarse:min-h-11",
        )}
      >
        <LogOut className={cn(collapsed ? "h-5 w-5" : "h-4 w-4", "shrink-0")} />
        {!collapsed && <span>Keluar</span>}
      </button>
    </form>
  );
}

export function DashboardShell({
  nav,
  rootHref,
  title,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("biji_dashboard_sidebar_collapsed");
      if (saved === "true") {
        setCollapsed(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("biji_dashboard_sidebar_collapsed", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-neutral-300 bg-surface-alt lg:flex transition-[width] duration-200 ease-in-out",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <div
          className={cn(
            "flex items-center border-b border-neutral-300",
            collapsed
              ? "flex-col justify-center gap-2 py-2.5 px-2"
              : "h-14 justify-between px-4",
          )}
        >
          <Logo size="sm" iconOnly={collapsed} />
          <button
            type="button"
            onClick={toggleCollapse}
            className="flex items-center justify-center text-neutral-600 hover:text-neutral-900 rounded-md p-1.5 hover:bg-neutral-200/60 transition-colors coarse:min-h-11 coarse:min-w-11"
            title={collapsed ? "Perlebar Sidebar" : "Ciutkan Sidebar"}
            aria-label={collapsed ? "Perlebar Sidebar" : "Ciutkan Sidebar"}
          >
            {collapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        {!collapsed && (
          <p className="px-4 pb-1 pt-4 font-mono text-xs uppercase tracking-widest text-neutral-600">
            {title}
          </p>
        )}

        <nav
          className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden scrollbar-none"
          aria-label={`Menu ${title}`}
        >
          <NavLinks nav={nav} rootHref={rootHref} collapsed={collapsed} />
        </nav>

        <div className="border-t border-neutral-300 p-2">
          <LogoutButton collapsed={collapsed} />
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-neutral-300 bg-surface-alt px-4 lg:hidden">
        <Logo size="sm" />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Menu"
                className="min-h-11 min-w-11"
              />
            }
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="border-b border-neutral-300 p-4">
              <SheetTitle className="font-mono text-xs uppercase tracking-widest text-neutral-600">
                {title}
              </SheetTitle>
            </SheetHeader>
            <nav
              className="flex flex-1 flex-col overflow-y-auto py-2"
              aria-label={`Menu ${title} mobile`}
            >
              <NavLinks
                nav={nav}
                rootHref={rootHref}
                collapsed={false}
                onNavigate={() => setOpen(false)}
              />
              <div className="mt-2 border-t border-neutral-300 pt-2">
                <LogoutButton collapsed={false} />
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </header>

      <div
        className={cn(
          "transition-[padding-left] duration-200 ease-in-out",
          collapsed ? "lg:pl-16" : "lg:pl-60",
        )}
      >
        {children}
      </div>
    </>
  );
}
