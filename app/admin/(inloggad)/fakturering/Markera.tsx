"use client";

import { useState, useTransition } from "react";
import { markeraUnderlag } from "@/app/admin/actions";

/** Bocka av att fakturan är skickad (eller betald) direkt i listan — tills Fortnox är kopplat. */
export default function Markera({ id, nummer, status }: { id: string; nummer: number; status: string }) {
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const kor = (s: "fakturerad" | "betald" | "ej_fakturerad", nr?: string) => start(async () => {
    setFel(null);
    const r = await markeraUnderlag(id, s, nr);
    if (!r.ok) setFel(r.fel ?? "Kunde inte ändra.");
  });
  return (
    <>
      {status === "ej_fakturerad" && (
        <button type="button" className="btn btn--sm" disabled={pending} onClick={() => {
          const nr = prompt(`Markera underlag ${nummer} som skickat till kunden i dag.\n\nFakturanumret i Fortnox (valfritt):`, "");
          if (nr === null) return;
          kor("fakturerad", nr);
        }}>Skickad</button>
      )}
      {status === "fakturerad" && (
        <>
          <button type="button" className="btn btn--sm" disabled={pending} onClick={() => { if (confirm(`Markera underlag ${nummer} som betalt i dag?`)) kor("betald"); }}>Betald</button>
          <button type="button" className="btn btn--sm btn--ghost" disabled={pending} title="Ångra — inte skickad ändå" onClick={() => { if (confirm(`Ångra? Underlag ${nummer} markeras som ej fakturerat igen.`)) kor("ej_fakturerad"); }}>Ångra</button>
        </>
      )}
      {fel && <div className="notice notice--fel" role="alert">{fel}</div>}
    </>
  );
}
