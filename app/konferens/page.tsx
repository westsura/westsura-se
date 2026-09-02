import type { Metadata } from "next";
import Landing from "@/components/Landing";

export const metadata: Metadata = {
  title: "Konferens på herrgård i Västmanland — dagskonferens 700 kr/person",
  description:
    "Boka dagskonferens på Westsura Herrgård i Surahammar, tre mil från Västerås. Konferenslokal för upp till 25 personer, förmiddagsfika, lunch och eftermiddagsfika på lokala råvaror. 700 kr per person exkl. moms.",
  alternates: { canonical: "/konferens" },
};

export default function Konferens() {
  return (
    <Landing
      hero={{ src: "/bilder/konferens.jpg", alt: "Konferensbordet under kristallkronan i herrgårdens salong" }}
      label="Konferens"
      title="boka ert nästa möte hos oss"
      lede="Historisk charm, modern mötesteknik och personlig service — i en lugn miljö som gör det lätt att tänka nytt."
      intro={
        <>
          <p>När ni anländer till Westsura Herrgård välkomnas ni personligen i entrén. Här blir ni omhändertagna från första stund, i en lugn och exklusiv herrgårdsmiljö som skapar de bästa förutsättningarna för fokuserade och givande möten.</p>
          <p>Maten är en självklar höjdpunkt. Med säsongsbaserade råvaror, lokal förankring och stor passion skapar vi smakupplevelser som lyfter konferensen och ger ny energi under dagen.</p>
          <p>Efter mötet väntar biblioteket med chesterfieldsofforna, trädgården och — om ni vill — middag och övernattning i flyglarna.</p>
        </>
      }
      facts={[
        { b: "700 kr", s: "Per person, exkl. moms" },
        { b: "25", s: "Personer som mest" },
        { b: "30 min", s: "Från Västerås" },
      ]}
      sections={[
        { h: "i dagskonferensen ingår", body: (
          <ul>
            <li>Konferenslokal med full mötesutrustning</li>
            <li>Förmiddagsfika och eftermiddagsfika</li>
            <li>Lunch på säsongens råvaror</li>
            <li>Vatten, frukt och godis under dagen</li>
            <li>Pennor och block</li>
          </ul>
        ) },
        { h: "gör mer av dagen", body: <p>Lägg till middag i matsalen, matlagning över öppen eld i ruinen, en kanottur på Strömsholms kanal eller jakthundsträning på markerna. Stanna över natten — herrgården har sexton bäddar — och fortsätt dag två utvilade.</p> },
        { h: "för föreningar och nätverk", body: <p>Föreläsningar, seminarier, workshops och nätverksträffar. Lokalerna passar både mindre grupper och större sällskap, från halvdag till heldagsprogram med pauser, måltider och aktiviteter.</p> },
        { h: "hitta hit", body: <p>Lisjövägen 50 i Surahammar. Trettio minuter från Västerås, drygt en och en halv timme från Stockholm. Gott om parkering vid huset.</p> },
      ]}
      faq={[
        { q: "Vad kostar en dagskonferens?", a: "700 kr per person exklusive moms, upp till 25 personer. Lokal, fika förmiddag och eftermiddag, lunch, frukt och mötesutrustning ingår." },
        { q: "Kan vi övernatta?", a: "Ja, herrgården har sexton bäddar i fyra flyglar och åtta rum. Flera dagars konferens med middag och övernattning sätter vi ihop efter era önskemål." },
        { q: "Finns det wifi och projektor?", a: "Ja, gratis wifi och full mötesutrustning ingår." },
        { q: "Hur bokar vi?", a: "Skicka en förfrågan med datum och antal personer, eller ring 0220-312 30. Vi bekräftar inom en vardag." },
      ]}
      formTyp="Konferens"
      formAlternativ={["Dagskonferens", "Konferens med övernattning", "Föreläsning eller seminarium", "Kick off", "Annat möte"]}
      dog={false}
    />
  );
}
