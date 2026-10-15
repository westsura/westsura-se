"use client";

import { useState, useTransition } from "react";
import { sparaVakomrade, taBortVakomrade } from "@/app/admin/actions";
import { OMRADETYP, type Omrade } from "@/lib/vak";
import { tillSweref, tolkaKoordinat } from "@/lib/sweref";

export default function OmradeForm({ omrade, nastaOrdning }: { omrade?: Omrade; nastaOrdning?: number }) {
  const [oppen, setOppen] = useState(!omrade);
  const [medd, setMedd] = useState<string | null>(null);
  const [nord, setNord] = useState(omrade?.nord != null ? String(omrade.nord) : "");
  const [ost, setOst] = useState(omrade?.ost != null ? String(omrade.ost) : "");
  const [gps, setGps] = useState<"soker" | null>(null);
  const [gpsText, setGpsText] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (omrade && !oppen) {
    return (
      <div className="row" style={{ alignItems: "center" }}>
        <span>
          <b>{omrade.namn}</b> <small>· {OMRADETYP[omrade.typ]}{!omrade.aktiv && " · inaktivt"}</small>
          {omrade.beskrivning && <><br /><small>{omrade.beskrivning}</small></>}
          {(omrade.nord != null || omrade.ost != null) && <><br /><small>N {omrade.nord} · E {omrade.ost}</small></>}
        </span>
        <button type="button" className="btn btn--sm btn--ghost" onClick={() => setOppen(true)}>Redigera</button>
      </div>
    );
  }

  return (
    <form className="form" style={{ margin: "12px 0 20px", padding: 16, background: "var(--ws-paper)" }} onSubmit={(e) => {
      e.preventDefault(); const fd = new FormData(e.currentTarget); const f = e.currentTarget;
      start(async () => { const r = await sparaVakomrade(fd); if (r.ok) { setMedd(null); setGpsText(null); if (omrade) setOppen(false); else { f.reset(); setNord(""); setOst(""); } } else setMedd(r.fel ?? "Fel"); });
    }}>
      {omrade && <input type="hidden" name="id" value={omrade.id} />}
      {!omrade && <h3 className="admin__h2 field--full" style={{ margin: 0 }}>Ny plats</h3>}
      <div className="field"><label>Namn</label><input name="namn" defaultValue={omrade?.namn ?? ""} placeholder="Torn 4 — Kärret" required /></div>
      <div className="field">
        <label>Typ</label>
        <select name="typ" defaultValue={omrade?.typ ?? "torn"}>
          {Object.entries(OMRADETYP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="field field--full">
        <label>Position</label>
        <div className="admin__actions" style={{ flexWrap: "wrap" }}>
          <button type="button" className="btn btn--sm" disabled={gps === "soker"} onClick={() => {
            if (!("geolocation" in navigator)) { setGpsText("Webbläsaren kan inte ge position."); return; }
            setGps("soker"); setGpsText("Söker position — stå still en stund…");
            navigator.geolocation.getCurrentPosition((p) => {
              const s = tillSweref(p.coords.latitude, p.coords.longitude);
              setNord(String(Math.round(s.nord))); setOst(String(Math.round(s.ost)));
              setGps(null); setGpsText(`Position hämtad, ±${Math.round(p.coords.accuracy)} m. Spara för att lägga in den.`);
            }, (e) => { setGps(null); setGpsText(e.code === 1 ? "Tillåt platsåtkomst för sajten i telefonen och försök igen." : "Positionen kunde inte hämtas."); },
            { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 });
          }}>{gps === "soker" ? "Söker…" : "Använd min position"}</button>
          <input aria-label="Klistra in koordinat" placeholder="…eller klistra in koordinat, t.ex. 59.7633, 16.0871" style={{ flex: "1 1 280px" }}
            onChange={(e) => { const k = tolkaKoordinat(e.target.value); if (k) { setNord(String(Math.round(k.nord))); setOst(String(Math.round(k.ost))); setGpsText("Koordinaten är omräknad till SWEREF 99 TM."); } }} />
        </div>
        {gpsText && <p className="hint">{gpsText}</p>}
      </div>
      <div className="field"><label>Nord (SWEREF 99 TM)</label><input name="nord" inputMode="decimal" value={nord} onChange={(e) => setNord(e.target.value)} placeholder="6625551" /></div>
      <div className="field"><label>Öst (SWEREF 99 TM)</label><input name="ost" inputMode="decimal" value={ost} onChange={(e) => setOst(e.target.value)} placeholder="561064" /></div>
      <div className="field field--full"><label>Beskrivning <small>syns för jägaren</small></label><input name="beskrivning" defaultValue={omrade?.beskrivning ?? ""} placeholder="Högtorn mot åkerkant, bra kvällsvak på vildsvin" /></div>
      <div className="field field--full"><label>Vägbeskrivning <small>skickas i bekräftelsen</small></label><textarea name="vagbeskrivning" className="ta--xs" defaultValue={omrade?.vagbeskrivning ?? ""} /></div>
      <div className="field"><label>Ordning</label><input name="ordning" type="number" defaultValue={omrade?.ordning ?? nastaOrdning ?? 1} /></div>
      <label className="checkfield checkfield--bare"><input type="checkbox" name="aktiv" defaultChecked={omrade?.aktiv ?? true} /><span>Aktivt — går att tilldela</span></label>
      <div className="field--full cta-row">
        <button className="btn btn--sm" type="submit" disabled={pending}>{pending ? "Sparar…" : omrade ? "Spara" : "Lägg till plats"}</button>
        {omrade && <button type="button" className="btn btn--sm btn--ghost" onClick={() => setOppen(false)}>Avbryt</button>}
        {omrade && <button type="button" className="admin__logout" disabled={pending} onClick={() => { if (confirm("Ta bort området? Tidigare bokningar behåller datum men tappar området.")) start(async () => { const r = await taBortVakomrade(omrade.id); if (!r.ok) alert(r.fel); }); }}>Ta bort</button>}
        {medd && <span className="admin__meta">{medd}</span>}
      </div>
    </form>
  );
}
