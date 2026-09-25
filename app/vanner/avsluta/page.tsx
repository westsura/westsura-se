import type { Metadata } from "next";
import Link from "next/link";
import AvslutaKnapp from "./AvslutaKnapp";

export const metadata: Metadata = { title: "Avsluta Westsuras Vänner", robots: { index: false, follow: false } };

/** Länken i mejlen leder hit. Avslutet kräver ett klick, så att länkförhandsvisningar i mejlprogram inte avslutar av misstag. */
export default async function Avsluta({ searchParams }: { searchParams: Promise<{ e?: string; t?: string }> }) {
  const { e = "", t = "" } = await searchParams;
  return (
    <section className="section">
      <div className="container narrow center">
        <p className="label">Westsuras Vänner</p>
        <h1 className="lower">avsluta prenumerationen</h1>
        <p>Vill du inte längre få mejl från oss till <strong>{e || "din adress"}</strong>? Då avslutar du här med ett klick.</p>
        <AvslutaKnapp epost={e} token={t} />
        <p className="hint hint--after"><Link href="/">Tillbaka till herrgården</Link></p>
      </div>
    </section>
  );
}
