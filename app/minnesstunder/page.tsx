import type { Metadata } from "next";
import Landing from "@/components/Landing";

export const metadata: Metadata = {
  title: "Minnesstund i lugn herrgårdsmiljö — Surahammar, Västmanland",
  description:
    "Boka minnesstund efter begravningen på Westsura Herrgård i Surahammar. Stillsamma salonger, kaffe och lättare måltid, omtanke om detaljerna. Lokal för minnesstund i Västmanland.",
  alternates: { canonical: "/minnesstunder" },
};

export default function Minnesstunder() {
  return (
    <Landing
      hero={{ src: "/bilder/matsal.jpg", alt: "Matsalen med gustavianska stolar och fönster mot gården" }}
      label="Minnesstunder"
      title="avsked i lugn och vacker miljö"
      lede="Herrgårdens stämningsfulla salonger passar för att samlas efter en begravning — i en omgivning som bjuder in till eftertanke, gemenskap och minnen."
      intro={
        <>
          <p>Vi hjälper er gärna att skapa en personlig stund som speglar era önskemål, med omtanke om både helheten och de små detaljerna. Här finns möjlighet till servering av kaffe, te, smörgåsar eller en lättare måltid, och vi anpassar upplägget efter era behov.</p>
          <p>Hos oss får ni en trygg och stillsam plats att samlas i — med respekt för det som varit och omsorg för er som deltar.</p>
          <p>Det enklaste är att ringa. Vi vet att det är mycket att ordna, och vi tar hand om det praktiska så att ni slipper.</p>
        </>
      }
      facts={[
        { b: "10–40", s: "Gäster i salongerna" },
        { b: "Entréplan", s: "Inga trappor" },
        { b: "1 vardag", s: "Svar på förfrågan" },
      ]}
      sections={[
        { h: "serveringen", body: <p>Kaffe, te och smörgåsar, eller en lättare måltid — soppa, paj, sallad. Vi föreslår något som passar sällskapet och årstiden. Egen kaka går bra att ta med.</p> },
        { h: "lokalen", body: <p>Salongerna på entréplan, med dagsljus från trädgårdssidan. Plats för minnesbord med fotografier och blommor. Vi dukar och tar hand om allt före och efter.</p> },
        { h: "för dem som rest långt", body: <p>Anhöriga som kommer långväga kan övernatta i flyglarna. Säg till, så håller vi rum lediga.</p> },
      ]}
      faq={[
        { q: "Hur nära begravningen kan vi boka?", a: "Ofta med kort varsel. Ring oss så ser vi vad som går — vi gör vad vi kan för att det ska lösa sig." },
        { q: "Kan begravningsbyrån sköta kontakten?", a: "Ja, det är vanligt. Be byrån ringa 0220-312 30 eller mejla boka@westsura.se." },
        { q: "Vad kostar en minnesstund?", a: "Priset beror på antal gäster och vad som serveras. Ni får ett tydligt förslag innan något bestäms." },
        { q: "Är lokalen tillgänglig för rullstol?", a: "Salongerna ligger på entréplan. Berätta om någon behöver hjälp, så förbereder vi." },
      ]}
      formTyp="Minnesstund"
      formAlternativ={["Minnesstund"]}
      dog={false}
    />
  );
}
