"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { skapaUppgift, klarUppgift, taBortUppgift } from "@/app/admin/arenden";

export type Uppgift = { id: string; arende_id: string | null; text: string; forfallo: string | null; klar: boolean; skapad_av: string | null; arende?: { id: string; nummer: number; namn: string } | null };

const kort = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" });

/** Uppgifter och påminnelser — kopplade till en bokning eller fristående. Inget skickas till kunden. */
export default function Uppgiftslista({ uppgifter, arendeId, rubrik = "Uppgifter och påminnelser", visaKlara = false }: { uppgifter: Uppgift[]; arendeId?: string; rubrik?: string; visaKlara?: boolean }) {
  const [ny, setNy] = useState(false);
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const idag = new Date().toISOString().slice(0, 10);
  const lista = uppgifter.filter((u) => visaKlara || !u.klar);

  return (
    <section className="admin__panel">
      <div className="ff__head">
        <h2 className="admin__h2" style={{ margin: 0 }}>{rubrik}</h2>
        {!ny && <button className="btn btn--sm btn--ghost" onClick={() => setNy(true)}>+ Ny uppgift</button>}
      </div>
      {ny && (
        <form className="form" style={{ marginTop: 12 }} onSubmit={(e) => {
          e.preventDefault();
          const f = e.currentTarget; const fd = new FormData(f);
          setFel(null);
          start(async () => { const r = await skapaUppgift(fd); if (r.ok) { f.reset(); setNy(false); } else setFel(r.fel ?? "Kunde inte spara."); });
        }}>
          {arendeId && <input type="hidden" name="arende_id" value={arendeId} />}
          <div className="field field--full"><label>Att göra</label><input name="text" required placeholder="T.ex. ring och följ upp offerten, beställ blommor, skicka meny" /></div>
          <div className="field"><label>Påminn / klart senast</label><input name="forfallo" type="date" /></div>
          {fel && <div className="notice notice--fel field--full" role="alert">{fel}</div>}
          <div className="field--full cta-row">
            <button className="btn btn--sm" type="submit" disabled={pending}>Lägg till</button>
            <button className="btn btn--sm btn--ghost" type="button" onClick={() => setNy(false)}>Avbryt</button>
          </div>
        </form>
      )}
      {!lista.length && !ny && <p className="empty">Inga öppna uppgifter.</p>}
      <ul className="uppgifter-lista">
        {lista.map((u) => {
          const sen = !u.klar && u.forfallo && u.forfallo < idag, idagU = !u.klar && u.forfallo === idag;
          return (
            <li key={u.id} className={u.klar ? "is-klar" : ""}>
              <label className="checkfield checkfield--bare">
                <input type="checkbox" checked={u.klar} disabled={pending} onChange={(e) => { const k = e.target.checked; start(async () => { await klarUppgift(u.id, k); }); }} />
                <span>{u.text}</span>
              </label>
              <span className="uppgifter-lista__meta">
                {u.forfallo && <span className={sen ? "folj folj--passerat" : idagU ? "folj folj--snart" : ""}>{sen ? "Försenad · " : idagU ? "I dag · " : ""}{kort(u.forfallo)}</span>}
                {u.arende && !arendeId && <> · <Link href={`/admin/bokningar/${u.arende.id}`}>#{u.arende.nummer} {u.arende.namn}</Link></>}
                <button className="linkbtn" style={{ marginLeft: 10 }} disabled={pending} onClick={() => { if (confirm("Ta bort uppgiften?")) start(async () => { await taBortUppgift(u.id); }); }}>Ta bort</button>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
