import type { Metadata } from "next";
import Landing from "@/components/Landing";
import { img } from "@/lib/site";

export const metadata: Metadata = {
  title: "Bröllop på herrgård i Västmanland — Westsura Herrgård",
  description:
    "Gift er på Westsura Herrgård i Surahammar — bröllopslokal i Västmanland nära Västerås. Vigsel och fest i salongerna från 1760 eller i tält i trädgården, med sexton bäddar för gästerna.",
  alternates: { canonical: "/brollop" },
};

export default function Brollop() {
  return (
    <Landing
      hero={{ src: img.brud, alt: "Brudpar i trädgården på Westsura Herrgård", remote: true }}
      label="Bröllop"
      title="ert bröllop på westsura herrgård"
      lede="En romantisk och historisk inramning tre mil från Västerås, där ni kan skräddarsy dagen efter era önskemål."
      intro={
        <>
          <p>Drömmer ni om ett bröllop i en naturskön och historisk miljö? På Westsura Herrgård erbjuder vi en romantisk inramning där ni kan skapa en oförglömlig dag tillsammans med era nära och kära.</p>
          <p>Ni kan hålla bröllopsmiddagen i herrgården, med klassisk interiör och stämningsfull atmosfär under kristallkronorna — eller låta festen äga rum i ett vackert uppställt tält ute i vår lummiga trädgård, omgivna av naturens grönska.</p>
          <p>Vi hjälper er gärna med planering och praktiska detaljer, oavsett om ni vill ha ett mindre, intimt firande eller en större fest. Tillsammans skapar vi en dag fylld av glädje, kärlek och vackra ögonblick.</p>
        </>
      }
      facts={[
        { b: "1760", s: "Huvudbyggnaden" },
        { b: "16", s: "Bäddar för gästerna" },
        { b: "30 min", s: "Från Västerås" },
      ]}
      sections={[
        { h: "vigseln", body: <p>Vigsel i trädgården under sommarhalvåret, eller inomhus i salongen. Vi hjälper till med kontakten till vigselförrättare i Surahammar och kan ge förslag på fotografer och musiker som känner huset.</p> },
        { h: "middagen och festen", body: <p>Bröllopsmiddag i matsalen för upp till ett fyrtiotal gäster, eller i tält i trädgården för större sällskap. Maten lagas på säsongens råvaror från trakten — smakmeny och vinlista tas fram tillsammans med er.</p> },
        { h: "övernattningen", body: <p>Sexton bäddar i fyra flyglar och åtta rum. Brudparet får gärna den flygel de själva väljer, och resten av sällskapet bor bara några steg från festen. Frukostkorg dagen efter, levererad till dörren.</p> },
        { h: "hunden får vara med", body: <p>Hunden är välkommen på bröllopet och i rummen — utan tillägg. Säg till i förväg, så ordnar vi en lugn plats där den kan dra sig undan när festen kommer igång.</p> },
      ]}
      faq={[
        { q: "Hur många gäster får plats?", a: "I herrgårdens salonger ett fyrtiotal sittande gäster. I tält i trädgården betydligt fler — berätta hur många ni tänker er, så föreslår vi ett upplägg." },
        { q: "Kan vi ha vigseln på plats?", a: "Ja, både utomhus i trädgården och inomhus i salongen. Ni ordnar vigselförrättare, vi hjälper gärna till med kontakter." },
        { q: "Kan gästerna bo över?", a: "Ja, herrgården har sexton bäddar i fyra flyglar och åtta rum. Hela boendet kan bokas för sällskapet till ett fast pris per natt." },
        { q: "Vad kostar det?", a: "Varje bröllop planeras individuellt och priset beror på antal gäster, meny och lokal. Skicka en förfrågan så återkommer vi med ett förslag och en offert." },
        { q: "Är hundar välkomna?", a: "Ja, i alla rum och på festen. Assistanshundar är alltid välkomna." },
      ]}
      formTyp="Bröllop"
    />
  );
}
