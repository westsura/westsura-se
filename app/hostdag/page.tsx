import type { Metadata } from "next";
import Image from "next/image";
import { Hero } from "@/components/Blocks";
import Signup from "@/components/Signup";

export const metadata: Metadata = {
  title: "Westsura Höstdag 2026 — lördag 26 september",
  description: "Höstdag på Westsura Herrgård lördag 26 september kl. 10–16, i samband med konst-, mat- och hantverksrundan MERSMAK. Café, mat från grillen, lokala utställare och öppen keramikverkstad.",
  alternates: { canonical: "/hostdag" },
};

const eventLd = {
  "@context": "https://schema.org", "@type": "Event", name: "Westsura Höstdag 2026",
  startDate: "2026-09-26T10:00:00+02:00", endDate: "2026-09-26T16:00:00+02:00",
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode", eventStatus: "https://schema.org/EventScheduled",
  location: { "@type": "Place", name: "Westsura Herrgård", address: { "@type": "PostalAddress", streetAddress: "Lisjövägen 50", postalCode: "735 91", addressLocality: "Surahammar", addressCountry: "SE" } },
  organizer: { "@type": "Organization", name: "Westsura Herrgård", url: "https://www.westsura.se" },
  isAccessibleForFree: true,
};

export default function Hostdag() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventLd) }} />
      <Hero src="/bilder/julmarknad-fasad.jpg" alt="Marknadsstånd vid herrgårdens gula fasad" sub label="Lördag 26 september 2026 · kl. 10–16" title="westsura höstdag"
        lede="En dag fylld av höststämning, god mat, hantverk och aktiviteter — i samband med konst-, mat- och hantverksrundan MERSMAK." />
      <section className="section section--tight">
        <div className="container split" style={{ alignItems: "start" }}>
          <div className="prose">
            <p>Under dagen kan du besöka vårt café i herrgården, njuta av mat från grillen, upptäcka lokala mat- och hantverksutställare och titta in i den öppna keramikverkstaden hos Bodaskeramik.</p>
            <p>MERSMAK sträcker sig över Surahammar, Fagersta, Norberg och Skinnskatteberg, med konstnärer, hantverkare, producenter och besöksmål att upptäcka längs vägen. Låt Westsura Herrgård bli ett av stoppen på din runda.</p>
            <p>Ta med familj och vänner — och hunden — och njut av en höstdag på herrgården med lokal mat, genuint hantverk, fika och aktiviteter för stora och små. Fri entré.</p>
            <h2 className="lower">program</h2>
            <ul>
              <li>10.00 — Portarna öppnas. Caféet i herrgården slår upp.</li>
              <li>11.00–15.00 — Mat från grillen på gårdsplanen.</li>
              <li>Hela dagen — Lokala utställare, öppen keramikverkstad hos Bodaskeramik.</li>
              <li>16.00 — Dagen avslutas.</li>
            </ul>
          </div>
          <div style={{ aspectRatio: "3 / 4", overflow: "hidden", position: "relative" }}>
            <Image src="/bilder/julmarknad-1.jpg" alt="Besökare på marknaden med herrgården i bakgrunden" fill sizes="(max-width: 860px) 100vw, 50vw" style={{ objectFit: "cover" }} />
          </div>
        </div>
      </section>
      <section className="section tint">
        <div className="container" style={{ maxWidth: 760, textAlign: "center" }}>
          <p className="label">Missa inte nästa</p>
          <h2 className="lower">bli vän med herrgården</h2>
          <p style={{ margin: "0 auto 20px" }}>Westsuras Vänner får inbjudan till höstdagar, julmarknad och temakvällar några dagar innan de blir offentliga.</p>
          <Signup />
        </div>
      </section>
    </>
  );
}
