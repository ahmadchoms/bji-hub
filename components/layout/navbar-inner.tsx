"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, LogOut } from "lucide-react";
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
  "outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 focus-visible:ring-offset-2 rounded-md";

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
        "relative px-3 py-1.5 text-xs font-semibold tracking-wide transition-all duration-150 rounded-md select-none",
        focusRing,
        active
          ? "bg-primary-50/80 text-primary-900 font-bold"
          : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/70",
      )}
    >
      {item.label}
    </Link>
  );
}

function LogoutForm({ className }: { className?: string }) {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className={cn(
          "flex items-center gap-2 text-xs font-medium text-neutral-500 transition-colors hover:text-status-error cursor-pointer",
          focusRing,
          className,
        )}
      >
        <LogOut className="h-3.5 w-3.5" />
        <span>Keluar</span>
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

  return (
    <>
      <header className="sticky top-0 z-40 hidden border-b border-neutral-200/80 bg-surface-base/85 backdrop-blur-md transition-all md:block">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Logo size="md" />
            <nav
              className="flex items-center gap-1"
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

          <div className="flex items-center gap-3">
            {nav.account && (
              <DesktopLink
                item={nav.account}
                active={isActive(nav.account.href)}
              />
            )}
            {nav.canLogout && <LogoutForm className="px-2 py-1.5" />}
            {nav.cta && (
              <Link
                href={nav.cta.href}
                className={cn(
                  buttonVariants({ variant: "primary", size: "sm" }),
                  "ml-1 shadow-xs",
                )}
              >
                {nav.cta.label}
              </Link>
            )}
          </div>
        </div>
      </header>

      <header className="sticky top-0 z-40 border-b border-neutral-200/80 bg-surface-base/85 backdrop-blur-md md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/" className={focusRing}>
            <Logo size="md" />
          </Link>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Menu"
                  className="rounded-md hover:bg-neutral-100"
                />
              }
            >
              <Menu className="h-5 w-5 text-neutral-700" />
            </SheetTrigger>

            <SheetContent side="right" className="w-80 p-0 sm:max-w-xs">
              <SheetHeader className="border-b border-neutral-200/80 p-4 text-left">
                <SheetTitle className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Navigasi
                </SheetTitle>
              </SheetHeader>

              <div className="flex flex-col justify-between h-[calc(100vh-57px)] p-4">
                <nav
                  className="flex flex-col gap-1"
                  aria-label="Navigasi mobile"
                >
                  {nav.links.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex h-10 w-full items-center rounded-md px-3 text-xs font-semibold transition-colors",
                          focusRing,
                          active
                            ? "bg-primary-50 text-primary-900"
                            : "text-neutral-700 hover:bg-neutral-100/70 hover:text-neutral-900",
                        )}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>

                <div className="flex flex-col gap-3 pt-4 border-t border-neutral-200/80">
                  {nav.account && (
                    <Link
                      href={nav.account.href}
                      className={cn(
                        "flex h-10 w-full items-center justify-between rounded-md px-3 text-xs font-semibold text-neutral-700 hover:bg-neutral-100/70",
                        focusRing,
                        isActive(nav.account.href) &&
                          "bg-primary-50 text-primary-900",
                      )}
                    >
                      <span>{nav.account.label}</span>
                    </Link>
                  )}

                  {nav.canLogout && (
                    <div className="px-3 py-1">
                      <LogoutForm />
                    </div>
                  )}

                  {nav.cta && (
                    <Link
                      href={nav.cta.href}
                      className={cn(
                        buttonVariants({ variant: "primary", size: "lg" }),
                        "w-full text-xs font-semibold shadow-xs",
                      )}
                    >
                      {nav.cta.label}
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
    </>
  );
}
