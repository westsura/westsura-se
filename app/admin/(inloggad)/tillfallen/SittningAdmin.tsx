"use client";

import { useState, useTransition } from "react";
import { sparaSittning, taBortSittning } from "@/app/admin/actions";

export type SittningRad = { id: string; datum: string; tid: string | null; platser: number; pris: number | null; tagna: number };

/** Sittningar för ett evenemang: dag, tid, platser och ev. avvikande pris. */
export default function SittningAdmin({ tillfalleId, pris, sittningar }: { tillfalleId: string; pris: number | null; sittningar: SittningRad[] }) {
  const [redigera, setRedigera] = useState<string | null>(null);
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const form = (s?: SittningRad) => (
    <form className="admin__actions" style={{ flexWrap: "wrap", margin: "6px 0" }} onSubmit={(e) => {
      e.preventDefault(); const fd = new FormData(e.currentTarget); setFel(null);
      start(async () => { const r = await sparaSittning(tillfalleId, fd); if (r.ok) { setRedigera(null); (e.target as HTMLFormElement).reset(); } else setFel(r.fel ?? "Kunde inte spara."); });
    }}>
      {s && <input type="hidden" name="id" value={s.id} />}
      <input type="date" name="datum" defaultValue={s?.datum} required aria-label="Datum" />
      <input name="tid" defaultValue={s?.tid ?? ""} placeholder="Tid, t.ex. 11.30" aria-label="Tid" style={{ width: 130 }} />
      <input type="number" name="platser" min={0} defaultValue={s?.platser ?? 30} required aria-label="Platser" title="Platser" style={{ width: 90 }} />
      <input type="number" name="pris" min={0} defaultValue={s?.pris ?? ""} placeholder={pris != null ? `Pris ${pris} kr` : "Pris"} aria-label="Avvikande pris" title="Lämna tomt för evenemangets pris" style={{ width: 130 }} />
      <button className="btn btn--sm" type="submit" disabled={pending}>{s ? "Spara" : "+ Lägg till sittning"}</button>
      {s && <button className="btn btn--sm btn--ghost" type="button" onClick={() => setRedigera(null)}>Avbryt</button>}
    </form>
  );

  return (
    <div style={{ marginTop: 12 }}>
      <p className="label" style={{ marginBottom: 6 }}>Sittningar</p>
      {!sittningar.length && <p className="admin__meta">Inga sittningar — evenemanget har ett datum och {pris != null ? "ett pris" : "inget pris"}. Lägg till sittningar för flera tider eller dagar.</p>}
      {sittningar.map((s) => redigera === s.id ? <div key={s.id}>{form(s)}</div> : (
        <div key={s.id} className="admin__actions" style={{ margin: "4px 0" }}>
          <span style={{ minWidth: 220 }}><b>{new Date(s.datum + "T12:00:00").toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" })}</b>{s.tid ? ` · ${s.tid}` : ""}</span>
          <span className="admin__meta" style={{ minWidth: 160 }}>{s.tagna} av {s.platser} platser{s.pris != null ? ` · ${s.pris} kr` : ""}</span>
          <button className="btn btn--sm btn--ghost" type="button" onClick={() => setRedigera(s.id)}>Ändra</button>
          <button className="admin__logout" type="button" disabled={pending} onClick={() => {
            if (!confirm("Ta bort sittningen?")) return;
            setFel(null); start(async () => { const r = await taBortSittning(s.id); if (!r.ok) setFel(r.fel ?? "Kunde inte ta bort."); });
          }}>Ta bort</button>
        </div>
      ))}
      {redigera === null && form()}
      {fel && <p className="notice notice--fel" role="alert">{fel}</p>}
    </div>
  );
}
