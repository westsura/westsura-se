import type { MetadataRoute } from "next";
import { site, indexera } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  if (!indexera) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Inloggade delar och sidor utan värde i sökresultat.
      disallow: ["/admin", "/jaktklubb/medlem", "/jaktklubb/login", "/jaktklubb/auth", "/vanner/"],
    },
    sitemap: site.url + "/sitemap.xml",
    host: site.url,
  };
}
