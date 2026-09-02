import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Hero, DogBand } from "@/components/Blocks";
import InquiryForm from "@/components/InquiryForm";
import { img } from "@/lib/site";

export const metadata: Metadata = {
  title: "Fira hos oss — bröllop, fest och sällskap i herrgårdsmiljö",
  description:
    "Bröllop, födelsedagar, föreningsluncher och minnesstunder på Westsura Herrgård i Surahammar, Västmanland. Salonger med historisk karaktär, tält i trädgården och sexton bäddar för övernattning.",
  alternates: { canonical: "/event" },
};

const typer: { href: string; titel: string; text: string; bild: string; remote?: boolean }[] = [
  { href: "/brollop", titel: "Bröllop", text: "Vigsel och fest i romantisk herrgårdsmiljö — i salongerna eller i tältet i trädgården.", bild: img.brud, remote: true },
  { href: "/fira", titel: "Fest & firande", text: "Födelsedagar, jubileum, släktträffar och föreningens lunch. Plats för gemenskap och skratt.", bild: "/bilder/fest.jpg" },
  { href: "/konferens", titel: "Evenemang & möten", text: "Föreläsningar, seminarier och nätverksträffar för företag, föreningar och organisationer.", bild: "/bilder/konferens.jpg" },
  { href: "/minnesstunder", titel: "Minnesstunder", text: "En stillsam samling efter begravningen, med omtanke om både helheten och de små detaljerna.", bild: "/bilder/matsal.jpg" },
];

export default function Event() {
  return (
    <>
      <Hero src="/bilder/event.jpg" alt="Dukad matsal med kristallkrona inför festen" sub label="Fira hos oss" title="bröllop, fest och sällskap"
        lede="Herrgården rymmer hela sällskapet — salongerna, trädgården, köket och sexton bäddar för den som vill stanna över natten." />

      <section className="section section--tight">
        <div className="container">
          <div className="grid grid-4">
            {typer.map((t) => (
              <Link key={t.href} className="cat" href={t.href}>
                <div className="cat__img" style={{ position: "relative" }}>
                  {t.remote ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.bild} alt={t.titel} loading="lazy" />
                  ) : (
                    <Image src={t.bild} alt={t.titel} fill sizes="(max-width: 980px) 50vw, 25vw" style={{ objectFit: "cover" }} />
                  )}
                </div>
                <h3>{t.titel}</h3>
                <p>{t.text}</p>
                <span className="link-more">Läs mer →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section band" id="forfragan">
        <div className="container split" style={{ alignItems: "start" }}>
          <div>
            <p className="label">Skicka en förfrågan</p>
            <h2 className="lower">berätta vad ni tänker er</h2>
            <p>Event bokas aldrig direkt på webben — varje arrangemang planeras i dialog med er. Fyll i det ni vet, så ringer vi upp och hittar upplägget tillsammans. Inget är bestämt förrän ni fått vår bekräftelse.</p>
            <p>Ni kan lika gärna ringa oss direkt. Det gör många, och det går ofta fortare.</p>
            <p className="pull">Här har det dukats för gäster sedan 1600-talet. Kungen fick middag och säng — ni får salongerna, trädgården och köket.</p>
          </div>
          <div><InquiryForm /></div>
        </div>
      </section>

      <DogBand />
    </>
  );
}
