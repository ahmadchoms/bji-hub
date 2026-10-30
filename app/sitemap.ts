import type { MetadataRoute } from "next";
import { getListings, getSellers } from "@/lib/data";
import { getCoffeeOrigins, toOriginSlug } from "@/lib/data/origins";
import { getProducers } from "@/lib/data/producers";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bijihub.com";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/asal-kopi`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/open-store`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/shipping-policy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
    { url: `${baseUrl}/refund-policy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const allListings: Array<{ slug: string; updatedAt?: string; createdAt?: string }> = [];
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const res = await getListings({ page, pageSize: 500 });
      for (const item of res.items) {
        allListings.push(item);
      }
      if (res.items.length < 500 || page >= 20) {
        hasMore = false;
      } else {
        page++;
      }
    }

    const [sellers, origins, producers] = await Promise.all([
      getSellers(),
      getCoffeeOrigins({ activeOnly: true }).catch(() => []),
      getProducers().catch(() => []),
    ]);

    const productRoutes: MetadataRoute.Sitemap = allListings.map((item) => ({
      url: `${baseUrl}/product/${item.slug}`,
      lastModified: item.updatedAt
        ? new Date(item.updatedAt)
        : item.createdAt
          ? new Date(item.createdAt)
          : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const storeRoutes: MetadataRoute.Sitemap = sellers.map((seller) => ({
      url: `${baseUrl}/store/${seller.slug}`,
      lastModified: seller.createdAt ? new Date(seller.createdAt) : new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const originRoutes: MetadataRoute.Sitemap = origins.map((origin) => ({
      url: `${baseUrl}/asal-kopi/${toOriginSlug(origin)}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const producerRoutes: MetadataRoute.Sitemap = producers.map((producer) => ({
      url: `${baseUrl}/petani/${producer.slug}`,
      lastModified: producer.createdAt ? new Date(producer.createdAt) : new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [
      ...staticRoutes,
      ...productRoutes,
      ...storeRoutes,
      ...originRoutes,
      ...producerRoutes,
    ];
  } catch {
    // ignore: dynamic sitemap fetch fallback to static
    return staticRoutes;
  }
}
