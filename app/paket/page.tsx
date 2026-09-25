import type { Metadata } from "next";
import { Hero } from "@/components/Blocks";
import PaketBokning, { type PaketEnhet } from "@/components/PaketBokning";
import { img, site } from "@/lib/site";
import { supabasePublik } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Paket & erbjudanden — kanot, golf och matlagning över öppen eld",
  description:
    "Färdiga paket på Westsura Herrgård: kanotpaddling på Strömsholms kanal med övernattning, golfpaket med Surahammars GK, och matlagning över öppen eld. Herrgårdsboende i Västmanland.",
  alternates: { canonical: "/paket" },
};

const paket: { id: string; bild: string; alt: string; label: string; titel: string; pris: string; per: string; text: string[]; ingar: string[]; extra?: string }[] = [
  {
    id: "kanot-dag", bild: img.paketKanotDag, alt: "Kanot på Strömsholms kanal", label: "Kanot & Herrgård", titel: "dagsäventyret", pris: "1 249 kr", per: "per person",
    text: [
      "En dags paddling på Strömsholms kanal, med start och slut i Surahammar, och övernattning i flyglarna. Paddla ett varv på Östersjön och följ den slingrande kanalen med över 225 år gamla handgrävda slussar — goda chanser att se bäver, fågelliv och andra djur längs vägen.",
      "Ni paddlar i en stabil canadensare för två, lätt att hantera för både nybörjare och vana paddlare. Längs vägen finns rastplatser för picknickkorgen.",
    ],
    ingar: ["1 dags paddling i canadensare för två", "Övernattning i flygel med frukostkorg", "Picknickkorg med fika, kaffe, dryck och korv att grilla", "Paddlar, flytvästar och kanothjul"],
    extra: "Vill ni stanna en natt till? Den läggs till direkt i bokningen, till vanligt nattpris.",
  },
  {
    id: "kanot-kvall", bild: img.paketKanotKvall, alt: "Kvällspaddling på sjön", label: "Kanot & Herrgård", titel: "kvällsturen", pris: "1 010 kr", per: "per person",
    text: [
      "Låt kvällen börja på vattnet och avslutas i herrgårdens lugn. Tre timmars paddling på sjön och kanalen från Lakeside Adventures uthyrning vid Surahammars sluss, följt av en natt i någon av de historiska flyglarna.",
      "Paddla ett varv på Östersjön eller följ kanalen uppströms mot campingen och friluftsbadet. Lämna tillbaka kanoten, checka in, och sov gott i en flygel från 1683.",
    ],
    ingar: ["3 timmars paddling i canadensare för två", "Övernattning i flygel med frukostkorg", "Paddlar, flytvästar och kanothjul"],
  },
  {
    id: "glod", bild: img.eld, alt: "Eld och glöd på grillen", label: "Matlagning över öppen eld", titel: "från glöd till gourmet", pris: "1 695 kr", per: "per person · cirka 5 timmar",
    text: [
      "Vid eldstaden i den gamla ruinen möts ni av doften av ved, sprakande lågor och noggrant utvalda råvaror från skog och närliggande producenter. Ni guidas från hur man bygger en stabil glödbädd till tekniker för att lyfta fram smakerna i vilt, fisk och säsongens grönt.",
      "Ni arbetar i mindre grupper där varje moment blir en del av helheten — och avslutar med att samlas runt elden och äta det ni själva skapat. Rustikt, ärligt och oförglömligt. En aktivitet som stärker teamkänslan.",
    ],
    ingar: ["Välkomstdryck runt elden och introduktion", "Genomgång av råvaror med fokus på närodlat och vilt", "Praktisk matlagning i mindre grupper", "Gemensam middag utomhus, eller i herrgården vid väderomslag"],
    extra: "Priset gäller aktiviteten. Vill ni stanna över natten lägger ni till boende i flyglarna i samma bokning. Större grupper planerar vi gärna i dialog med er.",
  },
  {
    id: "golf", bild: img.paketGolf, alt: "Golfbanan på Surahammars GK", label: "Golfpaket", titel: "där spelglädje möter herrgårdsliv", pris: "1 295 kr", per: "per person",
    text: [
      "En natt i flygeln, frukostkorg levererad till dörren, greenfee och lunch på Surahammars Golfklubb — en trivsam 18-hålsbana med välskötta greener, nio minuter med bil från herrgården. Banan öppnar 20 april.",
      "Gör vistelsen ännu mer minnesvärd med en västmanländsk välkomstbricka som väntar på rummet vid ankomst — den väljer ni till i bokningen.",
    ],
    ingar: ["1 natt i flygel", "Frukostkorg med lokala råvaror", "1 greenfee, ankomst- eller avresedag", "1 lunch på Surahammars Golfklubb"],
    extra: "Inför bokning behöver vi deltagarnas Golf-ID och önskad starttid.",
  },
];

export const revalidate = 300;

export default async function Paket() {
  // Priser och om natten ingår hämtas från databasen, så att bokningen alltid räknar som sidan visar.
  let prislista: { id: string; namn: string; pris: number; ingar_natt: boolean }[] = [];
  let enheter: PaketEnhet[] = [];
  try {
    const db = supabasePublik();
    const [{ data: p }, { data: e }] = await Promise.all([
      db.from("paket").select("id, namn, pris, ingar_natt").eq("aktiv", true),
      db.from("enhet").select("id, namn, baddar, grundpris, ingar_i, ar_hela_boendet").eq("ar_hela_boendet", false).order("ordning"),
    ]);
    prislista = (p ?? []) as typeof prislista;
    enheter = (e ?? []) as PaketEnhet[];
  } catch (err) { console.error("Kunde inte hämta paket", err); }
  const kr = (n: number) => n.toLocaleString("sv-SE") + " kr";

  return (
    <>
      <Hero remote sub src={img.eld} alt="Eld och glöd vid eldstaden i ruinen" label="Paket & erbjudanden" title="upplevelser att längta till"
        lede="Färdiga paket som kombinerar herrgårdsboendet med naturen, maten och trakten runtomkring." />

      <section className="section">
        <div className="container">
          {paket.map((p) => {
            const db = prislista.find((x) => x.id === p.id);
            return (
            <article key={p.id} className="paket" id={p.id}>
              <div className="paket__img">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.bild} alt={p.alt} loading="lazy" />
              </div>
              <div className="paket__body">
                <p className="label">{p.label}</p>
                <h2 className="lower">{p.titel}</h2>
                <p className="price price--lg">{db ? kr(db.pris) : p.pris}<small>{p.per}</small></p>
                {p.text.map((t, i) => <p key={i}>{t}</p>)}
                <p className="label paket__ingar">I paketet ingår</p>
                <ul className="ticks">{p.ingar.map((i) => <li key={i}>{i}</li>)}</ul>
                {p.extra && <p className="muted">{p.extra}</p>}
                {db && enheter.length
                  ? <PaketBokning paket={{ id: p.id, namn: db.namn, pris: db.pris, ingarNatt: db.ingar_natt }} enheter={enheter} />
                  : <a className="btn" href={site.phoneHref}>Ring och boka {site.phone}</a>}
              </div>
            </article>
            );
          })}
          <div className="notice">
            <strong>Bra att veta.</strong> Fri avbokning upp till 7 dagar före ankomst. Betalning senast 7 dagar före ankomst. Incheckning från kl. 15.00. Bokningen är säkrad när ni fått vår bekräftelse.
          </div>
        </div>
      </section>
    </>
  );
}
