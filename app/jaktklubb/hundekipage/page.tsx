import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/Blocks";
import EkipageForm from "@/components/EkipageForm";
import { EKIPAGE_RABATT } from "@/lib/jakt";

export const metadata: Metadata = {
  title: "Hundekipage — drevhund, älghund och eftersök i Västmanland",
  description: "Registrera ditt hundekipage hos Westsura Herrgård i Surahammar: hundförare med drivande hund eller älghund, och eftersöksekipage. Ingen avgift — boende till halva priset för förare och hund.",
  alternates: { canonical: "/jaktklubb/hundekipage" },
};

export default function Hundekipage() {
  return (
    <>
      <PageHead label="Hundförare och eftersök" title="registrera ditt hundekipage"
        lede="Vi söker hundförare och eftersöksekipage till jakterna på Westsura. Ingen medlemsavgift — och som godkänt ekipage bor du och hunden till halva priset." />
      <section className="section--after-head">
        <div className="container split split--start split--form">
          <div className="prose">
            <h2 className="lower">så fungerar det</h2>
            <ul>
              <li>Du registrerar dig och din hund — eller dina hundar — här. Det kostar ingenting.</li>
              <li>Herrgården går igenom uppgifterna och godkänner ekipaget. Då får du en inloggning till ditt konto.</li>
              <li>Vi hör av oss inför jakter där vi behöver hundar: drevjakt, älgjakt med ståndskallare och eftersök.</li>
              <li>Som godkänt ekipage får du {EKIPAGE_RABATT}&nbsp;% rabatt på boendet för dig och hunden, och medlemspris på maten. Logga in innan du bokar så dras rabatten automatiskt.</li>
            </ul>
            <h2 className="lower">hundförare eller eftersök</h2>
            <p>Hundförare behöver inte ha jägarexamen — har du det, ange det gärna. För eftersök på skadat vilt krävs jägarexamen.</p>
            <p className="mb-0">Läs <Link href="/jaktklubb/villkor">villkoren för jakt</Link>, bland annat om hundar, eftersök och avbokning.</p>
          </div>
          <div className="card card--accent">
            <EkipageForm />
          </div>
        </div>
      </section>
    </>
  );
}
