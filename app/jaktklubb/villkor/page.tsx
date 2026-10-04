import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/Blocks";
import { site } from "@/lib/site";
import { EKIPAGE_RABATT } from "@/lib/jakt";

export const metadata: Metadata = {
  title: "Villkor för jakt på Westsura",
  description: "Villkor för jaktlaget, gästjägare och hundekipage på Westsura Herrgård: medlemskap och provår, avbokning, inställd jakt, vilt och kött, hundar, eftersök och försäkring.",
  alternates: { canonical: "/jaktklubb/villkor" },
};

/** Villkoren man godkänner vid ansökan, anmälan och registrering av hundekipage. */
export default function JaktVillkor() {
  return (
    <>
      <PageHead label="Bra att veta" title="villkor för jakt" lede="Det här gäller för dig som jagar hos oss — som medlem i jaktlaget, gästjägare eller hundekipage. Hör av dig om något är oklart." />
      <section className="section--after-head">
        <div className="container prose">
          <h2 className="lower">jaktlaget</h2>
          <p>Vårt mål är ett blandat jaktlag med olika människor som fungerar väl tillsammans — där det är högt i tak och vi respekterar varandras önskemål.</p>
          <ul>
            <li><strong>Årskostnad 15 000 kr.</strong> Den täcker främst arrendet, men också uppbyggnad av åtlar och foderkostnader. Avgiften faktureras vid säsongsstart; säsongen följer jaktåret, 1 juli–30 juni.</li>
            <li><strong>Första året är ett provår</strong>, där vi känner efter från bägge håll att det fungerar bra. Hela årsavgiften betalas även under provåret.</li>
            <li><strong>Som permanent medlem</strong> bekostar och bygger du ett jakttorn, som tillfaller marken och laget gemensamt. Tornet står kvar om du lämnar laget.</li>
            <li>Säkerhetskursen online, giltigt jaktkort, ID-handling och älgskyttemärke ska vara klara och granskade före första jaktdagen — och förnyas varje jaktår.</li>
          </ul>

          <h2 className="lower">vak och pyrsch för medlemmar</h2>
          <p>Medlemmar kan anmäla vakjakt, framför allt på bäver och vildsvin, även på dagar som inte är utlagda. Anmälan görs i medlemsklubben och godkänns av herrgården, så att den inte stör annan planerad jakt och kan ske på ett säkert sätt.</p>

          <h2 className="lower">vilt och kött</h2>
          <ul>
            <li><strong>Älg:</strong> köttet delas mellan alla som deltagit på minst hälften av säsongens älgjakter.</li>
            <li><strong>Rådjur och vildsvin:</strong> det första djuret du fäller under hösten, och det första under våren, behåller du själv. Därefter går köttet i första hand till jaktlagets gemensamma middagar.</li>
            <li>Vill du inte ha ditt kött har Westsura Herrgård förtur att ta över eller köpa det.</li>
            <li>Gästjägare: hur viltet fördelas framgår av inbjudan till respektive jaktdag.</li>
          </ul>

          <h2 className="lower">vad som ingår</h2>
          <p>I jaktdagen ingår jakten, jaktledning och genomgång. Lunch, middag och boende betalas separat. Medlemmar och godkända hundekipage betalar medlemspris för maten.</p>

          <h2 className="lower">avbokning av boende, middag och annat du bokat</h2>
          <p>Gäller både medlemmar och gäster:</p>
          <ul>
            <li>Mer än 14 dagar före — kostnadsfri avbokning.</li>
            <li>14 dagar före eller senare — halva beloppet debiteras.</li>
            <li>5 dagar före eller senare — hela beloppet debiteras.</li>
          </ul>

          <h2 className="lower">om vi ställer in en jaktdag</h2>
          <p>Gäller gästjägare. Måste vi ställa in — på grund av väder, för få deltagare, myndighetsbeslut eller av säkerhetsskäl — får du välja mellan att få tillbaka det du betalat för jakten eller att flytta till en annan jaktdag. Boende och mat som bokats i samband med jakten kan avbokas kostnadsfritt.</p>

          <h2 className="lower">hundar</h2>
          <ul>
            <li>Hunden ska vara vaccinerad och försäkrad, och vara under förarens kontroll hela jaktdagen.</li>
            <li>Löptik meddelas i förväg.</li>
            <li>Föraren ansvarar för hunden och för skador den orsakar.</li>
            <li>Hundar är välkomna i boendet — läs våra <Link href="/hundar">riktlinjer för hundar</Link>.</li>
          </ul>

          <h2 className="lower">hundekipage</h2>
          <p>Hundförare och eftersöksekipage kan registrera sig kostnadsfritt. Herrgården godkänner ekipagen och hör av sig inför jakter där de behövs. Godkända ekipage får {EKIPAGE_RABATT}&nbsp;% rabatt på boendet för förare och hund, och medlemspris på maten. Hundförare behöver inte ha jägarexamen; eftersöksekipage ska ha det.</p>

          <h2 className="lower">eftersök</h2>
          <p>Allt skadeskjutet vilt ska eftersökas. Skytten markerar platsen och meddelar jaktledaren direkt, som kallar in eftersöksekipage. Ingen följer upp ett skadat djur på egen hand utan jaktledarens besked.</p>

          <h2 className="lower">försäkring</h2>
          <p>Westsura Herrgård har en ansvarsförsäkring som även täcker jaktverksamheten. Varje jägare ska dessutom ha en egen jaktförsäkring, till exempel genom medlemskap i Svenska Jägareförbundet eller Jägarnas Riksförbund.</p>

          <h2 className="lower">personuppgifter</h2>
          <p>Vi sparar de uppgifter som behövs för medlemskapet och jakten, däribland kopior av jaktkort, ID-handling och älgskyttemärke. Medlemmars handlingar sparas så länge medlemskapet gäller och raderas när medlemmen slutar. Konton för gästjägare och hundekipage som inte använts på två år tas bort. Fakturaunderlag sparas i sju år enligt bokföringslagen. Läs mer i vår <Link href="/integritetspolicy">integritetspolicy</Link>.</p>

          <h2 className="lower">kontakt</h2>
          <p><a href={site.phoneHref}>{site.phone}</a> · <a href={`mailto:${site.email}`}>{site.email}</a></p>
        </div>
      </section>
    </>
  );
}
