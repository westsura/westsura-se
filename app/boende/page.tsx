import type { Metadata } from "next";
import { Suspense } from "react";
import { Hero, DogBand } from "@/components/Blocks";
import Booking from "@/components/Booking";
import { img } from "@/lib/site";

export const metadata: Metadata = {
  title: "Boende — bo i våra flyglar från 1680",
  description:
    "Övernatta i Westsura Herrgårds flyglar från 1680 i Surahammar, Västmanland. Sexton bäddar i fyra flyglar och åtta rum, gemensamhetskök och frukostkorg med lokala råvaror. Hundvänligt i samtliga rum.",
  alternates: { canonical: "/boende" },
};

export default function Boende() {
  return (
    <>
      <Hero remote sub src={img.sangStor} alt="Bäddad säng i en av flyglarna från 1680" label="Boende" title="bo i våra flyglar från 1680"
        lede="”…och övernattat hos Erick Christiernin” — Karl XI, 1687. Flyglarna står kvar." />

      <section className="section section--tight">
        <div className="container">
          <div className="split" style={{ alignItems: "start" }}>
            <div>
              <p className="lede">Ett avkopplande boende i naturskön herrgårdsmiljö, med gemensamhetskök, terrass och grill — och närhet till både skogen och kanalen.</p>
              <p>Herrgården rymmer sexton bäddar i fyra flyglar och åtta rum. Två av flyglarna bokas som hela familjeflyglar för ett sällskap, och fyra av rummen bokas var för sig. Frukostkorgen med lokala råvaror bokas till för 95 kr per person och natt och levereras till boendet, så att ni kan börja dagen i lugn och ro.</p>
            </div>
            <div>
              <p className="label">Bra att veta</p>
              <ul className="ticks">
                <li>Incheckning från kl. 15.00, utcheckning senast kl. 11.00.</li>
                <li>Fri avbokning fram till 7 dagar före ankomst.</li>
                <li>Betalning senast 7 dagar före ankomst, eller faktura enligt överenskommelse.</li>
                <li><strong>Hundar är varmt välkomna i samtliga rum</strong>, utan tillägg.</li>
                <li>Gratis wifi, kaffebryggare, vattenkokare, kylskåp och möjlighet till barnsäng.</li>
                <li>Enstaka nätter går alltid att boka — inget krav på två nätter över helgen.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <Suspense fallback={<section className="section section--tight tint"><div className="container"><p className="empty">Laddar bokningen…</p></div></section>}>
        <Booking />
      </Suspense>

      <DogBand short />
    </>
  );
}
