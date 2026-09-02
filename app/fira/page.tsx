import type { Metadata } from "next";
import Landing from "@/components/Landing";

export const metadata: Metadata = {
  title: "Fira födelsedag, jubileum eller föreningens lunch på herrgård",
  description:
    "Fira hos oss på Westsura Herrgård i Surahammar: födelsedagar, jubileum, släktträffar och luncher för föreningar och sällskap. Lokal med plats för gemenskap i Västmanland, tre mil från Västerås.",
  alternates: { canonical: "/fira" },
};

export default function Fira() {
  return (
    <Landing
      hero={{ src: "/bilder/gast-buffe.jpg", alt: "Gäst som tar för sig vid buffén under kristallkronan" }}
      label="Fest & firande"
      title="fira livets stunder hos oss"
      lede="Födelsedagen, jubileet, släktträffen — eller föreningens lunch. En stämningsfull och flexibel miljö för ert firande."
      intro={
        <>
          <p>Ni väljer själva hur ni vill att er tillställning ska ta form: en middag i salonger med historisk karaktär och personlig känsla, eller en livfull fest i ett uppdukat tält ute i trädgården. Här finns plats för både privata firanden, föreningsträffar och företagsevenemang.</p>
          <p>Vi hjälper gärna till att planera upplägget utifrån era behov — mat, dukning, underhållning. Oavsett om ni är en förening, ett företag eller en familj finns utrymme för både små och stora arrangemang.</p>
          <p><strong>För föreningar och sällskap:</strong> lunch eller middag i matsalen för tio till fyrtio personer, med kaffe och kaka efteråt i salongen. Lätt att hitta, gott om parkering, och inga trappor till matsalen. Ring oss så pratar vi igenom det.</p>
        </>
      }
      facts={[
        { b: "10–40", s: "Gäster i matsalen" },
        { b: "Fler", s: "I tält i trädgården" },
        { b: "16", s: "Bäddar för övernattning" },
      ]}
      sections={[
        { h: "födelsedag och jubileum", body: <p>Femtio, sjuttio eller åttio — de runda åren förtjänar ett rum med kristallkrona. Middag i matsalen, kaffe i salongen, och för den som vill: övernattning i flyglarna så att ingen behöver köra hem.</p> },
        { h: "lunch för föreningen", body: <p>Pensionärsföreningen, hembygdsföreningen, styrelsen eller kören. Vi dukar för sällskapet i matsalen, lagar mat på traktens råvaror och tar hand om kaffet. Det enda ni behöver göra är att komma.</p> },
        { h: "släktträffen", body: <p>Hela släkten under ett tak — och i fyra flyglar. Boka hela boendet till ett pris, laga frukost i gemensamhetsköket och ha herrgårdsmiljön för er själva en helg.</p> },
        { h: "företaget", body: <p>Kick off, julbord eller middagen efter konferensen. Salongerna rymmer sällskapet, och biblioteket med chesterfieldsofforna är gjort för det som sägs efter maten.</p> },
      ]}
      faq={[
        { q: "Hur bokar vi?", a: "Skicka en förfrågan eller ring 0220-312 30. Vi återkommer inom en vardag med ett förslag. Bokningen är bindande först när ni fått vår bekräftelse." },
        { q: "Kan vi komma bara på lunch?", a: "Ja. Föreningar och sällskap är välkomna på lunch eller middag utan att boka något annat. Berätta hur många ni är och ungefär när." },
        { q: "Finns det trappor?", a: "Matsalen och salongerna ligger på entréplan. Säg till i förväg om någon i sällskapet behöver hjälp, så ordnar vi det." },
        { q: "Får vi ta med egen tårta?", a: "Ja, det går utmärkt. Vi ordnar kaffe och dukar upp." },
        { q: "Är hundar välkomna?", a: "Ja, både i rummen och på festen. Känn efter om er hund trivs med många människor inomhus — vi ordnar en lugn plats om det behövs." },
      ]}
      formTyp="Firande"
      formAlternativ={["Födelsedag eller jubileum", "Lunch eller middag för förening", "Släktträff", "Företagsevent eller kick off", "Annat firande"]}
    />
  );
}
