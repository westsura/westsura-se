import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { evenemangAdresser } from "@/lib/aktuellt";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
    { path: "/jaktklubb", priority: 0.6, freq: "monthly" },
    { path: "/jaktklubb/hundekipage", priority: 0.5, freq: "monthly" },
    { path: "/jaktklubb/villkor", priority: 0.2, freq: "yearly" },
    { path: "/paket", priority: 0.7, freq: "monthly" },
    { path: "/paket/naturfoto", priority: 0.7, freq: "weekly" },
    { path: "/om-oss", priority: 0.5, freq: "yearly" },
    { path: "/goda-grannar", priority: 0.5, freq: "monthly" },
    { path: "/kontakt", priority: 0.5, freq: "yearly" },
    { path: "/villkor", priority: 0.2, freq: "yearly" },
    { path: "/integritetspolicy", priority: 0.1, freq: "yearly" },
  ];
  // Evenemangen under Aktuellt — kommande högre än passerade.
  const idag = now.toISOString().slice(0, 10);
  const evenemang = (await evenemangAdresser()).map((e) => ({ path: `/aktuellt/${e.slug}`, priority: e.datum >= idag ? 0.7 : 0.3, freq: (e.datum >= idag ? "weekly" : "yearly") as MetadataRoute.Sitemap[number]["changeFrequency"] }));
  return [...pages, ...evenemang].map((p) => ({ url: site.url + p.path, lastModified: now, changeFrequency: p.freq, priority: p.priority }));
}
