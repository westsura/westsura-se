import type { Metadata } from "next";
import { Cinzel, Cormorant_Garamond, Karla } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { site } from "@/lib/site";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--next-cinzel", display: "swap" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
  variable: "--next-cormorant",
  display: "swap",
});
const karla = Karla({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--next-karla", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "Westsura Herrgård — en levande herrgårdsdestination i Västmanland", template: "%s | Westsura Herrgård" },
  description:
    "Historisk herrgård från 1680 i Surahammar. Boende i flyglarna, dagskonferens, bröllop och fest, jakt och jakthundsträning. Hundvänligt i samtliga rum.",
  openGraph: { type: "website", locale: "sv_SE", siteName: site.name },
  robots: { index: true, follow: true },
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "LodgingBusiness",
  name: site.name,
  url: site.url,
  telephone: "+46220-31230",
  email: site.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: site.address.street,
    postalCode: site.address.zip,
    addressLocality: site.address.city,
    addressRegion: site.address.region,
    addressCountry: "SE",
  },
  petsAllowed: true,
  checkinTime: "15:00",
  checkoutTime: "11:00",
  foundingDate: "1680",
  amenityFeature: [
    { "@type": "LocationFeatureSpecification", name: "Hundvänligt", value: true },
    { "@type": "LocationFeatureSpecification", name: "Gratis wifi", value: true },
    { "@type": "LocationFeatureSpecification", name: "Gemensamhetskök", value: true },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv" className={`${cinzel.variable} ${cormorant.variable} ${karla.variable}`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
