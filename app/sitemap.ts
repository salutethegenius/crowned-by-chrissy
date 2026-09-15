import type { MetadataRoute } from "next";
import { PUBLIC_ROUTES, publicSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = publicSiteUrl();
  const now = new Date();
  return PUBLIC_ROUTES.map((route) => ({
    url: `${base}${route.path === "/" ? "" : route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
    ...(route.path === "/"
      ? { images: [`${base}/opengraph-image`] }
      : {}),
  }));
}
