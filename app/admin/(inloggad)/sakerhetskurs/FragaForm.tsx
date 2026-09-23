"use client";

import { useState, useTransition } from "react";
import { sparaKursfraga, taBortKursfraga } from "@/app/admin/actions";
import type { Avsnitt, Fraga } from "./delar";

export default function FragaForm({ fraga, avsnitt, nastaOrdning }: { fraga?: Fraga; avsnitt: Avsnitt[]; nastaOrdning?: number }) {
  const [oppen, setOppen] = useState(!fraga);
  const [medd, setMedd] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (fraga && !oppen) {
    return (
      <div className="row" style={{ alignItems: "center" }}>
        <span>
          {fraga.kritisk && <span className="pill pill--avbokad" style={{ marginRight: 8, borderColor: "#a33", color: "#a33" }}>Kritisk</span>}
          {fraga.fraga}{!fraga.publicerad && <small> · dold</small>}
          <br /><small>Rätt: {fraga.alternativ[fraga.ratt]}</small>
        </span>
        <button type="button" className="btn btn--sm btn--ghost" onClick={() => setOppen(true)}>Redigera</button>
      </div>
    );
  }

  return (
    <form className="form" style={{ margin: "12px 0 20px", padding: 16, background: "var(--ws-paper)" }} onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); start(async () => { const r = await sparaKursfraga(fd); if (r.ok) { setMedd("Sparat."); if (fraga) setOppen(false); else (e.target as HTMLFormElement).reset(); } else setMedd(r.fel ?? "Fel"); }); }}>
      {fraga && <input type="hidden" name="id" value={fraga.id} />}
      <div className="field field--full"><label>Fråga</label><input name="fraga" defaultValue={fraga?.fraga ?? ""} required /></div>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="field">
          <label style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Alternativ {i + 1}</span>
            <span><input type="radio" name="ratt" value={i} defaultChecked={(fraga?.ratt ?? 0) === i} /> rätt</span>
          </label>
          <input name={`alt${i}`} defaultValue={fraga?.alternativ[i] ?? ""} required={i < 2} />
        </div>
      ))}
      <div className="field field--full"><label>Förklaring (visas efter provet)</label><input name="forklaring" defaultValue={fraga?.forklaring ?? ""} /></div>
      <div className="field">
        <label>Avsnitt</label>
        <select name="avsnitt_id" defaultValue={fraga?.avsnitt_id ?? ""}>
          <option value="">— inget —</option>
          {avsnitt.map((a) => <option key={a.id} value={a.id}>{a.ordning}. {a.rubrik}</option>)}
        </select>
      </div>
      <div className="field"><label>Ordning</label><input name="ordning" type="number" defaultValue={fraga?.ordning ?? nastaOrdning ?? 1} /></div>
      <label className="checkfield checkfield--bare"><input type="checkbox" name="kritisk" defaultChecked={fraga?.kritisk ?? false} /><span>Säkerhetskritisk — fel ger underkänt</span></label>
      <label className="checkfield checkfield--bare"><input type="checkbox" name="publicerad" defaultChecked={fraga?.publicerad ?? true} /><span>Med i provet</span></label>
      <div className="field--full cta-row">
        <button className="btn btn--sm" type="submit" disabled={pending}>{pending ? "Sparar…" : fraga ? "Spara" : "Lägg till fråga"}</button>
        {fraga && <button type="button" className="btn btn--sm btn--ghost" onClick={() => setOppen(false)}>Avbryt</button>}
        {fraga && <button type="button" className="admin__logout" onClick={() => { if (confirm("Ta bort frågan?")) start(async () => { await taBortKursfraga(fraga.id); }); }}>Ta bort</button>}
        {medd && <span className="admin__meta">{medd}</span>}
      </div>
    </form>
  );
}
