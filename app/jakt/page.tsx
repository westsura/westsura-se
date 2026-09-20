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
    "Jakt på Westsura Herrgård i Surahammar: skogsfågel, fältfågel, rådjur och älg in på knuten. Boka enstaka jakttillfällen, jaktkurser och träningsdagar för fågelhundar. Marker med tradition sedan Karl XI:s björnjakt 1687, boende och mat på herrgården. Sluten jaktklubb för medlemmar.",
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
              <div className="cat__img fig">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.fasan} alt="Fasan i markerna kring Westsura" loading="lazy" />
              </div>
              <h3>Jakttillfällen</h3>
              <p>Utlysta jaktdagar på herrgårdens marker. Boka en plats när det finns lediga.</p>
              <span className="link-more">Se datum →</span>
            </a>
            <a className="cat" href="#hundtraning">
              <div className="cat__img fig">
                <Image src="/bilder/jakt.png" alt="Jakthund i arbete" fill sizes="(max-width: 980px) 50vw, 25vw" />
              </div>
              <h3>Hundträning</h3>
              <p>Träningsdagar för hund och förare — apportering, spår och eftersök, i alla nivåer.</p>
              <span className="link-more">Se datum →</span>
            </a>
            <a className="cat" href="#jaktkurser">
              <div className="cat__img fig">
                <Image src="/bilder/ravaror.jpg" alt="Vilt hanteras i köket" fill sizes="(max-width: 980px) 50vw, 25vw" />
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
              <span className="link-more">Ansök eller logga in →</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="section tint" id="jakttillfallen">
        <div className="container split split--start split--wide">
          <div className="prose">
            <p className="label">Enstaka jakttillfällen</p>
            <h2 className="lower">jaga en dag på westsura</h2>
            <p className="pull">”…jagat i Östersura, där jag skjutit en björn.”<small>Karl XI, 1687</small></p>
            <p>Jakten har en lång historia på Westsura. En av de första jakter som nämns i litteraturen är Karl XI:s björnjakt i trakten, med jaktmiddag på herrgården. Björnen är borta, men markerna är desamma: skogsfågel och fältfågel, rådjur och älg in på knuten.</p>
            <p>Vi lyser ut jaktdagar under säsongen — drevjakt, vakjakt och pyrsch — med jaktledare, genomgång och mat i fält eller i matsalen efteråt. Giltig jägarexamen, jaktkort och vapenlicens krävs. Övernattning i flyglarna bokas till, och hela boendet kan bokas för ett jaktlag.</p>
            <p>Vill ni ha en egen jakt för ert sällskap syr vi ihop den så att den passar er. Ring <a href={site.phoneHref}>{site.phone}</a>, gärna redan nu inför kommande säsong.</p>
          </div>
          <Tillfallen tillfallen={jakttillfallen} rubrik="Utlysta jaktdagar" />
        </div>
      </section>

      <section className="section" id="hundtraning">
        <div className="container split split--start split--wide">
          <div className="prose">
            <p className="label">Hundträning</p>
            <h2 className="lower">för hund och förare</h2>
            <p>Träningsdagar för i första hand fågelhundar, men även andra hundar — och deras hussar och mattar. Vi har utmärkta marker för fågel, och tränar i små grupper med mycket praktik och fika i herrgården mitt på dagen.</p>
            <p>Apportering för unga hundar, spår och eftersök för de som kommit längre. Fria skogspromenader och pauser hjälper hundarna att smälta intrycken, och medföljande är välkomna att vara med vid måltiderna. Alla raser och nivåer är välkomna — säg till om ni är osäkra på vilken dag som passar.</p>
          </div>
          <Tillfallen tillfallen={hundtraning} rubrik="Kommande träningsdagar" />
        </div>
      </section>

      <section className="section tint" id="jaktkurser">
        <div className="container split split--start split--wide">
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
            <h2 className="lower">för den som vill höra till</h2>
            <p>En sluten jaktklubb med begränsat antal platser i tre nivåer. Medlemmar får egna gemensamma jaktdagar, ingående vak- och pyrschdygn, förtur till bokning och tillgång till kartor, regler och dokument.</p>
            <p className="mb-0">Medlemskap söks, och beviljas av herrgården. Läs om de tre nivåerna och ansök — eller logga in om du redan är medlem.</p>
            <div className="cta-row cta-row--space">
              <Link className="btn" href="/jaktklubben#ansokan">Ansök om medlemskap</Link>
              <Link className="btn btn--ghost" href="/jaktklubben#medlem">Logga in</Link>
            </div>
          </div>
          <div className="center">
            <Vapen size={300} className="emblem__vapen" />
          </div>
        </div>
      </section>
    </>
  );
}
