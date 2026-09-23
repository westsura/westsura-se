"use client";

import { useState, useTransition } from "react";
import { sparaKursavsnitt, taBortKursavsnitt } from "@/app/admin/actions";
import type { Avsnitt } from "./delar";

export default function AvsnittForm({ avsnitt, nastaOrdning }: { avsnitt?: Avsnitt; nastaOrdning?: number }) {
  const [oppen, setOppen] = useState(!avsnitt);
  const [medd, setMedd] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (avsnitt && !oppen) {
    return (
      <div className="row" style={{ alignItems: "center" }}>
        <span><b>{avsnitt.ordning}. {avsnitt.rubrik}</b>{!avsnitt.publicerad && <small> · dold</small>}<br /><small>{avsnitt.text.slice(0, 120)}…</small></span>
        <button type="button" className="btn btn--sm btn--ghost" onClick={() => setOppen(true)}>Redigera</button>
      </div>
    );
  }

  return (
    <form className="form" style={{ margin: "12px 0 20px", padding: 16, background: "var(--ws-paper)" }} onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); start(async () => { const r = await sparaKursavsnitt(fd); if (r.ok) { setMedd("Sparat."); if (avsnitt) setOppen(false); else (e.target as HTMLFormElement).reset(); } else setMedd(r.fel ?? "Fel"); }); }}>
      {avsnitt && <input type="hidden" name="id" value={avsnitt.id} />}
      <div className="field"><label>Rubrik</label><input name="rubrik" defaultValue={avsnitt?.rubrik ?? ""} required /></div>
      <div className="field"><label>Ordning</label><input name="ordning" type="number" defaultValue={avsnitt?.ordning ?? nastaOrdning ?? 1} /></div>
      <div className="field field--full"><label>Text</label><textarea name="text" className="ta--m" defaultValue={avsnitt?.text ?? ""} required /></div>
      <label className="checkfield checkfield--bare"><input type="checkbox" name="publicerad" defaultChecked={avsnitt?.publicerad ?? true} /><span>Synlig för medlemmar</span></label>
      <div className="field--full cta-row">
        <button className="btn btn--sm" type="submit" disabled={pending}>{pending ? "Sparar…" : avsnitt ? "Spara" : "Lägg till avsnitt"}</button>
        {avsnitt && <button type="button" className="btn btn--sm btn--ghost" onClick={() => setOppen(false)}>Avbryt</button>}
        {avsnitt && <button type="button" className="admin__logout" onClick={() => { if (confirm("Ta bort avsnittet? Frågorna under det blir kvar utan avsnitt.")) start(async () => { await taBortKursavsnitt(avsnitt.id); }); }}>Ta bort</button>}
        {medd && <span className="admin__meta">{medd}</span>}
      </div>
    </form>
  );
}
