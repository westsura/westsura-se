import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/Blocks";

export const metadata: Metadata = {
  title: "Paket & erbjudanden — kanot, golf och matlagning över öppen eld",
  description:
    "Färdiga paket på Westsura Herrgård: kanotpaddling på Strömsholms kanal med övernattning, golfpaket med Surahammars GK, och matlagning över öppen eld. Herrgårdsboende i Västmanland.",
  alternates: { canonical: "/paket" },
};

const paket: { id: string; titel: string; pris: string; per: string; text: string; ingar: string[]; extra?: string }[] = [
  {
    id: "kanot-dag", titel: "Kanot & Herrgård — Dagsäventyret", pris: "1 249 kr", per: "per person",
    text: "En dags paddling på Strömsholms kanal, med start och slut i Surahammar, och övernattning i flyglarna. Paddla ett varv på Östersjön och följ den slingrande kanalen med över 225 år gamla handgrävda slussar — goda chanser att se bäver och fågelliv.",
    ingar: ["1 dags paddling i canadensare för två", "Övernattning i flygel med frukostkorg", "Picknickkorg med fika, kaffe, dryck och korv att grilla", "Paddlar, flytvästar och kanothjul"],
    extra: "Lägg till en natt extra för 590 kr per person.",
  },
  {
    id: "kanot-kvall", titel: "Kanot & Herrgård — Kvällsturen", pris: "1 010 kr", per: "per person",
    text: "Låt kvällen börja på vattnet och avslutas i herrgårdens lugn. Tre timmars paddling på sjön och kanalen från Lakeside Adventures uthyrning vid Surahammars sluss, följt av en natt i någon av de historiska flyglarna.",
    ingar: ["3 timmars paddling i canadensare för två", "Övernattning i flygel med frukostkorg", "Paddlar, flytvästar och kanothjul"],
  },
  {
    id: "glod", titel: "Från glöd till gourmet", pris: "1 695 kr", per: "per person · ca 5 timmar",
    text: "Matlagning över öppen eld vid eldstaden i den gamla ruinen. Ni guidas från hur man bygger en stabil glödbädd till tekniker för att lyfta fram smakerna i vilt, fisk och säsongens grönt — och avslutar med en gemensam middag runt elden.",
    ingar: ["Välkomstdryck runt elden och introduktion", "Genomgång av råvaror med fokus på närodlat och vilt", "Praktisk matlagning i mindre grupper", "Gemensam middag utomhus, eller i herrgården vid väderomslag"],
    extra: "Grupparrangemang planeras i dialog med er. Villkor skickas med offerten.",
  },
  {
    id: "golf", titel: "Golfpaket Surahammars GK", pris: "1 295 kr", per: "per person",
    text: "En natt i flygeln, frukostkorg levererad till dörren, greenfee och lunch på Surahammars Golfklubb — en trivsam 18-hålsbana nio minuter med bil från herrgården. Banan öppnar 20 april.",
    ingar: ["1 natt i flygel", "Frukostkorg med lokala råvaror", "1 greenfee, ankomst- eller avresedag", "1 lunch på Surahammars Golfklubb"],
    extra: "Inför bokning behöver vi deltagarnas Golf-ID och önskad starttid.",
  },
];

export default function Paket() {
  return (
    <>
      <PageHead label="Paket & erbjudanden" title="upplevelser att längta till" lede="Färdiga paket som kombinerar herrgårdsboendet med naturen, maten och trakten runtomkring. Bokas som boende, med paketet som tillval." />
      <section style={{ paddingBottom: 96 }}>
        <div className="container">
          <div className="grid grid-2" style={{ gap: 32 }}>
            {paket.map((p) => (
              <article key={p.id} className="card card--paket" id={p.id}>
                <h3>{p.titel}</h3>
                <p className="price">{p.pris}<small>{p.per}</small></p>
                <p style={{ fontSize: 16 }}>{p.text}</p>
                <p className="label" style={{ marginTop: 8, marginBottom: 8 }}>I paketet ingår</p>
                <ul className="ticks" style={{ fontSize: 15 }}>{p.ingar.map((i) => <li key={i} style={{ fontSize: 15.5 }}>{i}</li>)}</ul>
                {p.extra && <p style={{ fontSize: 15, color: "var(--ws-ink-40)" }}>{p.extra}</p>}
                <Link className="btn btn--ghost" href="/boende#bokning" style={{ alignSelf: "flex-start" }}>Boka med boende</Link>
              </article>
            ))}
          </div>
          <div className="notice" style={{ marginTop: 40 }}>
            <strong>Bra att veta.</strong> Fri avbokning upp till 7 dagar före ankomst. Betalning senast 7 dagar före ankomst. Incheckning från kl. 15.00. Bokningen är säkrad när ni fått vår bekräftelse.
          </div>
        </div>
      </section>
    </>
  );
}
