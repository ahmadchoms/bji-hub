import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getListingBySlug } from "@/lib/data";
import { PageContainer } from "@/components/layout/page-container";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";
import { getOrdersByBuyer } from "@/lib/data/orders";
import type { BuyerAddress } from "@/types";

interface CheckoutPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CheckoutPageProps): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);

  if (!listing) {
    return { title: "Checkout - Biji Hub" };
  }

  return {
    title: `Checkout: ${listing.title} - Biji Hub`,
    description: `Checkout aman untuk produk ${listing.title} langsung dari petani atau roaster terverifikasi.`,
  };
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);

  if (!listing) {
    notFound();
  }

  const session = await getSession();
  const checkoutUrl = `/checkout/${slug}`;

  // 1. Must be logged in
  if (session.role === "guest") {
    redirect(`/login?next=${encodeURIComponent(checkoutUrl)}`);
  }

  let userEmail = "";
  let userName = "";
  let userPhone = "";
  let userProvince = "";
  let userCity = "";
  let userPostalCode = "";
  let userAddress = "";

  let userAddresses: BuyerAddress[] = [];

  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        userEmail = user.email || "";
        userName =
          ((user.user_metadata?.name ||
            user.user_metadata?.full_name ||
            user.email?.split("@")[0]) as string) || "";
        userPhone = (user.user_metadata?.phone as string) || "";
        userProvince = (user.user_metadata?.province as string) || "";
        userCity = (user.user_metadata?.city as string) || "";
        userPostalCode = (user.user_metadata?.postal_code as string) || "";
        userAddress = (user.user_metadata?.address as string) || "";
        if (Array.isArray(user.user_metadata?.addresses) && user.user_metadata.addresses.length > 0) {
          userAddresses = user.user_metadata.addresses as BuyerAddress[];
          const primary = userAddresses.find((a) => a.isPrimary) || userAddresses[0];
          if (primary) {
            userPhone = userPhone || primary.phone || "";
            userProvince = userProvince || primary.province || "";
            userCity = userCity || primary.city || "";
            userPostalCode = userPostalCode || primary.postalCode || "";
            userAddress = userAddress || primary.address || "";
          }
        }
      }
    } catch {
      // ignore
    }
  }

  // Cookie fallback if stored locally
  if (!userPhone || !userCity || !userAddress || userAddresses.length === 0) {
    try {
      const cookieStore = await cookies();
      const raw = cookieStore.get("biji-buyer-profile")?.value;
      if (raw) {
        const parsed = JSON.parse(raw);
        userName = userName || parsed.name || "";
        userPhone = userPhone || parsed.phone || "";
        userProvince = userProvince || parsed.province || "";
        userCity = userCity || parsed.city || "";
        userPostalCode = userPostalCode || parsed.postalCode || "";
        userAddress = userAddress || parsed.address || "";
        if (Array.isArray(parsed.addresses) && parsed.addresses.length > 0) {
          if (userAddresses.length === 0) {
            userAddresses = parsed.addresses as BuyerAddress[];
          }
          const primary = (parsed.addresses as BuyerAddress[]).find((a) => a.isPrimary) || (parsed.addresses[0] as BuyerAddress);
          if (primary) {
            userPhone = userPhone || primary.phone || "";
            userProvince = userProvince || primary.province || "";
            userCity = userCity || primary.city || "";
            userPostalCode = userPostalCode || primary.postalCode || "";
            userAddress = userAddress || primary.address || "";
          }
        }
      }
    } catch {
      // ignore
    }
  }

  // Cloud database fallback: query previous order shipping details if not in user_metadata
  if (!userPhone || !userCity || !userAddress) {
    try {
      const pastOrders = await getOrdersByBuyer(userEmail, session.userId);
      if (pastOrders.length > 0) {
        const latest = pastOrders[0];
        userName = userName || latest.buyerName;
        userPhone = userPhone || latest.buyerPhone;
        userCity = userCity || latest.buyerCity;
        userAddress = userAddress || latest.buyerAddress;
      }
    } catch {
      // ignore
    }
  }

  if (!userEmail) {
    userEmail = "pembeli@bijihub.com";
  }

  // 2. Profile Gating: Ensure essential order delivery data is completed
  const isProfileComplete = Boolean(
    userName.trim().length >= 2 &&
      userPhone.trim().length >= 8 &&
      userCity.trim().length >= 3 &&
      userAddress.trim().length >= 5,
  );

  if (!isProfileComplete) {
    redirect(
      `/profile?required=shipping&next=${encodeURIComponent(checkoutUrl)}`,
    );
  }

  const initialBuyer = {
    name: userName,
    email: userEmail,
    phone: userPhone,
    province: userProvince,
    city: userCity,
    postalCode: userPostalCode,
    address: userAddress,
  };

  return (
    <div className="py-8 md:py-12">
      <PageContainer className="space-y-6">
        {/* Breadcrumb */}
        <nav
          className="flex items-center gap-2 text-xs text-neutral-500 font-mono overflow-x-auto whitespace-nowrap"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-primary-700">
            Beranda
          </Link>
          <span>/</span>
          <Link
            href={`/product/${listing.slug}`}
            className="hover:text-primary-700"
          >
            {listing.title}
          </Link>
          <span>/</span>
          <span className="text-neutral-900 font-medium">Checkout</span>
        </nav>

        <CheckoutForm
          listing={listing}
          initialBuyer={initialBuyer}
          savedAddresses={userAddresses}
        />
      </PageContainer>
    </div>
  );
}
