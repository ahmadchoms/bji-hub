"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
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
  onNavigate,
}: {
  nav: readonly (DashboardNavItem & {
    icon?: React.ComponentType<{ className?: string }>;
  })[];
  rootHref: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === rootHref ? pathname === href : pathname.startsWith(href);

  return (
    <nav className="flex flex-col gap-1 p-1">
      {nav.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "font-mono group relative flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-semibold tracking-wide transition-all duration-150 select-none",
              focusRing,
              active
                ? "bg-primary-50/80 text-primary-900 font-bold"
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
                    : "text-neutral-400 group-hover:text-neutral-700",
                )}
              />
            )}

            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function LogoutButton() {
  return (
    <form className="px-2" action={logoutAction}>
      <button
        type="submit"
        className={cn(
          "cursor-pointer font-mono font-semibold flex min-h-11 w-full items-center px-4 text-left text-sm text-neutral-600 hover:text-red-600 hover:bg-red-100 transition-colors ease-in-out delay-75 rounded-md",
          focusRing,
        )}
      >
        Keluar
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

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-neutral-300 bg-surface-alt lg:flex">
        <div className="flex h-14 items-center border-b border-neutral-300 px-4">
          <Logo size="sm" />
        </div>
        <p className="px-4 pb-1 pt-5 font-mono text-[10px] uppercase tracking-widest text-neutral-500">
          {title}
        </p>
        <nav className="flex flex-1 flex-col" aria-label={`Menu ${title}`}>
          <NavLinks nav={nav} rootHref={rootHref} />
        </nav>
        <div className="border-t border-neutral-300 py-2">
          <LogoutButton />
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
              <SheetTitle className="font-mono text-[10px] font-normal uppercase tracking-widest text-neutral-500">
                {title}
              </SheetTitle>
            </SheetHeader>
            <nav
              className="flex flex-col py-2"
              aria-label={`Menu ${title} mobile`}
            >
              <NavLinks
                nav={nav}
                rootHref={rootHref}
                onNavigate={() => setOpen(false)}
              />
              <div className="mt-2 border-t border-neutral-300 pt-2">
                <LogoutButton />
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </header>

      <div className="lg:pl-56">{children}</div>
    </>
  );
}
