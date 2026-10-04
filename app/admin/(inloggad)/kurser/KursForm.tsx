"use client";

import { useState, useTransition } from "react";
import { sparaKurs } from "@/app/admin/actions";

export type KursRad = {
  id: string; namn: string; datum_text: string; datum_fran: string | null; datum_till: string | null; platser: number;
  pris_dubbel: number; pris_enkel: number; earlybird_dubbel: number | null; earlybird_enkel: number | null; earlybird_till: string | null; oppen: boolean;
};

/** Redigera datum, platser och priser för en kurs. */
export default function KursForm({ k }: { k: KursRad }) {
  const [medd, setMedd] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form className="admin__panel form" onSubmit={(e) => {
      e.preventDefault(); const fd = new FormData(e.currentTarget); setMedd(null);
      start(async () => { const r = await sparaKurs(k.id, fd); setMedd(r.ok ? "Sparat — kurssidan är uppdaterad." : r.fel ?? "Kunde inte spara."); });
    }}>
      <div className="field"><label>Namn</label><input name="namn" defaultValue={k.namn} required /></div>
      <div className="field"><label>Datum som visas på sajten</label><input name="datum_text" defaultValue={k.datum_text} required placeholder="T.ex. 14–16 maj 2027" /></div>
      <div className="field"><label>Från <span className="hint">när datumet är bestämt</span></label><input type="date" name="datum_fran" defaultValue={k.datum_fran ?? ""} /></div>
      <div className="field"><label>Till</label><input type="date" name="datum_till" defaultValue={k.datum_till ?? ""} /></div>
      <div className="field"><label>Platser</label><input type="number" name="platser" min={0} defaultValue={k.platser} required /></div>
      <div className="field"><label className="checkfield checkfield--bare"><input type="checkbox" name="oppen" defaultChecked={k.oppen} /><span>Öppen för bokning</span></label></div>
      <div className="field"><label>Ordinarie, delat dubbelrum (kr/pers)</label><input type="number" name="pris_dubbel" min={0} defaultValue={k.pris_dubbel} required /></div>
      <div className="field"><label>Ordinarie, enkelrum (kr/pers)</label><input type="number" name="pris_enkel" min={0} defaultValue={k.pris_enkel} required /></div>
      <div className="field"><label>Early Bird, delat dubbelrum</label><input type="number" name="earlybird_dubbel" min={0} defaultValue={k.earlybird_dubbel ?? ""} /></div>
      <div className="field"><label>Early Bird, enkelrum</label><input type="number" name="earlybird_enkel" min={0} defaultValue={k.earlybird_enkel ?? ""} /></div>
      <div className="field"><label>Early Bird gäller t.o.m.</label><input type="date" name="earlybird_till" defaultValue={k.earlybird_till ?? ""} /></div>
      <div className="field--full cta-row">
        <button className="btn btn--sm" type="submit" disabled={pending}>{pending ? "Sparar…" : "Spara kursen"}</button>
        {medd && <span className="admin__meta" role="status">{medd}</span>}
      </div>
    </form>
  );
}
