import type { Metadata } from "next";
import { Hero, CtaRow } from "@/components/Blocks";
import InquiryForm from "@/components/InquiryForm";
import { img } from "@/lib/site";

export const metadata: Metadata = {
  title: "Jakt och jakthundsträning i Västmanland",
  description:
    "Upplev jakten på Westsura Herrgård i Surahammar — exklusiva jaktupplevelser i viltrika marker med flera hundra års tradition, och träning för jakthundar. Kombinera med boende och mat.",
  alternates: { canonical: "/jakt" },
};

export default function Jakt() {
  return (
    <>
      <Hero src="/bilder/jakt.png" alt="Jakthund med fågel på Westsura Herrgårds marker" sub label="Upplev jakten på Westsura" title="där natur och tradition möts"
        lede="Exklusiva jaktupplevelser i naturskön miljö, för både nybörjare och erfarna jägare." />

      <section className="section section--tight">
        <div className="container split" style={{ alignItems: "start" }}>
          <div className="prose">
            <p className="pull">”…jagat i Östersura, där jag skjutit en björn.”<small>Karl XI, 1687</small></p>
            <p>Björnen är borta, men markerna är desamma. Traditionen från kungens jaktresa lever kvar i skogarna omkring herrgården — i dag med vildsvin, älg, rådjur och fågel.</p>
            <p>Vi erbjuder jaktupplevelser i en naturskön miljö, perfekt för både nybörjare och erfarna jägare, och träning för jakthundar där både hund och förare får utvecklas i en trygg och inspirerande miljö.</p>
            <p>Kombinera jakten med boende i flyglarna, middag i matsalen och en kväll i biblioteket. Hela boendet kan bokas för jaktlaget till ett fast pris.</p>
          </div>
          <div style={{ aspectRatio: "3 / 4", overflow: "hidden", position: "relative" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.fasan} alt="Fasan i markerna kring Westsura Herrgård" style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
          </div>
        </div>
      </section>

      <section className="section tint">
        <div className="container">
          <div className="grid grid-3">
            <div className="card">
              <h3>Jakttillfällen</h3>
              <p>Utlysta jakter under säsongen — se aktuella datum under Paket &amp; erbjudanden, eller boka ett eget tillfälle för er grupp.</p>
            </div>
            <div className="card">
              <h3>Jakthundsträning</h3>
              <p>Kurser och träningsdagar för apportering, spår och eftersök. För hund och förare i alla nivåer.</p>
            </div>
            <div className="card">
              <h3>Jaktklubben</h3>
              <p>En sluten jaktklubb med begränsat antal platser öppnar för medlemmar. Är du intresserad av att veta mer, hör av dig.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section band" id="forfragan">
        <div className="container split" style={{ alignItems: "start" }}>
          <div>
            <p className="label">Boka jakt för er grupp</p>
            <h2 className="lower">berätta vad ni önskar</h2>
            <p>Är ni en grupp som vill boka ett eget jakttillfälle, eller en träningsdag för hundarna? Fyll i formuläret, så hör vi av oss med ett upplägg som passar er grupp och era önskemål.</p>
            <CtaRow primaryHref="#forfragan" primaryLabel="Fyll i formuläret" />
          </div>
          <div><InquiryForm typ="Jakt" alternativ={["Jakttillfälle för grupp", "Jakthundsträning", "Intresse för jaktklubben", "Annat"]} /></div>
        </div>
      </section>
    </>
  );
}
