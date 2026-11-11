import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/email/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // 後台、登入流程、API 不需要被搜尋
      disallow: ["/admin", "/dashboard", "/api", "/auth", "/join", "/unsubscribe", "/login", "/forgot-password"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
