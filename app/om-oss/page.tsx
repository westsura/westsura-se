import type { Metadata } from "next";
import Image from "next/image";
import { Hero, Ornament } from "@/components/Blocks";

export const metadata: Metadata = {
  title: "Om oss — herrgårdens historia från 1354 och vår vision",
  description:
    "Westsura Herrgård i Surahammar: säteri på 1600-talet, kungligt jaktbesök 1687, skogsinstitut, skola och sedan 2024 en levande herrgårdsdestination. Läs hela historien och visionen.",
  alternates: { canonical: "/om-oss" },
};

const epoker: { rubrik: string; under: string; stycken: string[] }[] = [
  {
    rubrik: "1600-talet",
    under: "Ursprung som säteri och tidiga brukspatroner",
    stycken: [
      "Westsura är en av de äldsta bosättningarna i Surahammar. Namnet finns noterat i ett fastebrev redan år 1354 och skrevs då ”Westsururm”. Herrgårdens tidigaste dokumenterade ägande dateras till 1655, då egendomen ingick i riksrådet och landshövdingen Bengt Skytte af Duderhofs säteri tillsammans med Hovgården. Skytte var en framträdande figur i svensk adel och administration under stormaktstiden.",
      "Runt 1680 övergick egendomen till brukspatronen Erik Christiersson (Christiernin), som var aktiv i regionens järnindustri. En minnesvärd händelse inträffade 1687 då kung Karl XI besökte Westsura under en jaktresa. Kungen noterade i sin almanacka en kort passage om måltiden, övernattningen och att han skjutit en björn under jakten.",
      "Christiersson expanderade verksamheten genom att anlägga ett tegelbruk 1690 invid gården.",
    ],
  },
  {
    rubrik: "1700-talet",
    under: "Familjeövergångar och nybyggnation",
    stycken: [
      "Efter Erik Christierssons död 1702 ärvdes egendomen av hans änka Agneta von Glan, som innehade den fram till 1721. Därefter tog brukspatronen Carl Wendelin över, följd av hans änka Magdalena Petré fram till 1749. Herrgården var på det annars fattiga 1700-talet en jämförelsevis stor jordbruksfastighet med ett 60-tal nötkreatur, varav tio oxar. Stengrunden efter den stora ladugården finns kvar ännu i dag.",
      "År 1749 köptes Westsura av brukspatronen och assessorn Jacob Jacobsson Tersmeden, en medlem av den inflytelserika adliga släkten Tersmeden. Jacob Tersmeden flyttade till Ramnäs 1756 men behöll ägandet. En betydande förändring skedde 1760 då han lät uppföra en ny huvudbyggnad i nyklassicistisk stil, vilket gav herrgården dess nuvarande utseende. Efter hans död 1767 övertogs Westsura av änkan Magdalena Elisabeth Söderhielm fram till hennes död 1787.",
    ],
  },
  {
    rubrik: "1800-talet",
    under: "Arvingar, skogsinstitut och industri",
    stycken: [
      "Från 1787 till 1842 ägdes Westsura av Magdalena Elisabeth Söderhielms arvingar, inledningsvis tio barn. Genom åren löstes andelar in, och kring 1800 kvarstod främst syskonen Hedvig Charlotta, Per Reinhold och Lars Gustaf Tersmeden. Lars Gustaf arrenderade herrgården 1794–1805. År 1804 blev Per Reinhold ensam ägare; han dog ogift och barnlös 1842.",
      "Arvet fördelades då bland 25 syskonbarn, med brukspatronen Wilhelm Fredrik Tersmeden och hans hustru Jacquette Elisabeth Tersmeden som huvudägare fram till 1872. Under denna period etablerade Brukssocieteten ett skogsinstitut på egendomen 1843, lett av den tyske skogsmannen Carl Ludvig Obbarius. Institutet utbildade i skogsbruk men flyttades till Nora 1855. Wilhelm Fredrik Tersmeden hyllades vid sin död 1879 med en utförlig dödsruna som underströk hans bidrag till regionens bruksnäring.",
      "Efter Jacquette Elisabeths död 1872 hanterades egendomen av hennes sterbhus fram till 1874, då Ramnäs Bruks AB tog över och innehade den till 1911.",
    ],
  },
  {
    rubrik: "Tidigt 1900-tal",
    under: "Snabbväxlande ägare och sociala konflikter",
    stycken: [
      "Från 1911 skedde flera snabba ägarbyten: Herman Andersson (1911–1912), notarien Gunnar Fritiof Johansson Cederfeldt (1912–1915) och godsägaren David André från 1915 till 1917. Köpeskillingen för Andrés förvärv var 150 000 kronor, inklusive inventarier och gröda.",
      "År 1917 övertog David Andrés son, agronomen Ragnar André, egendomen fram till 1930. Perioden präglades av en uppmärksammad lantarbetarstrejk i juli 1926, som varade till april 1927 och slutade i en seger för arbetarna. Tidningen Arbetaren var mycket kritisk mot André och uttryckte skadeglädje när han hamnade på obestånd 1930.",
      "Därefter ägdes Westsura av disponenten Julius Holmström fram till cirka 1937, följd av Gideon Bruhner och Augustinus Danielsson till 1949. Under denna tid verkade lantbruksinspektorn Harald Albinsson som förvaltare; hans hustru Ester var syster till ägarna.",
    ],
  },
  {
    rubrik: "Senare 1900-tal",
    under: "Statlig förvaltning, utbildning och brand",
    stycken: [
      "Skogsvårdsstyrelsen förvärvade egendomen 1949 och startade en skogsbruksskola. Verksamheten fortsatte under Västmanlands läns landsting från 1972 till 2001. Skolan blev en filial till Ösby naturbruksgymnasium i Sala och flyttades slutligen dit 1997.",
      "En dramatisk händelse inträffade i oktober 1998, då herrgården brann efter ett pyromandåd. Byggnaden renoverades och återuppbyggdes, och fungerade därefter som konferensanläggning.",
    ],
  },
  {
    rubrik: "2000-talet",
    under: "Moderna ägare och nya användningsområden",
    stycken: [
      "Från 2001 till 2006 ägdes Westsura av Matsvision AB, följt av Vikingaskeppet AB och Laborit II AB. Under denna tid drev Sven-Åke Larsson och Åsa Söderberg hotell- och restaurangverksamhet på herrgården. År 2006 tog Attendo Individ och Familj Resurs AB över fram till 2018. Från 2018 till 2024 ägdes herrgården av Anders Gollne och Fernando Ruiz, och sedan 2024 ägs Westsura av Björn Elmqvist.",
      "Herrgårdens ägarbyten speglar samhällsutvecklingen i Sverige — från adliga godsägare och brukspatroner till statliga institutioner och moderna företag.",
    ],
  },
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
          <p style={{ margin: "0 auto 20px" }}>Westsura Herrgård ska vara en levande plats som lockar både lokalbor och internationella gäster att uppleva det bästa av det svenska landskapet och kulturarvet. Här möts människor kring matbordet, i naturen, på jaktmarkerna, i handelsboden och under herrgårdens tak.</p>
          <p style={{ margin: "0 auto 20px" }}>Vi vill skapa en destination där historia och samtid lever sida vid sida. Där lokala råvaror, producenter och hantverkare får ta plats. Där måltider berättar om platsen, årstiderna och människorna bakom råvarorna. Där jakt och naturupplevelser förvaltar en flera hundra år gammal tradition och blir en naturlig del av helheten.</p>
          <p style={{ margin: "0 auto 20px" }}>Westsura Herrgård ska vara lika självklar för en söndagsutflykt som för konferensen, bröllopet, weekendvistelsen eller den exklusiva jaktupplevelsen. En plats med låg tröskel att besöka, men med en kvalitet och omtanke som gör att gästerna vill återvända.</p>
          <p style={{ margin: "0 auto", fontFamily: "var(--font-serif)", fontSize: 22, fontStyle: "italic", color: "var(--text-heading)" }}>En levande herrgård. En levande destination. En plats att längta tillbaka till.</p>
        </div>
      </section>

      <section className="section tint">
        <div className="container split">
          <div style={{ aspectRatio: "3 / 2", overflow: "hidden", position: "relative" }}>
            <Image src="/bilder/picknick.jpg" alt="Familj på picknickfilt framför herrgården" fill sizes="(max-width: 860px) 100vw, 50vw" style={{ objectFit: "cover", objectPosition: "50% 88%" }} />
          </div>
          <div>
            <p className="label">I dag</p>
            <h2 className="lower">en mötesplats året runt</h2>
            <p>Herrgården drivs med ambitionen att skapa en levande destination där både lokalbor och långväga gäster känner sig välkomna. En plats där historien får leva vidare samtidigt som nya minnen skapas.</p>
            <p style={{ marginBottom: 0 }}>Våra måltider bygger på omsorg, säsong och så lokala råvaror som möjligt — alltid med respekt för platsen och människorna bakom råvarorna.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{ maxWidth: 800, marginBottom: 56 }}>
            <p className="label">Historik</p>
            <h2 className="lower">historien om westsura herrgård</h2>
            <p className="lede">Herrgården har en rik historia som sträcker sig tillbaka till 1600-talet och har genom åren fungerat som säteri, bruksegendom, skogsinstitut, skola, asylboende och konferensanläggning.</p>
          </div>
          <div className="epoker">
            {epoker.map((e) => (
              <div key={e.rubrik} className="epok">
                <div className="epok__ar">
                  <b>{e.rubrik}</b>
                  <span>{e.under}</span>
                </div>
                <div className="epok__text prose">
                  {e.stycken.map((s, i) => <p key={i}>{s}</p>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
