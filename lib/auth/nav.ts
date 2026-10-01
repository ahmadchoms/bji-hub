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
const BECOME_SELLER: NavItem = {
  label: "Jual Kopi",
  href: "/register?role=seller",
};

export function getNavModel(role: Role): NavModel {
  switch (role) {
    case "seller":
      return {
        links: LINKS,
        account: { label: "Dashboard", href: "/dashboard" },
        cta: { label: "Jual Kopi", href: "/dashboard/listing" },
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
        account: null,
        cta: BECOME_SELLER,
        canLogout: true,
      };
    default:
      return {
        links: LINKS,
        account: { label: "Masuk", href: "/login" },
        cta: BECOME_SELLER,
        canLogout: false,
      };
  }
}
