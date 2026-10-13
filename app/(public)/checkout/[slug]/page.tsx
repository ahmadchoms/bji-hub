import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getListingBySlug } from "@/lib/data";
import { PageContainer } from "@/components/layout/page-container";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { createClient } from "@/lib/supabase/server";

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
    description: `Checkout aman bergaransi escrow untuk produk ${listing.title} langsung dari petani atau roaster terverifikasi.`,
  };
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);

  if (!listing) {
    notFound();
  }

  let userEmail = "";
  let userName = "";
  let userPhone = "";
  let userCity = "";
  let userAddress = "";

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
        userCity = (user.user_metadata?.city as string) || "";
        userAddress = (user.user_metadata?.address as string) || "";
      }
    } catch {
      // ignore
    }
  }

  const initialBuyer = {
    name: userName,
    email: userEmail,
    phone: userPhone,
    city: userCity || "",
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
          <Link href="/catalog" className="hover:text-primary-700">
            Katalog
          </Link>
          <span>/</span>
          <Link href={`/product/${listing.slug}`} className="hover:text-primary-700">
            {listing.title}
          </Link>
          <span>/</span>
          <span className="text-neutral-900 font-medium">Checkout</span>
        </nav>

        <CheckoutForm listing={listing} initialBuyer={initialBuyer} />
      </PageContainer>
    </div>
  );
}
