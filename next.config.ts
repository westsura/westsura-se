import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Bilderna skickas som de är från /public. Vercels bildförminskning har en månadsgräns
    // på gratisplanen, och när den tog slut slutade bilderna visas.
    unoptimized: true,
  },
  async headers() {
    if (process.env.INDEXERA === "1") return [];
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }] }];
  },
  async redirects() {
    // Gamla WordPress-adresser pekas om så att inarbetad synlighet på Google följer med.
    return [
      { source: "/paketerbjudanden", destination: "/paket", permanent: true },
      { source: "/fest", destination: "/fira", permanent: true },
      { source: "/evenemang", destination: "/event", permanent: true },
      { source: "/hundarpawestsuraherrgard", destination: "/hundar", permanent: true },
      { source: "/bokningsvillkor", destination: "/villkor", permanent: true },
      { source: "/kanot-dagsaventyret", destination: "/paket", permanent: true },
      { source: "/kanot-kvallsturen", destination: "/paket", permanent: true },
      { source: "/franglodtillgourmet", destination: "/paket", permanent: true },
      { source: "/golfpaket", destination: "/paket", permanent: true },
      // Jaktklubbens sida hette /jaktklubben fram till september 2026.
      { source: "/jaktklubben", destination: "/jaktklubb", permanent: true },
      // Gamla adresser med stor bokstav (/Konferens) hanteras i middleware.ts —
      // här skulle de matcha även /konferens och ge en oändlig omdirigering.
      // WordPress egna sidor: författare, kategorier, taggar, flöden och inloggning.
      { source: "/author/:slug*", destination: "/om-oss", permanent: true },
      { source: "/category/:slug*", destination: "/", permanent: true },
      { source: "/tag/:slug*", destination: "/", permanent: true },
      { source: "/feed", destination: "/", permanent: true },
      // Gamla WordPress-sitemaps (Yoast m.fl.) pekas till den nya.
      { source: "/sitemap_index.xml", destination: "/sitemap.xml", permanent: true },
      ...["page-sitemap.xml", "post-sitemap.xml", "category-sitemap.xml", "author-sitemap.xml"].map((f) => ({ source: `/${f}`, destination: "/sitemap.xml", permanent: true })),
      { source: "/wp-sitemap.xml", destination: "/sitemap.xml", permanent: true },
      { source: "/comments/feed", destination: "/", permanent: true },
      { source: "/wp-login.php", destination: "/", permanent: true },
      { source: "/wp-admin/:path*", destination: "/", permanent: true },
      // Bilder från gamla sajten som vi flyttat in (samma filnamn) — Google Bilder hittar dem kvar.
      { source: "/wp-content/uploads/:ar/:man/:fil", destination: "/bilder/wp/:fil", permanent: true },
    ];
  },
};

export default nextConfig;
