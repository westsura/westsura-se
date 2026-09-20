"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { sattKursGenomford, sparaMedlemsanteckning, avslutaMedlemskap } from "@/app/admin/actions";
import type { Medlem } from "../delar";

/** Det som går att ändra på en medlem: kursen, anteckningen och att avsluta medlemskapet. */
export default function MedlemsKort({ m }: { m: Medlem }) {
  const [kurs, setKurs] = useState(m.kurs_genomford);
  const [ant, setAnt] = useState(m.anteckning ?? "");
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <section className="admin__panel" style={{ marginTop: 24 }}>
      <h2 className="admin__h2">Klubbens noteringar</h2>

      <label className="checkfield checkfield--bare" style={{ marginBottom: 16 }}>
        <input type="checkbox" checked={kurs} disabled={pending}
          onChange={(e) => { const v = e.target.checked; setKurs(v); start(async () => { await sattKursGenomford(m.id, v); }); }} />
        <span>Säkerhets- och skyttekurs genomförd</span>
      </label>

      <div className="field">
        <label htmlFor="anteckning">Anteckning</label>
        <input id="anteckning" value={ant} disabled={pending}
          onChange={(e) => setAnt(e.target.value)}
          onBlur={() => start(async () => { await sparaMedlemsanteckning(m.id, ant); })}
          placeholder="Ringt, träffat, referens…" />
      </div>

      {fel && <p className="notice notice--fel" style={{ marginTop: 12 }} role="alert">{fel}</p>}

      {m.status === "godkand" && (
        <div className="ff__foot">
          <button className="btn btn--sm btn--ghost" type="button" disabled={pending}
            onClick={() => {
              if (!confirm(`Avsluta ${m.namn}s medlemskap? Alla uppladdade dokument raderas.`)) return;
              start(async () => {
                const r = await avslutaMedlemskap(m.id);
                if (r.ok) router.push("/admin/jaktklubb"); else setFel(r.fel ?? "Något gick fel.");
              });
            }}>Avsluta medlemskap</button>
        </div>
      )}
    </section>
  );
}
