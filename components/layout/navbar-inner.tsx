"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/actions/auth.actions";
import { getNavModel, type NavItem } from "@/lib/auth/nav";
import type { Role } from "@/lib/auth/roles";

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded-sm";

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => {
    const path = href.split("?")[0];
    return path === "/" ? pathname === "/" : pathname.startsWith(path);
  };
}

function DesktopLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "py-1 text-sm transition-colors",
        focusRing,
        active
          ? "border-b-2 border-primary-600 font-medium text-primary-900"
          : "text-neutral-700 hover:text-neutral-900",
      )}
    >
      {item.label}
    </Link>
  );
}

function LogoutForm({ className }: { className?: string }) {
  return (
    <form action={logoutAction}>
      <button type="submit" className={cn(focusRing, className)}>
        Keluar
      </button>
    </form>
  );
}

export function NavbarInner({ role }: { role: Role }) {
  const pathname = usePathname();
  const isActive = useIsActive();
  const [open, setOpen] = useState(false);
  const nav = getNavModel(role);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const mobileRow =
    "flex min-h-12 w-full items-center border-b border-neutral-200 px-3 py-3 text-left text-sm";

  return (
    <>
      <header className="sticky top-0 z-40 hidden border-b border-neutral-300 bg-surface-base md:block">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-10">
            <Logo size="md" />
            <nav
              className="flex items-center gap-6"
              aria-label="Navigasi utama"
            >
              {nav.links.map((link) => (
                <DesktopLink
                  key={link.href}
                  item={link}
                  active={isActive(link.href)}
                />
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-6">
            {nav.account && (
              <DesktopLink
                item={nav.account}
                active={isActive(nav.account.href)}
              />
            )}
            {nav.canLogout && (
              <LogoutForm className="text-sm text-neutral-600 hover:text-neutral-900" />
            )}
            {nav.cta && (
              <Link
                href={nav.cta.href}
                className={cn(
                  buttonVariants({ variant: "primary", size: "sm" }),
                  "min-h-10",
                )}
              >
                {nav.cta.label}
              </Link>
            )}
          </div>
        </div>
      </header>

      <header className="sticky top-0 z-40 border-b border-neutral-300 bg-surface-base md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Logo size="md" />
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
            <SheetContent side="right" className="w-72 p-0">
              <SheetHeader className="border-b border-neutral-300 p-4">
                <SheetTitle className="text-sm font-medium">Menu</SheetTitle>
              </SheetHeader>
              <nav
                className="flex flex-col gap-1 p-4"
                aria-label="Navigasi mobile"
              >
                {[...nav.links, ...(nav.account ? [nav.account] : [])].map(
                  (item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={isActive(item.href) ? "page" : undefined}
                      className={cn(
                        mobileRow,
                        focusRing,
                        isActive(item.href)
                          ? "border-b-0 border-l-2 border-l-primary-600 font-medium text-primary-900"
                          : "text-neutral-700",
                      )}
                    >
                      {item.label}
                    </Link>
                  ),
                )}
                {nav.canLogout && (
                  <LogoutForm className={cn(mobileRow, "text-neutral-700")} />
                )}
                {nav.cta && (
                  <div className="pt-4">
                    <Link
                      href={nav.cta.href}
                      className={cn(
                        buttonVariants({ variant: "primary", size: "lg" }),
                        "w-full",
                      )}
                    >
                      {nav.cta.label}
                    </Link>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>
    </>
  );
}
