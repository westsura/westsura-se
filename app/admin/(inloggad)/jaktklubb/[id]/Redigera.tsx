"use client";

import { useState, useTransition } from "react";
import { sparaJaktmedlem } from "@/app/admin/actions";
import type { Medlem, Niva } from "../delar";

/** Ändra kontaktuppgifter (och nivå för medlemmar). Byts e-posten flyttas inloggningen med. */
export default function Redigera({ m, nivaer }: { m: Medlem; nivaer: Niva[] }) {
  const [oppen, setOppen] = useState(false);
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!oppen) return <button className="btn btn--sm btn--ghost" type="button" onClick={() => setOppen(true)}>Redigera uppgifter</button>;

  return (
    <form className="form admin__panel" style={{ marginTop: 16 }} onSubmit={(e) => {
      e.preventDefault(); const fd = new FormData(e.currentTarget); setFel(null);
      start(async () => { const r = await sparaJaktmedlem(m.id, fd); if (r.ok) setOppen(false); else setFel(r.fel ?? "Kunde inte spara."); });
    }}>
      <div className="field"><label htmlFor="r-namn">Namn</label><input id="r-namn" name="namn" defaultValue={m.namn} required /></div>
      <div className="field"><label htmlFor="r-epost">E-post</label><input id="r-epost" name="epost" type="email" defaultValue={m.epost} required /><p className="hint">Byts adressen loggar hen in med den nya.</p></div>
      <div className="field"><label htmlFor="r-tel">Telefon</label><input id="r-tel" name="telefon" defaultValue={m.telefon ?? ""} /></div>
      <div className="field"><label htmlFor="r-ort">Ort</label><input id="r-ort" name="ort" defaultValue={m.ort ?? ""} /></div>
      <div className="field"><label htmlFor="r-hund">Hund</label><input id="r-hund" name="hund" defaultValue={m.hund ?? ""} /></div>
      {m.status === "godkand" && nivaer.length > 0 && (
        <div className="field">
          <label htmlFor="r-niva">Nivå</label>
          <select id="r-niva" name="niva_id" defaultValue={m.niva_id ?? ""}>
            {nivaer.map((n) => <option key={n.id} value={n.id}>{n.namn}</option>)}
          </select>
          <p className="hint">Avgiftsunderlaget ändras inte automatiskt — justera det under Fakturering vid behov.</p>
        </div>
      )}
      {fel && <div className="notice notice--fel field--full" role="alert">{fel}</div>}
      <div className="field--full cta-row">
        <button className="btn btn--sm" type="submit" disabled={pending}>{pending ? "Sparar…" : "Spara"}</button>
        <button className="btn btn--sm btn--ghost" type="button" onClick={() => setOppen(false)}>Avbryt</button>
      </div>
    </form>
  );
}
