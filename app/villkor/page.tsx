import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/Blocks";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Bokningsvillkor", description: "Bokningsvillkor för boende på Westsura Herrgård: bokning, betalning, avbokning, ombokning, in- och utcheckning.", alternates: { canonical: "/villkor" } };

export default function Villkor() {
  return (
    <>
      <PageHead label="Bra att veta" title="bokningsvillkor" lede="Vi vill att det ska kännas tryggt och enkelt att boka en vistelse hos oss. Har du frågor är du alltid välkommen att kontakta oss." />
      <section style={{ paddingBottom: 96 }}>
        <div className="container prose">
          <h2 className="lower">bokning</h2>
          <p>Din bokning är bindande när du har fått en bokningsbekräftelse från oss via e-post. En bokning på webben är preliminär tills dess.</p>
          <h2 className="lower">betalning</h2>
          <p>Betalning sker senast 7 dagar före ankomst, eller mot faktura enligt överenskommelse. Bokningar som görs mindre än 7 dagar före ankomst betalas i samband med bokningen.</p>
          <h2 className="lower">avbokning</h2>
          <ul>
            <li>Mer än 7 dagar före ankomst — kostnadsfri avbokning.</li>
            <li>7–2 dagar före ankomst — 50 % av bokningens värde debiteras.</li>
            <li>Mindre än 48 timmar före ankomst eller vid utebliven ankomst — 100 % debiteras.</li>
          </ul>
          <h2 className="lower">ombokning</h2>
          <p>Ombokning kan göras kostnadsfritt fram till 7 dagar före ankomst i mån av tillgänglighet. Eventuell prisskillnad debiteras eller återbetalas.</p>
          <h2 className="lower">in- och utcheckning</h2>
          <p>Incheckning från kl. 15.00. Utcheckning senast kl. 11.00. Meddela oss gärna om ni anländer sent på kvällen.</p>
          <h2 className="lower">frukost</h2>
          <p>I paketen ingår vår frukostkorg med lokala råvaror; utbudet varierar efter årstid. Vid större bokningar eller fullbelagt serveras frukosten i herrgården. Bokar du endast boende väljer du enkelt till frukost.</p>
          <h2 className="lower">husdjur</h2>
          <p>Hundar är varmt välkomna. Hundägaren ansvarar för sin hund under hela vistelsen. Läs våra <Link href="/hundar">riktlinjer för hundar</Link>.</p>
          <h2 className="lower">rökning, skador och force majeure</h2>
          <p>Rökning är inte tillåten inomhus. Gästen ansvarar för skador som uppstår genom oaktsamhet. Vid händelser utanför vår kontroll förbehåller vi oss rätten att avboka eller omboka vistelsen, med återbetalning eller ombokning som följd.</p>
          <h2 className="lower">kontakt</h2>
          <p><a href={site.phoneHref}>{site.phone}</a> · <a href={`mailto:${site.email}`}>{site.email}</a></p>
        </div>
      </section>
    </>
  );
}
