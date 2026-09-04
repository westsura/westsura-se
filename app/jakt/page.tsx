import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Hero, Vapen } from "@/components/Blocks";
import Tillfallen, { type Tillfalle } from "@/components/Tillfallen";
import { img, site } from "@/lib/site";
import { supabasePublik } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Jakt, jaktkurser och jakthundsträning i Västmanland",
  description:
    "Jakt på Westsura Herrgård i Surahammar: boka enstaka jakttillfällen, jaktkurser och träningsdagar för jakthundar. Viltrika marker med flera hundra års tradition, boende och mat på herrgården. Sluten jaktklubb för medlemmar.",
  alternates: { canonical: "/jakt" },
};

export const revalidate = 300;

export default async function Jakt() {
  let alla: Tillfalle[] = [];
  try {
    const { data } = await supabasePublik().from("tillfallen_publik").select("*").in("typ", ["jakt", "hundtraning", "jaktkurs"]).order("datum");
    alla = (data ?? []) as Tillfalle[];
  } catch (e) { console.error("Kunde inte hämta tillfällen", e); }
  const jakttillfallen = alla.filter((t) => t.typ === "jakt");
  const hundtraning = alla.filter((t) => t.typ === "hundtraning");
  const jaktkurser = alla.filter((t) => t.typ === "jaktkurs");

  return (
    <>
      <Hero src="/bilder/jakt.png" alt="Jakthund med fågel på Westsura Herrgårds marker" sub label="Upplev jakten på Westsura" title="där natur och tradition möts"
        lede="Enstaka jakttillfällen, kurser och hundträning — öppet för alla. Och en sluten jaktklubb för den som vill höra till." />

      {/* Fyra vägar in */}
      <section className="section section--tight">
        <div className="container">
          <div className="grid grid-4">
            <a className="cat" href="#jakttillfallen">
              <div className="cat__img" style={{ position: "relative" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.fasan} alt="Fasan i markerna kring Westsura" loading="lazy" />
              </div>
              <h3>Jakttillfällen</h3>
              <p>Utlysta jaktdagar på herrgårdens marker. Boka en plats när det finns lediga.</p>
              <span className="link-more">Se datum →</span>
            </a>
            <a className="cat" href="#hundtraning">
              <div className="cat__img" style={{ position: "relative" }}>
                <Image src="/bilder/jakt.png" alt="Jakthund i arbete" fill sizes="(max-width: 980px) 50vw, 25vw" style={{ objectFit: "cover" }} />
              </div>
              <h3>Hundträning</h3>
              <p>Träningsdagar för hund och förare — apportering, spår och eftersök, i alla nivåer.</p>
              <span className="link-more">Se datum →</span>
            </a>
            <a className="cat" href="#jaktkurser">
              <div className="cat__img" style={{ position: "relative" }}>
                <Image src="/bilder/ravaror.jpg" alt="Vilt hanteras i köket" fill sizes="(max-width: 980px) 50vw, 25vw" style={{ objectFit: "cover" }} />
              </div>
              <h3>Jaktkurser</h3>
              <p>Vilthantering, säkerhet och skytte. Teori och praktik under en dag, med mat i herrgården.</p>
              <span className="link-more">Se datum →</span>
            </a>
            <Link className="cat" href="/jaktklubben">
              <div className="cat__img cat__img--vapen">
                <Vapen variant="farg" size={200} />
              </div>
              <h3>Jaktklubben</h3>
              <p>Sluten klubb med begränsat antal platser, egna jaktdagar och bokning av vak- och pyrschdygn.</p>
              <span className="link-more">Logga in eller ansök →</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="section tint" id="jakttillfallen">
        <div className="container split" style={{ alignItems: "start", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.4fr)" }}>
          <div className="prose">
            <p className="label">Enstaka jakttillfällen</p>
            <h2 className="lower">jaga en dag på westsura</h2>
            <p className="pull">”…jagat i Östersura, där jag skjutit en björn.”<small>Karl XI, 1687</small></p>
            <p>Björnen är borta, men markerna är desamma. Vi lyser ut jaktdagar under säsongen — drevjakt, vakjakt och pyrsch — med jaktledare, genomgång och mat i fält eller i matsalen efteråt.</p>
            <p>Giltig jägarexamen och vapenlicens krävs. Övernattning i flyglarna bokas till, och hela boendet kan bokas för ett jaktlag.</p>
            <p>Vill ni boka ett eget tillfälle för er grupp? Ring <a href={site.phoneHref}>{site.phone}</a>, så hör vi av oss med ett upplägg.</p>
          </div>
          <Tillfallen tillfallen={jakttillfallen} rubrik="Utlysta jaktdagar" />
        </div>
      </section>

      <section className="section" id="hundtraning">
        <div className="container split" style={{ alignItems: "start", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.4fr)" }}>
          <div className="prose">
            <p className="label">Hundträning</p>
            <h2 className="lower">för hund och förare</h2>
            <p>Träningsdagar där både hund och förare får utvecklas i en trygg och inspirerande miljö. Små grupper, mycket praktik, och fika i herrgården mitt på dagen.</p>
            <p>Apportering för unga hundar, spår och eftersök för de som kommit längre. Alla raser och nivåer är välkomna — säg till om ni är osäkra på vilken dag som passar.</p>
          </div>
          <Tillfallen tillfallen={hundtraning} rubrik="Kommande träningsdagar" />
        </div>
      </section>

      <section className="section tint" id="jaktkurser">
        <div className="container split" style={{ alignItems: "start", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.4fr)" }}>
          <div className="prose">
            <p className="label">Jaktkurser</p>
            <h2 className="lower">lär dig mer om jakten</h2>
            <p>Endagskurser i vilthantering, säkerhet och skytte. Teori på förmiddagen, praktik på eftermiddagen, och middag lagad på dagens råvara för den som vill stanna.</p>
            <p>Kurserna är öppna för alla. Säkerhets- och skyttekursen är dessutom obligatorisk för jaktklubbens medlemmar inför varje säsong.</p>
          </div>
          <Tillfallen tillfallen={jaktkurser} rubrik="Kommande kurser" />
        </div>
      </section>

      <section className="section dark">
        <div className="container split">
          <div>
            <p className="label">Jaktklubben</p>
            <h2 className="lower" style={{ color: "var(--ws-cream)" }}>för den som vill höra till</h2>
            <p>En sluten jaktklubb med begränsat antal platser i tre nivåer. Medlemmar får egna gemensamma jaktdagar, ingående vak- och pyrschdygn, förtur till bokning och tillgång till kartor, regler och dokument.</p>
            <p style={{ marginBottom: 0 }}>Medlemskap beviljas av herrgården. Är du medlem loggar du in här; är du intresserad kan du anmäla ditt intresse.</p>
            <div className="cta-row" style={{ marginTop: 24 }}>
              <Link className="btn" href="/jaktklubben">Logga in</Link>
              <Link className="btn btn--ghost" href="/jaktklubben#intresse" style={{ color: "var(--ws-cream)", borderColor: "rgba(215,174,98,.5)" }}>Anmäl intresse</Link>
            </div>
          </div>
          <div style={{ display: "grid", placeItems: "center" }}>
            <Vapen size={300} style={{ color: "var(--ws-gold-400)" }} />
          </div>
        </div>
      </section>
    </>
  );
}
