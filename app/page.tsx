import Link from "next/link";
import Image from "next/image";
import SearchBar from "@/components/SearchBar";
import Signup from "@/components/Signup";
import { Hero, Kung, DogBand, CtaRow, Ornament } from "@/components/Blocks";
import { img } from "@/lib/site";

export default function Home() {
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

      <section style={{ marginTop: -46, position: "relative", zIndex: 10 }}>
        <div className="container"><SearchBar /></div>
      </section>

      <Kung />

      {/* AKTUELLT */}
      <section className="section" id="aktuellt">
        <div className="container">
          <div className="split" style={{ marginBottom: 64 }}>
            <div>
              <p className="label">Aktuellt</p>
              <h2 className="lower">westsura höstdag 2026</h2>
              <p><strong>Lördag den 26 september kl. 10.00–16.00</strong> öppnar vi upp herrgården för en dag fylld av höststämning, god mat, hantverk och aktiviteter, i samband med konst-, mat- och hantverksrundan MERSMAK.</p>
              <p>Café i herrgården, mat från grillen, lokala utställare och öppen keramikverkstad hos Bodaskeramik. Ta med familj och vänner.</p>
              <p style={{ marginBottom: 0 }}><Link className="link-more" href="/hostdag">Läs mer om höstdagen →</Link></p>
            </div>
            <div style={{ aspectRatio: "4 / 3", overflow: "hidden", position: "relative" }}>
              <Image src="/bilder/julmarknad-fasad.jpg" alt="Marknadsstånd med lokala varor vid herrgårdens gula fasad" fill sizes="(max-width: 860px) 100vw, 50vw" style={{ objectFit: "cover" }} />
            </div>
          </div>
          <div className="gallery">
            {[
              ["julmarknad-1.jpg", "Marknadsdagarna", "Besökare på marknaden med herrgården i bakgrunden"],
              ["matsal.jpg", "Salongerna", "Matsalen med gustavianska stolar och fönster mot gården"],
              ["ravaror.jpg", "Råvaror i säsong", "Färska örter hackas i köket"],
              ["gaster.jpg", "Långa samtal", "Gäster i samtal vid bordet i salongen"],
            ].map(([f, cap, alt]) => (
              <figure key={f}>
                <Image src={`/bilder/${f}`} alt={alt} fill sizes="(max-width: 900px) 50vw, 25vw" style={{ objectFit: "cover" }} />
                <figcaption>{cap}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* FYRA KATEGORIER */}
      <section className="section tint" id="upplev">
        <div className="container">
          <p className="label">Året runt</p>
          <h2 className="lower" style={{ marginBottom: 48 }}>fyra sätt att uppleva herrgården</h2>
          <div className="grid grid-4">
            <Link className="cat" href="/boende">
              <div className="cat__img" style={{ position: "relative" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.sang} alt="Bäddad säng i en av flyglarna på Westsura Herrgård" loading="lazy" />
              </div>
              <h3>Boende</h3>
              <p>Övernatta i flyglarna från 1680. Ombonad atmosfär, komfort och ro — och hunden får följa med.</p>
              <span className="link-more">Se lediga rum →</span>
            </Link>
            <Link className="cat" href="/konferens">
              <div className="cat__img" style={{ position: "relative" }}>
                <Image src="/bilder/konferens.jpg" alt="Konferensbordet under kristallkronan i herrgårdens salong" fill sizes="(max-width: 980px) 50vw, 25vw" style={{ objectFit: "cover" }} />
              </div>
              <h3>Konferens</h3>
              <p>Dagskonferens för upp till 25 personer, med lunch och fika på säsongens råvaror. 700 kr per person.</p>
              <span className="link-more">Boka konferens →</span>
            </Link>
            <Link className="cat" href="/event">
              <div className="cat__img" style={{ position: "relative" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.skal} alt="Två glas som skålar vid bordet på Westsura Herrgård" loading="lazy" />
              </div>
              <h3>Event</h3>
              <p>Bröllop, födelsedagar, föreningsluncher och minnesstunder i salongerna eller trädgårdens tält.</p>
              <span className="link-more">Skicka förfrågan →</span>
            </Link>
            <Link className="cat" href="/jakt">
              <div className="cat__img" style={{ position: "relative" }}>
                <Image src="/bilder/jakt.png" alt="Jakthund på Westsura Herrgårds marker" fill sizes="(max-width: 980px) 50vw, 25vw" style={{ objectFit: "cover" }} />
              </div>
              <h3>Jakt</h3>
              <p>Jakt och jakthundsträning i viltrika marker, där kungen sköt sin björn 1687.</p>
              <span className="link-more">Läs om jakten →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* FIRA HOS OSS */}
      <section className="section" id="fira">
        <div className="container split">
          <div style={{ aspectRatio: "4 / 3", overflow: "hidden", position: "relative" }}>
            <Image src="/bilder/fest.jpg" alt="Dukat bord med glas inför festen på herrgården" fill sizes="(max-width: 860px) 100vw, 50vw" style={{ objectFit: "cover" }} />
          </div>
          <div>
            <p className="label">Fira hos oss</p>
            <h2 className="lower">bröllop, fest och sällskap</h2>
            <p>Bröllopet i salongerna eller i tältet i trädgården. Födelsedagen med hela släkten. Föreningens lunch, årsmötet, minnesstunden. Herrgården rymmer sällskapet — sexton bäddar om ni vill stanna över natten.</p>
            <p>Varje arrangemang planeras i dialog med er. Berätta vad ni tänker er, så hör vi av oss med ett förslag.</p>
            <CtaRow />
          </div>
        </div>
      </section>

      <DogBand />

      {/* WESTSURAS VÄNNER */}
      <section className="section tint" id="vanner">
        <div className="container" style={{ maxWidth: 760, textAlign: "center" }}>
          <Ornament />
          <p className="label">Westsuras Vänner</p>
          <h2 className="lower">bli vän med herrgården</h2>
          <p style={{ marginLeft: "auto", marginRight: "auto" }}>Nyhetsbrev med säsongens meny och kommande evenemang, förhandsinbjudan till höstdagar och temakvällar, och rabatt på herrgårdens egna arrangemang. Kostnadsfritt, och utan konto — bara din e-postadress.</p>
          <Signup />
        </div>
      </section>
    </>
  );
}
