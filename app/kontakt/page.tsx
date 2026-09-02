import type { Metadata } from "next";
import { PageHead } from "@/components/Blocks";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Kontakt & hitta hit",
  description: "Westsura Herrgård, Lisjövägen 50, 735 91 Surahammar. Telefon 0220-312 30, boka@westsura.se. Trettio minuter från Västerås.",
  alternates: { canonical: "/kontakt" },
};

export default function Kontakt() {
  return (
    <>
      <PageHead label="Kontakt" title="hör av dig" lede="Ring, mejla eller kom förbi. Vi svarar gärna på frågor om boende, fest, konferens och jakt." />
      <section style={{ paddingBottom: 96 }}>
        <div className="container split" style={{ alignItems: "start" }}>
          <div className="prose">
            <h2 className="lower">telefon och e-post</h2>
            <p style={{ fontSize: 22 }}><a href={site.phoneHref}>{site.phone}</a><br /><a href={`mailto:${site.email}`}>{site.email}</a></p>
            <h2 className="lower">adress</h2>
            <p>{site.name}<br />{site.address.street}<br />{site.address.zip} {site.address.city}</p>
            <h2 className="lower">hitta hit</h2>
            <p>Från Västerås: väg 66 mot Fagersta, avfart Surahammar, sedan skyltat mot Westsura. Cirka 30 minuter med bil. Från Stockholm drygt en och en halv timme. Gott om parkering vid huset.</p>
            <p><a className="link-more" href="https://maps.google.com/?q=Lisj%C3%B6v%C3%A4gen+50,+735+91+Surahammar" target="_blank" rel="noopener">Öppna i kartan →</a></p>
          </div>
          <div>
            <div className="card">
              <h3>Bokningar</h3>
              <p style={{ fontSize: 16 }}>Boende bokas direkt på sajten. Fest, bröllop, konferens och jakt börjar med en förfrågan eller ett samtal.</p>
              <p style={{ fontSize: 16, marginBottom: 0 }}><strong>{site.company}</strong><br />Org.nr {site.orgNr}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
