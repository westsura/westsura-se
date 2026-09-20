import type { Metadata } from "next";
import { Suspense } from "react";
import { Hero, DogBand } from "@/components/Blocks";
import Booking, { type Enhet } from "@/components/Booking";
import { supabasePublik } from "@/lib/supabase";
import { img } from "@/lib/site";

export const metadata: Metadata = {
  title: "Boende — bo i våra flyglar från 1683",
  description:
    "Övernatta i Westsura Herrgårds fyra flyglar från 1683 i Surahammar, Västmanland. Spröjsade fönster, djupa fönsternischer, sexton bäddar i åtta rum, gemensamhetskök och frukostkorg med lokala råvaror. Hundvänligt i samtliga rum.",
  alternates: { canonical: "/boende" },
};

export const revalidate = 300; // enheter och priser hämtas på nytt var femte minut

export default async function Boende() {
  let enheter: Enhet[] = [];
  try {
    const { data } = await supabasePublik().from("enheter_publik").select("*").order("ordning");
    enheter = (data ?? []) as Enhet[];
  } catch (e) { console.error("Kunde inte hämta enheter", e); }

  return (
    <>
      <Hero remote sub src={img.sangStor} alt="Bäddad säng i en av flyglarna från 1683" label="Boende" title="bo i våra flyglar från 1683"
        lede="”…och övernattat hos Erick Christiernin” — Karl XI, 1687. Flyglarna står kvar." />

      <section className="section--lead">
        <div className="container">
          <p className="lede">Fyra flyglar från 1683 ligger framför herrgården och bildar med sin vinklade byggnation en gårdsbild som är Westsuras egen. Här bor ni — i rum med spröjsade fönster och djupa fönsternischer, med gemensamhetskök, terrass och grill, och skogen och kanalen inpå knuten.</p>
          <p className="mb-0">Flyglarna rymmer sexton bäddar i åtta rum. Två av flyglarna bokas hela för ett sällskap, och fyra av rummen bokas var för sig. Frukostkorgen med lokala råvaror bokas till för 95 kr per person och natt. Hundar är välkomna i alla rum, utan tillägg, och enstaka nätter går alltid att boka.</p>
        </div>
      </section>

      <Suspense fallback={<section className="section section--tight tint"><div className="container"><p className="empty">Laddar bokningen…</p></div></section>}>
        <Booking enheter={enheter} />
      </Suspense>

      <section className="section section--tight">
        <div className="container split split--start">
          <div className="prose">
            <p className="label">Bra att veta</p>
            <h2 className="lower">före ankomst</h2>
            <p className="mb-0">Bokningen blir preliminär direkt och bindande när ni fått vår bekräftelse, som kommer inom en vardag. Frukostkorgen levereras till boendet på morgonen så att ni kan börja dagen i lugn och ro.</p>
          </div>
          <ul className="ticks">
            <li>Incheckning från kl. 15.00, utcheckning senast kl. 11.00.</li>
            <li>Fri avbokning fram till 7 dagar före ankomst.</li>
            <li>Betalning senast 7 dagar före ankomst, eller faktura enligt överenskommelse.</li>
            <li><strong>Hundar är varmt välkomna i samtliga rum</strong>, utan tillägg.</li>
            <li>Gratis wifi, kaffebryggare, vattenkokare, kylskåp och möjlighet till barnsäng.</li>
            <li>Enstaka nätter går alltid att boka — inget krav på två nätter över helgen.</li>
          </ul>
        </div>
      </section>

      <DogBand short />
    </>
  );
}
