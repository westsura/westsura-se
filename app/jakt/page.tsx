import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Hero, Vapen } from "@/components/Blocks";
import Tillfallen, { type Tillfalle } from "@/components/Tillfallen";
import { site } from "@/lib/site";
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

      {/* Två dörrar: öppen jakt eller den slutna klubben */}
      <section className="section section--tight">
        <div className="container doors">
          <div className="door">
            <div className="door__img fig">
              <Image src="/bilder/ravaror.jpg" alt="Vilt hanteras i herrgårdens kök" fill sizes="(max-width: 860px) 100vw, 50vw" />
            </div>
            <div className="door__body">
              <p className="label">Öppet för alla</p>
              <h2 className="lower">jaga, träna, lär dig</h2>
              <p>Utlysta jaktdagar, träningsdagar för hund och förare, och endagskurser. Boka en plats när det finns lediga — jägarexamen krävs för jakten, inte för hundträningen.</p>
              <ul className="door__list">
                <li><a href="#jakttillfallen">Jakttillfällen<span>{jakttillfallen.length ? `${jakttillfallen.length} utlysta` : "inga datum just nu"}</span></a></li>
                <li><a href="#hundtraning">Hundträning<span>{hundtraning.length ? `${hundtraning.length} träningsdagar` : "inga datum just nu"}</span></a></li>
                <li><a href="#jaktkurser">Jaktkurser<span>{jaktkurser.length ? `${jaktkurser.length} kurser` : "inga datum just nu"}</span></a></li>
              </ul>
            </div>
          </div>
          <div className="door door--dark dark">
            <div className="door__emblem"><Vapen size={150} className="emblem__vapen" /></div>
            <div className="door__body">
              <p className="label">Westsura Herrgårds jaktklubb</p>
              <h2 className="lower">för den som vill höra till</h2>
              <p>En sluten klubb med begränsat antal platser på herrgårdens egna marker. Egna jaktdagar, vak- och pyrschdygn, kartor, regler och dokument. Medlemskap söks, och beviljas av herrgården.</p>
              <div className="cta-row cta-row--space">
                <Link className="btn" href="/jaktklubb#ansokan">Ansök om medlemskap</Link>
                <Link className="btn btn--ghost" href="/jaktklubb/login">Logga in</Link>
              </div>
            </div>
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

      {/* Kort påminnelse längst ner — klubben har sin egen dörr överst */}
      <section className="dark doors__foot">
        <div className="container doors__foot-in">
          <Vapen size={56} className="emblem__vapen" />
          <p className="mb-0">Vill du jaga hos oss hela säsongen? <Link href="/jaktklubb">Läs om jaktklubben och ansök om medlemskap →</Link></p>
        </div>
      </section>
    </>
  );
}
