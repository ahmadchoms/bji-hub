import type { Role } from "@/lib/auth/roles";

export interface NavItem {
  label: string;
  href: string;
}

export interface NavModel {
  links: NavItem[];
  account: NavItem | null;
  cta: NavItem | null;
  canLogout: boolean;
}

const LINKS: NavItem[] = [{ label: "Paket Penjual", href: "/pricing" }];

export function getNavModel(role: Role): NavModel {
  switch (role) {
    case "seller":
      return {
        links: LINKS,
        account: { label: "Dashboard", href: "/dashboard" },
        cta: { label: "Riwayat Pesanan", href: "/dashboard/orders" },
        canLogout: true,
      };
    case "admin":
      return {
        links: LINKS,
        account: { label: "Admin", href: "/admin" },
        cta: null,
        canLogout: true,
      };
    case "buyer":
      return {
        links: LINKS,
        account: { label: "Akun Saya", href: "/profile" },
        cta: { label: "Riwayat Pesanan", href: "/orders" },
        canLogout: true,
      };
    default:
      return {
        links: LINKS,
        account: { label: "Masuk", href: "/login" },
        cta: null,
        canLogout: false,
      };
  }
}
