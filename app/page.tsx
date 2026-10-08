import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import SearchBar from "@/components/SearchBar";
import Signup from "@/components/Signup";
import Galleri from "@/components/Galleri";
import { Hero, Kung, DogBand, CtaRow, Ornament } from "@/components/Blocks";
import { img } from "@/lib/site";
import { kommandeEvenemang, langtDatum } from "@/lib/aktuellt";

export const metadata: Metadata = { alternates: { canonical: "/" } };
export const revalidate = 300;

export default async function Home() {
  const [forsta, ...fler] = await kommandeEvenemang();
  return (
    <>
      <Hero
        remote
        src={img.heroMatsal}
        alt="Dukat bord under kristallkronan i herrgårdens matsal"
        label="Anno 1680 · Surahammar, Västmanland"
        title="westsura herrgård"
        lede="Boende, fest, konferens och jakt i en levande herrgårdsmiljö. Hunden är välkommen i alla rum."
      />

      <section className="search-overlap">
        <div className="container"><SearchBar /></div>
      </section>

      <Kung />

      {/* AKTUELLT */}
      <section className="section" id="aktuellt">
        <div className="container">
          {/* Evenemang läggs in under Tillfällen i admin. Närmaste visas stort, resten som kort. */}
          <div className="split split--space">
            {forsta ? (
              <div>
                <p className="label">Aktuellt · {langtDatum(forsta.datum)}{forsta.tid ? ` · ${forsta.tid}` : ""}</p>
                <h2 className="lower">{forsta.titel.toLowerCase()}</h2>
                {forsta.ingress && <p>{forsta.ingress}</p>}
                {/* Början av brödtexten — de två första styckena, kortade om de är långa. */}
                {(forsta.beskrivning ?? "").split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean).slice(0, 2).map((p, i) => (
                  <p key={i}>{p.length > 420 ? p.slice(0, p.lastIndexOf(" ", 400)) + " …" : p}</p>
                ))}
                <p className="mb-0"><Link className="link-more" href={`/aktuellt/${forsta.slug}`}>{forsta.anmalan ? "Läs mer och anmäl dig →" : "Läs mer →"}</Link></p>
              </div>
            ) : (
              <div>
                <p className="label">Aktuellt</p>
                <h2 className="lower">marknader, temakvällar och höstdagar</h2>
                <p>Under året öppnar vi herrgården för marknadsdagar, temakvällar och evenemang med lokala producenter och hantverkare. Nästa datum läggs upp här så snart det är satt.</p>
                <p className="mb-0"><a className="link-more" href="#vanner">Bli Westsuras Vän och få inbjudan först →</a></p>
              </div>
            )}
            <div className="fig fig--43">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={forsta?.bild ?? "/bilder/julmarknad-fasad.jpg"} alt={forsta?.bild_alt ?? "Marknadsstånd med lokala varor vid herrgårdens gula fasad"} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          </div>
          {!!fler.length && (
            <div className="grid grid-3" style={{ margin: "40px 0" }}>
              {fler.map((e) => (
                <Link key={e.id} className="cat" href={`/aktuellt/${e.slug}`}>
                  <div className="cat__img fig">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={e.bild ?? "/bilder/julmarknad-1.jpg"} alt={e.bild_alt ?? e.titel} loading="lazy" />
                  </div>
                  <p className="label" style={{ marginTop: 14 }}>{langtDatum(e.datum)}</p>
                  <h3>{e.titel}</h3>
                  {e.ingress && <p>{e.ingress}</p>}
                  <span className="link-more">{e.anmalan ? "Läs mer och anmäl dig →" : "Läs mer →"}</span>
                </Link>
              ))}
            </div>
          )}
          <Galleri teman={[
            { rubrik: "Marknadsdagar", bilder: [
              { src: "/bilder/julmarknad-1.jpg", alt: "Besökare på marknaden med herrgården i bakgrunden" },
              { src: "/bilder/julmarknad-fasad.jpg", alt: "Marknadsstånd vid herrgårdens gula fasad" },
              { src: "/bilder/julmarknad-2.jpg", alt: "Från marknadsdagarna på Westsura Herrgård" },
              { src: "/bilder/julmarknad-3.jpg", alt: "Från marknadsdagarna på Westsura Herrgård" },
            ] },
            { rubrik: "Salongerna", bilder: [
              { src: "/bilder/matsal.jpg", alt: "Matsalen med gustavianska stolar och fönster mot gården" },
              { src: "/bilder/event.jpg", alt: "Dukat bord under kristallkronan, sett genom en dörröppning" },
              { src: "/bilder/konferens.jpg", alt: "Konferensbordet under kristallkronan i salongen" },
            ] },
            { rubrik: "Råvaror i säsong", bilder: [
              { src: "/bilder/ravaror.jpg", alt: "Färska örter hackas i köket" },
              { src: "/bilder/skafferi.jpg", alt: "Från herrgårdens skafferi" },
              { src: "/bilder/lingon.jpg", alt: "Lingon från markerna runt herrgården" },
            ] },
            { rubrik: "Långa samtal", bilder: [
              { src: "/bilder/gaster.jpg", alt: "Gäster i samtal vid bordet i salongen" },
              { src: "/bilder/gast-buffe.jpg", alt: "En gäst tar mat från buffén i salongen" },
              { src: "/bilder/herrgarden.jpg", alt: "Picknick på gräsmattan framför herrgården" },
            ] },
          ]} />
        </div>
      </section>

      {/* FYRA KATEGORIER */}
      <section className="section tint" id="upplev">
        <div className="container">
          <p className="label">Året runt</p>
          <h2 className="lower h2--space">fyra sätt att uppleva herrgården</h2>
          <div className="grid grid-4">
            <Link className="cat" href="/boende">
              <div className="cat__img fig">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.sang} alt="Bäddad säng i en av flyglarna på Westsura Herrgård" loading="lazy" />
              </div>
              <h3>Boende</h3>
              <p>Övernatta i flyglarna från 1683 — spröjsade fönster, djupa nischer, ro. Och hunden får följa med.</p>
              <span className="link-more">Se lediga rum →</span>
            </Link>
            <Link className="cat" href="/konferens">
              <div className="cat__img fig">
                <Image src="/bilder/konferens.jpg" alt="Konferensbordet under kristallkronan i herrgårdens salong" fill sizes="(max-width: 980px) 50vw, 25vw" />
              </div>
              <h3>Konferens</h3>
              <p>Dagskonferens för upp till 25 personer, med lunch och fika på säsongens råvaror. 700 kr per person.</p>
              <span className="link-more">Boka konferens →</span>
            </Link>
            <Link className="cat" href="/event">
              <div className="cat__img fig">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.skal} alt="Två glas som skålar vid bordet på Westsura Herrgård" loading="lazy" />
              </div>
              <h3>Event</h3>
              <p>Bröllop, födelsedagar, föreningsluncher och minnesstunder i salongerna eller trädgårdens tält.</p>
              <span className="link-more">Skicka förfrågan →</span>
            </Link>
            <Link className="cat" href="/jakt">
              <div className="cat__img fig">
                <Image src="/bilder/jakt.png" alt="Jakthund på Westsura Herrgårds marker" fill sizes="(max-width: 980px) 50vw, 25vw" />
              </div>
              <h3>Jakt</h3>
              <p>Jakt och jakthundsträning i viltrika marker, där kungen sköt sin björn 1687.</p>
              <span className="link-more">Läs om jakten →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* PAKET */}
      <section className="section" id="paket">
        <div className="container split">
          <div className="fig fig--43">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.eld} alt="Mat som lagas över öppen eld vid herrgården" loading="lazy" />
          </div>
          <div>
            <p className="label">Paket & erbjudanden</p>
            <h2 className="lower">upplevelser att längta till</h2>
            <p>Paddla Strömsholms kanal en dag eller en kväll, spela golf på Surahammars GK, eller laga mat över öppen eld i den gamla ruinen. Färdiga paket som kombinerar herrgårdsboendet med naturen, maten och trakten runtomkring.</p>
            <p>Boka paketet direkt — och stanna gärna en natt till.</p>
            <CtaRow primaryHref="/paket" primaryLabel="Se paketen" />
          </div>
        </div>
      </section>

      <DogBand />

      {/* WESTSURAS VÄNNER */}
      <section className="section tint" id="vanner">
        <div className="container narrow center">
          <Ornament />
          <p className="label">Westsuras Vänner</p>
          <h2 className="lower">nyheter från herrgården</h2>
          <p className="mx-auto">Nyhetsbrev med säsongens meny och kommande evenemang, förhandsinbjudan till höstdagar och temakvällar, och rabatt på herrgårdens egna arrangemang. Kostnadsfritt, och utan konto — bara din e-postadress.</p>
          <Signup />
        </div>
      </section>
    </>
  );
}
