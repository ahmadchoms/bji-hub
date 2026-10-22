import type { MetadataRoute } from "next";
import { getListings, getSellers } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bijihub.com";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/open-store`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const [feed, sellers] = await Promise.all([
      getListings({ pageSize: 100 }),
      getSellers(),
    ]);

    const productRoutes: MetadataRoute.Sitemap = feed.items.map((item) => ({
      url: `${baseUrl}/product/${item.slug}`,
      lastModified: item.createdAt ? new Date(item.createdAt) : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const storeRoutes: MetadataRoute.Sitemap = sellers.map((seller) => ({
      url: `${baseUrl}/store/${seller.slug}`,
      lastModified: seller.createdAt ? new Date(seller.createdAt) : new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [...staticRoutes, ...productRoutes, ...storeRoutes];
  } catch {
    // ignore: dynamic sitemap fetch fallback to static
    return staticRoutes;
  }
}
