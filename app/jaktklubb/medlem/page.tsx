import type { Metadata } from "next";
import { kravMedlem } from "@/lib/jakt";

export const metadata: Metadata = { title: "Medlemsklubben", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Platshållare tills översikten byggs i steg 1.5. Bekräftar att inloggningen håller. */
export default async function Oversikt() {
  const medlem = await kravMedlem();
  return (
    <section className="section">
      <div className="container prose">
        <p className="label">Medlemsklubben</p>
        <h1 className="lower">välkommen tillbaka, {medlem.namn.split(" ")[0].toLowerCase()}</h1>
        <p className="mb-0">Översikten byggs i nästa steg. Du är inloggad som {medlem.epost}.</p>
      </div>
    </section>
  );
}
