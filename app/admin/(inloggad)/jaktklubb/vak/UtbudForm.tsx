"use client";

import { useState, useTransition } from "react";
import { sparaVakutbud, taBortVakutbud } from "@/app/admin/actions";
import { VAKTYP, SYNLIGHET, kr, forVak, type Omrade, type Utbud } from "@/lib/vak";

/** Ett släppt dygn: som tabellrad när det finns, som formulär för nytt. */
export default function UtbudForm({ utbud, omraden, bokade }: { utbud?: Utbud; omraden: Omrade[]; bokade: number }) {
  const [oppen, setOppen] = useState(!utbud);
  const [alla, setAlla] = useState(utbud?.synlighet === "alla");
  const [medd, setMedd] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const form = (
    <form className="form" style={{ padding: 16, background: "var(--ws-paper)" }} onSubmit={(e) => {
      e.preventDefault(); const fd = new FormData(e.currentTarget); const f = e.currentTarget;
      start(async () => { const r = await sparaVakutbud(fd); if (r.ok) { setMedd(null); if (utbud) setOppen(false); else f.reset(); } else setMedd(r.fel ?? "Fel"); });
    }}>
      {utbud && <input type="hidden" name="id" value={utbud.id} />}
      <div className="field"><label>Datum</label><input name="datum" type="date" defaultValue={utbud?.datum ?? ""} required /></div>
      <div className="field">
        <label>Jaktform</label>
        <select name="typ" defaultValue={utbud?.typ ?? "vak"}>
          <option value="vak">Vak</option><option value="pyrsch">Pyrsch</option><option value="bada">Vak eller pyrsch — jägaren väljer</option>
        </select>
      </div>
      <div className="field">
        <label>Vem får boka</label>
        <select name="synlighet" defaultValue={utbud?.synlighet ?? "medlem"} onChange={(e) => setAlla(e.target.value === "alla")}>
          <option value="medlem">Bara medlemmar</option>
          <option value="alla">Medlemmar och gäster — syns på /jakt</option>
        </select>
      </div>
      <div className="field"><label>Pris för gäst, kr</label><input name="pris" type="number" min={0} defaultValue={utbud?.pris ?? 0} disabled={!alla} /><p className="hint">{alla ? "Medlemmar betalar enligt sin nivå, inte det här priset." : "Bara vid dygn öppna för gäster."}</p></div>
      <div className="field"><label>Antal jägare</label><input name="platser" type="number" min={1} defaultValue={utbud?.platser ?? 1} /><p className="hint">Fler än en kräver lika många lediga områden.</p></div>
      <div className="field">
        <label>Område <small>valfritt</small></label>
        <select name="omrade_id" defaultValue={utbud?.omrade_id ?? ""}>
          <option value="">Tilldelas vid bekräftelse</option>
          {omraden.filter((o) => o.aktiv && forVak(o)).map((o) => <option key={o.id} value={o.id}>{o.namn}</option>)}
        </select>
      </div>
      <div className="field field--full"><label>Beskrivning <small>syns för jägaren</small></label><input name="beskrivning" defaultValue={utbud?.beskrivning ?? ""} placeholder="Kvällsvak på vildsvin, ett torn" /></div>
      <label className="checkfield checkfield--bare"><input type="checkbox" name="publicerad" defaultChecked={utbud?.publicerad ?? true} /><span>Släppt — går att boka</span></label>
      <div className="field--full cta-row">
        <button className="btn btn--sm" type="submit" disabled={pending}>{pending ? "Sparar…" : utbud ? "Spara" : "Släpp dygnet"}</button>
        {utbud && <button type="button" className="btn btn--sm btn--ghost" onClick={() => setOppen(false)}>Avbryt</button>}
        {medd && <span className="admin__meta">{medd}</span>}
      </div>
    </form>
  );

  if (!utbud) return <div className="admin__panel"><h3 className="admin__h2">Släpp ett dygn</h3>{form}</div>;
  if (oppen) return <tr><td colSpan={8}>{form}</td></tr>;

  return (
    <tr>
      <td><b>{utbud.datum}</b></td>
      <td>{VAKTYP[utbud.typ]}{utbud.beskrivning && <><br /><small>{utbud.beskrivning}</small></>}</td>
      <td>{SYNLIGHET[utbud.synlighet]}</td>
      <td>{omraden.find((o) => o.id === utbud.omrade_id)?.namn ?? <small>tilldelas</small>}</td>
      <td className="num">{utbud.synlighet === "alla" ? kr(utbud.pris) : <small>—</small>}</td>
      <td className="num">{bokade} av {utbud.platser}</td>
      <td>{utbud.publicerad ? "Ja" : <small>dold</small>}</td>
      <td className="admin__actions">
        <button className="btn btn--sm btn--ghost" onClick={() => setOppen(true)}>Redigera</button>
        {!bokade && <button className="admin__logout" disabled={pending} onClick={() => { if (confirm("Ta bort dygnet?")) start(async () => { const r = await taBortVakutbud(utbud.id); if (!r.ok) alert(r.fel); }); }}>Ta bort</button>}
      </td>
    </tr>
  );
}
