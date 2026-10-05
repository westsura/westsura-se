import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/Blocks";
import KursBokning, { type Kurs } from "@/components/KursBokning";
import { supabasePublik } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Grundkurs i naturfoto med Anders Geidemark",
  description: "Naturfotokurs på Westsura Herrgård i Surahammar med naturfotografen Anders Geidemark: tre dagar med teori, fotoövningar och bildgenomgång. Två nätter, alla måltider och fika ingår.",
  alternates: { canonical: "/paket/naturfoto" },
  openGraph: {
    type: "website", locale: "sv_SE", siteName: "Westsura Herrgård", url: "/paket/naturfoto",
    title: "Grundkurs i naturfoto med Anders Geidemark — Westsura Herrgård",
    images: [{ url: "/bilder/naturfoto-lappuggla.jpg", width: 2000, height: 1331, alt: "Två lappugglor på en stubbe i kvällsljus" }],
  },
};

export const revalidate = 60;

const kr = (n: number) => n.toLocaleString("sv-SE") + " kr";

export default async function Naturfoto() {
  let kurs: Kurs | null = null;
  try {
    const db = supabasePublik();
    const { data } = await db.from("kurs").select("id, namn, datum_text, platser, oppen, pris_dubbel, pris_enkel, earlybird_dubbel, earlybird_enkel, earlybird_till").eq("id", "naturfoto").maybeSingle();
    if (data) {
      const { data: kvar } = await db.rpc("kurs_platser_kvar", { k: "naturfoto" });
      kurs = { ...(data as Omit<Kurs, "kvar">), kvar: typeof kvar === "number" ? kvar : data.platser };
    }
  } catch (e) { console.error("Kunde inte hämta kursen", e); }
  const ebDatum = kurs?.earlybird_till ? new Date(kurs.earlybird_till + "T12:00:00").toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" }) : null;
  const ebAktiv = !!kurs?.earlybird_till && new Date().toISOString().slice(0, 10) <= kurs.earlybird_till;

  return (
    <>
      <Hero src="/bilder/naturfoto-lappuggla.jpg" alt="Två lappugglor på en stubbe i kvällsljus, fotograferade av Anders Geidemark" sub
        label="Grundkurs i naturfoto" title="från fina bilder till fantastiska"
        lede="En inspirerande helg med naturfotografen och författaren Anders Geidemark." />

      <section className="section">
        <div className="container split split--start split--form">
          <div className="prose">
            <p className="label">{kurs?.datum_text ?? "En helg i maj 2027"} · Westsura Herrgård, Surahammar</p>
            <h2 className="lower">en helg fylld av foto, natur och inspiration</h2>
            <p>Välkommen till en inspirerande helg på Westsura Herrgård i Surahammar, där du får utveckla ditt naturfotograferande tillsammans med Anders Geidemark. Under tre dagar varvas teori med praktiska fotoövningar, bildvisningar och personlig bildgenomgång — i en miljö där naturen alltid finns nära.</p>
            <p>Oavsett om du precis har börjat fotografera eller vill utveckla ditt bildseende får du nya kunskaper, inspiration och möjlighet att upptäcka omgivningarna med kameran på ett nytt sätt. Du behöver inga förkunskaper och kan delta med systemkamera, annan digitalkamera eller mobiltelefon.</p>

            <p className="label paket__ingar">Det här ingår i kurshelgen</p>
            <ul className="ticks">
              <li><b>Naturfotokurs med Anders Geidemark</b> — teori, praktiska fotoövningar, gemensamma bildvisningar och personlig bildgenomgång.</li>
              <li><b>Två nätter på Westsura Herrgård</b> — fredag till söndag i herrgårdens historiska miljö.</li>
              <li><b>Fika under helgen</b> — välkomstfika på fredagen och fikapauser för samtal och nya intryck.</li>
              <li><b>Fikakorgar för fototurerna</b> — ta med fikat ut i naturen mellan fotopassen.</li>
              <li><b>Alla måltider</b> — middag fredag och lördag, frukost och lunch lördag och söndag.</li>
            </ul>

            <details className="faq">
              <summary>Läs mer om kursens innehåll</summary>
              <p>Under kursen får du lära dig mer om bildkomposition och hur du kan arbeta med ljus, motiv och perspektiv för att skapa bilder som berättar något. Genom teori, praktiska övningar och gemensamma bildgenomgångar får du prova nya idéer och utveckla ditt fotograferande.</p>
              <p>Vi fotograferar i Westsuras omgivningar och tar vara på det som naturen erbjuder i maj. Mellan fotopassen finns tid för samtal, inspiration och gemenskap med andra fotointresserade. En helg där du kan fokusera på fotograferingen, hämta inspiration och njuta av naturen och herrgårdsmiljön.</p>
            </details>
            <details className="faq">
              <summary>Läs mer om Anders Geidemark</summary>
              <p>Anders Geidemark har arbetat professionellt med fotografi sedan 1988 och är naturfotograf, författare, föreläsare och fotolärare. Han har gett ut fyra egna böcker och har under mer än 35 år varit domare i flera internationella naturfototävlingar, bland annat BBC Wildlife Photographer of the Year och European Wildlife Photographer of the Year.</p>
              <p>Han har lett naturfotoresor runt om i världen och föreläst på fotoskolor i Norden. Anders var med och startade tidskriften Camera Natura och har varit svensk redaktör för Natur&amp;Foto. Sedan 2024 arrangerar han Naturfotofestivalen i Surahammar.</p>
            </details>
            <details className="faq">
              <summary>Bokningsvillkor</summary>
              <p>Bokningen är bindande och betalning sker i samband med bokning, mot faktura. Om du får förhinder går det bra att överlåta din plats till någon annan utan extra kostnad — meddela Westsura Herrgård namn och kontaktuppgifter till den som tar över platsen.</p>
              <p>Westsura Herrgård förbehåller sig rätten att ställa in kursen om det inte blir tillräckligt många deltagare. Vid inställd kurs återbetalas hela det inbetalda beloppet.</p>
            </details>
          </div>

          <div className="card card--accent">
            <p className="label">Pris och bokning</p>
            {kurs && (
              <>
                <table className="admin__table" style={{ marginBottom: 12 }}>
                  <thead><tr><th></th><th className="num">Delat dubbelrum</th><th className="num">Enkelrum</th></tr></thead>
                  <tbody>
                    {kurs.earlybird_dubbel != null && kurs.earlybird_till && (
                      <tr style={ebAktiv ? undefined : { opacity: 0.5 }}>
                        <td><b>Early Bird</b><br /><small>bokning senast {ebDatum}</small></td>
                        <td className="num">{kr(kurs.earlybird_dubbel)}</td>
                        <td className="num">{kr(kurs.earlybird_enkel ?? kurs.pris_enkel)}</td>
                      </tr>
                    )}
                    <tr><td><b>Ordinarie pris</b></td><td className="num">{kr(kurs.pris_dubbel)}</td><td className="num">{kr(kurs.pris_enkel)}</td></tr>
                  </tbody>
                </table>
                <p className="small">Pris per person. Begränsat antal platser.</p>
                <KursBokning kurs={kurs} />
              </>
            )}
            {!kurs && <p>Bokningen öppnar snart. Ring 0220-312 30 så berättar vi mer.</p>}
          </div>
        </div>
      </section>

      <section className="section section--tight tint">
        <div className="container center">
          <p className="lede mb-0">Boka din plats och följ med på resan från fina bilder till fantastiska! <Link href="/paket">Se alla paket →</Link></p>
        </div>
      </section>
    </>
  );
}
