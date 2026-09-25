"use client";

import { useState, useTransition } from "react";
import { avslutaVan } from "@/app/actions";

export default function AvslutaKnapp({ epost, token }: { epost: string; token: string }) {
  const [klart, setKlart] = useState(false);
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (klart) return <p className="motto motto--gold" role="status">Klart — du får inga fler mejl från oss. Du är alltid välkommen tillbaka.</p>;
  return (
    <>
      <button className="btn" type="button" disabled={pending} onClick={() => start(async () => { const r = await avslutaVan(epost, token); if (r.ok) setKlart(true); else setFel(r.fel); })}>
        {pending ? "Avslutar…" : "Avsluta prenumerationen"}
      </button>
      {fel && <p className="fel" role="alert">{fel}</p>}
    </>
  );
}
