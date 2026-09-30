"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/mock/session";

interface NavLink {
  label: string;
  href: string;
  roles: ("guest" | "buyer" | "seller" | "admin")[];
}

const links: NavLink[] = [
  { label: "Paket Penjual", href: "/pricing", roles: ["guest", "buyer", "seller", "admin"] },
];

function getJualKopiHref(role: string): string {
  if (role === "seller") return "/dashboard/listing";
  return "/register?role=seller";
}

function getJualKopiLabel(role: string): string {
  if (role === "seller") return "Dashboard";
  return "Jual Kopi";
}

function getMasukHref(role: string): string {
  if (role === "seller") return "/dashboard";
  if (role === "admin") return "/admin";
  if (role === "buyer") return "/dashboard";
  return "/login";
}

function getMasukLabel(role: string): string {
  if (role === "seller") return "Dashboard";
  if (role === "admin") return "Admin";
  if (role === "buyer") return "Akun Saya";
  return "Masuk";
}

export function NavbarInner() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, logout } = useSession();
  const isLoggedIn = role !== "guest";

  const filteredLinks = links.filter((link) => link.roles.includes(role as "guest" | "buyer" | "seller" | "admin"));
  const jualKopi = { label: getJualKopiLabel(role), href: getJualKopiHref(role) };
  const masuk = { label: getMasukLabel(role), href: getMasukHref(role) };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const handleNavClick = () => {
    router.refresh();
  };

  return (
    <>
      {/* Desktop */}
      <header className="sticky top-0 z-40 hidden border-b border-neutral-300 bg-surface-base md:block">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-10">
            <Link href="/" aria-label="Biji — Beranda" className="outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded-sm">
              <Logo size="md" />
            </Link>
            <nav className="flex items-center gap-6" aria-label="Navigasi utama">
              {filteredLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={cn(
                    "py-1 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded-sm",
                    isActive(link.href)
                      ? "border-b-2 border-primary-600 text-primary-900 font-medium"
                      : "text-neutral-700 hover:text-neutral-900"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-6">
            {isLoggedIn && (
              <button
                type="button"
                onClick={() => { logout(); handleNavClick(); }}
                className="text-sm text-neutral-600 hover:text-neutral-900 outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded-sm"
              >
                Keluar
              </button>
            )}
            {!isLoggedIn && (
              <Link
                href={masuk.href}
                className="text-sm text-neutral-700 hover:text-neutral-900 outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded-sm"
              >
                {masuk.label}
              </Link>
            )}
            <Button variant="primary" size="sm" onClick={() => { router.push(jualKopi.href); handleNavClick(); }}>
              {jualKopi.label}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile */}
      <header className="sticky top-0 z-40 border-b border-neutral-300 bg-surface-base md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/" aria-label="Biji — Beranda" className="outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded-sm">
            <Logo size="md" />
          </Link>
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label="Menu" className="min-h-11 min-w-11" />
              }
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <SheetHeader className="border-b border-neutral-300 p-4">
                <SheetTitle className="text-sm font-medium">Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col p-4 gap-1" aria-label="Navigasi mobile">
                {filteredLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={isActive(link.href) ? "page" : undefined}
                    onClick={handleNavClick}
                    className={cn(
                      "flex items-center min-h-12 px-3 py-3 text-sm border-b border-neutral-200 outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded-sm",
                      isActive(link.href)
                        ? "border-l-2 border-l-primary-600 border-b-0 text-primary-900 font-medium"
                        : "text-neutral-700"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                {isLoggedIn && (
                  <button
                    type="button"
                    onClick={() => { logout(); handleNavClick(); }}
                    className="flex items-center min-h-12 px-3 py-3 text-sm text-neutral-700 border-b border-neutral-200 outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded-sm text-left"
                  >
                    Keluar
                  </button>
                )}
                {!isLoggedIn && (
                  <Link
                    href={masuk.href}
                    onClick={handleNavClick}
                    className="flex items-center min-h-12 px-3 py-3 text-sm text-neutral-700 border-b border-neutral-200 outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded-sm"
                  >
                    {masuk.label}
                  </Link>
                )}
                <div className="pt-4">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={() => { router.push(jualKopi.href); handleNavClick(); }}
                  >
                    {jualKopi.label}
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>
    </>
  );
}