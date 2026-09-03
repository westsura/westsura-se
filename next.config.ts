import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "westsura.se", pathname: "/wp-content/uploads/**" },
    ],
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
    ];
  },
};

export default nextConfig;
