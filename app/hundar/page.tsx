import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Hero } from "@/components/Blocks";

export const metadata: Metadata = {
  title: "Hundvänligt boende i Västmanland — hundar välkomna i alla rum",
  description: "Hundvänlig herrgård i Surahammar, Västmanland. Hunden är välkommen i samtliga gästrum utan tillägg, och även vid fest och evenemang. Läs våra riktlinjer för en trivsam vistelse.",
  alternates: { canonical: "/hundar" },
};

export default function Hundar() {
  return (
    <>
      <Hero src="/bilder/hund.jpg" alt="Hund och barn i soffan på herrgården" sub label="Hunden följer med" title="hundar på westsura herrgård"
        lede="Hos oss är hundar varmt välkomna — i alla gästrum, utan tillägg, och gärna vid festen." />
      <section className="section section--tight">
        <div className="container split" style={{ alignItems: "start" }}>
          <div className="prose">
            <p>Vi vet att hunden för många är en självklar familjemedlem, och vi tycker om att även våra fyrbenta gäster ska känna sig hemma hos oss. Alla våra rum är hundvänliga, så du är välkommen att ta med din hund oavsett vilket rum du bokar. Ange gärna det i din bokning så att vi kan förbereda inför ert besök.</p>
            <p>Hos oss får hundar gärna hoppa upp i möblerna tillsammans med sina ägare. Vi uppskattar däremot om du hjälper oss att hålla dem rena genom att använda en filt eller handduk om hunden gärna ligger i säng eller soffa.</p>
            <h2 className="lower">för allas trivsel</h2>
            <p>För att både hundar, gäster och personal ska få en lugn och trivsam upplevelse uppskattar vi om din hund:</p>
            <ul>
              <li>är kopplad i våra gemensamma utrymmen,</li>
              <li>är rastad innan ni kommer in i restaurangen eller rummet,</li>
              <li>känner sig trygg i miljöer där det finns andra människor och hundar,</li>
              <li>är ren och torr när ni anländer.</li>
            </ul>
            <p>Alla gäster är inte vana vid eller bekväma med hundar. Därför uppskattar vi om hunden håller sig nära dig och inte söker kontakt med andra om inte båda parter önskar det.</p>
            <h2 className="lower">vid fest och evenemang</h2>
            <p>Hunden är välkommen även när vi firar. Känn efter om er hund trivs i sällskap med många människor inomhus, och hör av er i förväg så ordnar vi en lugn plats där den kan dra sig undan en stund.</p>
            <h2 className="lower">assistanshundar</h2>
            <p>Assistanshundar är alltid varmt välkomna hos oss.</p>
            <h2 className="lower">ansvar</h2>
            <p>Hundägaren ansvarar för sin hund under hela vistelsen och ersätter eventuella skador eller extra städkostnader. Om en hund blir mycket stressad eller upprepade gånger stör andra gäster hittar vi en lösning i dialog med hundägaren — i enstaka fall kan besöket behöva avslutas tidigare.</p>
          </div>
          <div>
            <div className="card" style={{ borderTopColor: "var(--accent)", marginBottom: 24 }}>
              <p className="label">Boka med hund</p>
              <h3>Alla rum, utan tillägg</h3>
              <p style={{ fontSize: 16 }}>Kryssa i <em>Vi har med hund</em> när du bokar, så står vattenskålen framme när ni kommer.</p>
              <Link className="btn btn--block" href="/boende#bokning">Se lediga rum</Link>
            </div>
            <div style={{ aspectRatio: "3 / 4", overflow: "hidden", position: "relative" }}>
              <Image src="/bilder/jakt.png" alt="Hund på Westsura Herrgårds marker" fill sizes="(max-width: 860px) 100vw, 50vw" style={{ objectFit: "cover" }} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
