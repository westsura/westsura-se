import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "/", priority: 1, freq: "weekly" },
    { path: "/boende", priority: 0.9, freq: "weekly" },
    { path: "/brollop", priority: 0.9, freq: "monthly" },
    { path: "/fira", priority: 0.9, freq: "monthly" },
    { path: "/minnesstunder", priority: 0.8, freq: "monthly" },
    { path: "/konferens", priority: 0.8, freq: "monthly" },
    { path: "/event", priority: 0.8, freq: "monthly" },
    { path: "/hundar", priority: 0.7, freq: "monthly" },
    { path: "/jakt", priority: 0.7, freq: "monthly" },
    { path: "/paket", priority: 0.7, freq: "monthly" },
    { path: "/hostdag", priority: 0.6, freq: "weekly" },
    { path: "/om-oss", priority: 0.5, freq: "yearly" },
    { path: "/goda-grannar", priority: 0.5, freq: "monthly" },
    { path: "/kontakt", priority: 0.5, freq: "yearly" },
    { path: "/villkor", priority: 0.2, freq: "yearly" },
  ];
  return pages.map((p) => ({ url: site.url + p.path, lastModified: now, changeFrequency: p.freq, priority: p.priority }));
}
