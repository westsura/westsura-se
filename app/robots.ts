import type { MetadataRoute } from "next";
import { site, indexera } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  if (!indexera) return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: { userAgent: "*", allow: "/" }, sitemap: site.url + "/sitemap.xml" };
}
