import type { MetadataRoute } from "next";
import { getApprovedCreators } from "@/lib/data/creators";
import { siteUrl } from "@/lib/email/config";
import { facetPath, listFacetPages } from "@/lib/seo/facets";

// 給 Google 的網站地圖：公開頁、探索頁可見的工作室、地區／服務／風格搜尋頁
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();
  const creators = await getApprovedCreators().catch(() => []);

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/explore`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/register`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.1 },
  ];

  const studioPages: MetadataRoute.Sitemap = creators.map((c) => ({
    url: `${base}/creator/${c.slug}`,
    lastModified: c.updated_at ? new Date(c.updated_at) : now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const facetPages: MetadataRoute.Sitemap = listFacetPages(creators).map((p) => ({
    url: `${base}${facetPath(p.kind, p.value, p.service)}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: p.service ? 0.6 : 0.8,
  }));

  return [...staticPages, ...facetPages, ...studioPages];
}
