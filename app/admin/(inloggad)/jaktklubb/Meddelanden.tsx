"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { sparaKlubbmeddelande, taBortKlubbmeddelande } from "@/app/admin/actions";
import type { Klubbmeddelande } from "./delar";

/** Klubbens meddelanden. Det senaste publicerade syns på medlemmarnas översikt. */
export default function Meddelanden({ meddelanden }: { meddelanden: Klubbmeddelande[] }) {
  const [oppen, setOppen] = useState<string | null>(null);
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const spara = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setFel(null);
    start(async () => {
      const r = await sparaKlubbmeddelande(fd);
      if (r.ok) { setOppen(null); router.refresh(); } else setFel(r.fel ?? "Kunde inte spara.");
    });
  };

  const formular = (m?: Klubbmeddelande) => (
    <form className="form admin__panel" style={{ marginBottom: 14 }} onSubmit={spara}>
      {m && <input type="hidden" name="id" value={m.id} />}
      <div className="field field--full"><label>Rubrik</label><input name="rubrik" defaultValue={m?.rubrik} required /></div>
      <div className="field field--full"><label>Text</label><textarea name="text" defaultValue={m?.text} required style={{ minHeight: 90 }} /></div>
      <div className="field"><label>Datum</label><input type="date" name="datum" defaultValue={m?.datum ?? new Date().toISOString().slice(0, 10)} required /></div>
      <div className="field"><label className="checkfield checkfield--bare" style={{ marginTop: 26 }}><input type="checkbox" name="publicerad" defaultChecked={m?.publicerad ?? true} /><span>Publicerad för medlemmarna</span></label></div>
      {fel && <div className="notice notice--fel field--full" role="alert">{fel}</div>}
      <div className="field--full cta-row">
        <button className="btn" type="submit" disabled={pending}>{pending ? "Sparar…" : "Spara"}</button>
        <button className="btn btn--ghost" type="button" onClick={() => { setOppen(null); setFel(null); }}>Avbryt</button>
      </div>
    </form>
  );

  return (
    <>
      <h2 className="admin__h2" style={{ marginTop: 40 }}>Från herrgården</h2>
      <p className="admin__meta" style={{ marginBottom: 12 }}>Det senaste publicerade meddelandet visas på medlemmarnas översikt.</p>

      {oppen === "nytt" ? formular() : <button className="btn btn--ghost btn--sm" onClick={() => setOppen("nytt")} style={{ marginBottom: 14 }}>+ Nytt meddelande</button>}

      {!meddelanden.length && <p className="empty">Inga meddelanden än.</p>}
      {meddelanden.map((m) => (
        oppen === m.id ? <div key={m.id}>{formular(m)}</div> : (
          <article key={m.id} className="admin__panel" style={{ marginBottom: 14 }}>
            <div className="ff__head">
              <div>
                <b>{m.rubrik}</b>
                {!m.publicerad && <span className="pill pill--block" style={{ marginLeft: 8 }}>ej publicerad</span>}
                <div className="admin__meta">{m.datum}</div>
              </div>
              <div className="admin__actions">
                <button className="btn btn--sm btn--ghost" type="button" disabled={pending} onClick={() => { setOppen(m.id); setFel(null); }}>Ändra</button>
                <button className="btn btn--sm btn--ghost" type="button" disabled={pending}
                  onClick={() => {
                    if (!confirm(`Ta bort meddelandet "${m.rubrik}"?`)) return;
                    setFel(null);
                    start(async () => { const r = await taBortKlubbmeddelande(m.id); if (r.ok) router.refresh(); else setFel(r.fel ?? "Kunde inte ta bort."); });
                  }}>Ta bort</button>
              </div>
            </div>
            <p style={{ fontSize: 15, margin: "12px 0 0", whiteSpace: "pre-wrap" }}>{m.text}</p>
          </article>
        )
      ))}
    </>
  );
}
