import type { Metadata } from "next";
import Image from "next/image";
import { Hero, Kung, Ornament } from "@/components/Blocks";

export const metadata: Metadata = {
  title: "Om oss — herrgårdens historia från 1354 och vår vision",
  description:
    "Westsura Herrgård i Surahammar: säteri på 1600-talet, kungligt jaktbesök 1687, skogsinstitut, skola och sedan 2024 en levande herrgårdsdestination. Läs historien och visionen.",
  alternates: { canonical: "/om-oss" },
};

const tid = [
  ["1354", "Westsura nämns i ett fastebrev, då skrivet ”Westsururm”. En av de äldsta bosättningarna i Surahammar."],
  ["1655", "Egendomen ingår i riksrådet och landshövdingen Bengt Skytte af Duderhofs säteri."],
  ["1680", "Brukspatronen Erik Christiersson (Christiernin), aktiv i traktens järnindustri, tar över. Tegelbruk anläggs 1690."],
  ["1687", "Kung Karl XI övernattar på jaktresa och antecknar i sin almanacka att han skjutit en björn."],
  ["1749", "Jacob Tersmeden köper Westsura. Den nya huvudbyggnaden i nyklassicistisk stil uppförs 1760 och ger herrgården dess nuvarande utseende."],
  ["1843", "Brukssocieteten etablerar ett skogsinstitut på egendomen under tyske skogsmannen Carl Ludvig Obbarius."],
  ["1926", "Lantarbetarstrejken på Westsura varar från juli till april året därpå och slutar i seger för arbetarna."],
  ["1949", "Skogsvårdsstyrelsen startar en skogsbruksskola. Landstinget driver skolan vidare 1972–2001."],
  ["1998", "Herrgården brinner efter ett pyromandåd, renoveras och återuppbyggs som konferensanläggning."],
  ["2024", "Björn Elmqvist tar över Westsura med ambitionen att skapa en levande herrgårdsdestination."],
];

export default function OmOss() {
  return (
    <>
      <Hero src="/bilder/herrgarden.jpg" alt="Westsura Herrgård med gul fasad sedd från trädgården" sub label="Om oss" title="den levande herrgården"
        lede="Säteri, bruksegendom, skogsinstitut, skola, konferensanläggning — och i dag en plats där historia och samtid lever sida vid sida." />

      <section className="section section--tight">
        <div className="container" style={{ maxWidth: 800, textAlign: "center" }}>
          <Ornament />
          <p className="label">Vår vision</p>
          <h2 className="lower">att bli sveriges mest levande herrgårdsdestination</h2>
          <p className="lede" style={{ margin: "0 auto 20px" }}>Där historia, jakt, lokal mat och dryck, hantverk och natur möts i genuina upplevelser året runt.</p>
          <p style={{ margin: "0 auto 20px" }}>Westsura Herrgård ska vara lika självklar för en söndagsutflykt som för konferensen, bröllopet, weekendvistelsen eller den exklusiva jaktupplevelsen. En plats med låg tröskel att besöka, men med en kvalitet och omtanke som gör att gästerna vill återvända.</p>
          <p style={{ margin: "0 auto", fontFamily: "var(--font-serif)", fontSize: 22, fontStyle: "italic", color: "var(--text-heading)" }}>En levande herrgård. En levande destination. En plats att längta tillbaka till.</p>
        </div>
      </section>

      <Kung />

      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          <p className="label">Historik</p>
          <h2 className="lower" style={{ marginBottom: 40 }}>sju sekler på samma plats</h2>
          <div>
            {tid.map(([ar, text]) => (
              <div key={ar} style={{ display: "grid", gridTemplateColumns: "96px 1fr", gap: 24, padding: "18px 0", borderTop: "1px solid var(--border-subtle)" }}>
                <b style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--accent-strong)", fontVariantNumeric: "tabular-nums" }}>{ar}</b>
                <p style={{ margin: 0 }}>{text}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 32, fontSize: 15, color: "var(--ws-ink-40)" }}>Herrgårdens ägarbyten speglar samhällsutvecklingen i Sverige — från adliga godsägare och brukspatroner till statliga institutioner och moderna företag.</p>
        </div>
      </section>

      <section className="section tint">
        <div className="container split">
          <div style={{ aspectRatio: "4 / 3", overflow: "hidden", position: "relative" }}>
            <Image src="/bilder/picknick.jpg" alt="Familj på picknickfilt framför herrgården" fill sizes="(max-width: 860px) 100vw, 50vw" style={{ objectFit: "cover" }} />
          </div>
          <div>
            <p className="label">I dag</p>
            <h2 className="lower">en mötesplats året runt</h2>
            <p>Herrgården drivs med ambitionen att skapa en levande destination där både lokalbor och långväga gäster känner sig välkomna. Här möts människor kring matbordet, i naturen, på jaktmarkerna och under herrgårdens tak.</p>
            <p style={{ marginBottom: 0 }}>Våra måltider bygger på omsorg, säsong och så lokala råvaror som möjligt — alltid med respekt för platsen och människorna bakom råvarorna.</p>
          </div>
        </div>
      </section>
    </>
  );
}
