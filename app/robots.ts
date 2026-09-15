import type { MetadataRoute } from "next";
import { publicSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = publicSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/owner", "/owner/", "/appointments/", "/api/", "/pay/", "/demo/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
