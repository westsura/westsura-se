"use client";

import { useState, useTransition } from "react";
import { sparaSat, taBortSat, sparaPass, tilldelaPass, taBortPass } from "@/app/jaktledare/actions";
import type { Sat, Pass, Plats } from "@/lib/avskjutning";

type Jagare = { id: string; namn: string; jagare_id: string | null };

/** Såtar med passlista. Jägare tilldelas direkt i tabellen. */
export default function Satar({ tillfalleId, satar, platser, jagare }: { tillfalleId: string; satar: Sat[]; platser: Plats[]; jagare: Jagare[] }) {
  const [nySat, setNySat] = useState(false);
  return (
    <>
      {!satar.length && <p className="empty print-hide" style={{ marginBottom: 12 }}>Inga såtar ännu. Lägg upp dagens såtar och passen i varje.</p>}
      {satar.map((s, i) => <SatKort key={s.id} sat={s} nr={i + 1} platser={platser} jagare={jagare} />)}
      <div className="print-hide">
        {nySat
          ? <SatForm tillfalleId={tillfalleId} nastaOrdning={(satar.at(-1)?.ordning ?? 0) + 1} onKlar={() => setNySat(false)} />
          : <button className="btn btn--sm btn--ghost" type="button" onClick={() => setNySat(true)}>+ Ny såt</button>}
      </div>
    </>
  );
}

function SatKort({ sat, nr, platser, jagare }: { sat: Sat; nr: number; platser: Plats[]; jagare: Jagare[] }) {
  const [redigera, setRedigera] = useState(false);
  const [nyttPass, setNyttPass] = useState(false);
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();
  // Samma jägare kan stå på flera pass (t.ex. två i sällskap) — men vi flaggar dubbletter.
  const tilldelade = sat.pass.map((p) => p.anmalan_id).filter(Boolean);
  const otilldelade = jagare.filter((j) => !tilldelade.includes(j.id));

  return (
    <section className="admin__panel jl__sat" style={{ marginBottom: 16 }}>
      <div className="admin__head" style={{ marginBottom: 8 }}>
        <div>
          <h3 className="admin__h2" style={{ margin: 0 }}>Såt {nr}: {sat.namn}</h3>
          {sat.beskrivning && <p className="admin__meta">{sat.beskrivning}</p>}
        </div>
        <div className="admin__actions print-hide">
          <button className="btn btn--sm btn--ghost" type="button" onClick={() => setRedigera(!redigera)}>{redigera ? "Stäng" : "Redigera"}</button>
          <button className="admin__logout" type="button" disabled={pending} onClick={() => { if (confirm(`Ta bort såten ${sat.namn} med alla pass?`)) start(async () => { const r = await taBortSat(sat.id); if (!r.ok) setFel(r.fel ?? "Fel"); }); }}>Ta bort</button>
        </div>
      </div>
      {redigera && <SatForm tillfalleId={sat.tillfalle_id} sat={sat} onKlar={() => setRedigera(false)} />}
      {fel && <div className="notice notice--fel" role="alert" style={{ marginBottom: 8 }}>{fel}</div>}

      <div className="tablewrap">
        <table className="admin__table jl__pass">
          <thead><tr><th>Pass</th><th>Plats</th><th>Jägare</th><th>Anteckning</th><th className="print-hide"></th></tr></thead>
          <tbody>
            {!sat.pass.length && <tr><td colSpan={5} className="empty">Inga pass i såten.</td></tr>}
            {sat.pass.map((p) => <PassRad key={p.id} pass={p} platser={platser} jagare={jagare} otilldelade={otilldelade} />)}
          </tbody>
        </table>
      </div>
      <div className="print-hide" style={{ marginTop: 8 }}>
        {nyttPass
          ? <PassForm satId={sat.id} platser={platser} jagare={jagare} nastaNummer={String(sat.pass.length + 1)} nastaOrdning={sat.pass.length + 1} onKlar={() => setNyttPass(false)} />
          : <button className="btn btn--sm btn--ghost" type="button" onClick={() => setNyttPass(true)}>+ Lägg till pass</button>}
      </div>
      {!!otilldelade.length && !!sat.pass.length && <p className="admin__meta print-hide" style={{ marginTop: 8 }}>Utan pass i den här såten: {otilldelade.map((j) => j.namn).join(", ")}.</p>}
    </section>
  );
}

function PassRad({ pass, platser, jagare, otilldelade }: { pass: Pass; platser: Plats[]; jagare: Jagare[]; otilldelade: Jagare[] }) {
  const [redigera, setRedigera] = useState(false);
  const [pending, start] = useTransition();
  const vald = jagare.find((j) => j.id === pass.anmalan_id);
  if (redigera) return <tr><td colSpan={5}><PassForm satId={pass.sat_id} pass={pass} platser={platser} jagare={jagare} onKlar={() => setRedigera(false)} /></td></tr>;
  return (
    <tr>
      <td><b>{pass.nummer}</b></td>
      <td>{platser.find((p) => p.id === pass.plats_id)?.namn ?? <small>—</small>}</td>
      <td>
        <span className="print-only">{vald?.namn ?? "—"}</span>
        <select className="print-hide" value={pass.anmalan_id ?? ""} disabled={pending} onChange={(e) => start(async () => { const r = await tilldelaPass(pass.id, e.target.value || null); if (!r.ok) alert(r.fel); })}>
          <option value="">— ledigt —</option>
          {vald && !otilldelade.some((j) => j.id === vald.id) && <option value={vald.id}>{vald.namn}</option>}
          {otilldelade.map((j) => <option key={j.id} value={j.id}>{j.namn}</option>)}
        </select>
      </td>
      <td><small>{pass.anteckning}</small></td>
      <td className="admin__actions print-hide">
        <button className="btn btn--sm btn--ghost" type="button" onClick={() => setRedigera(true)}>Redigera</button>
        <button className="admin__logout" type="button" disabled={pending} onClick={() => { if (confirm("Ta bort passet?")) start(async () => { const r = await taBortPass(pass.id); if (!r.ok) alert(r.fel); }); }}>Ta bort</button>
      </td>
    </tr>
  );
}

function SatForm({ tillfalleId, sat, nastaOrdning, onKlar }: { tillfalleId: string; sat?: Sat; nastaOrdning?: number; onKlar: () => void }) {
  const [medd, setMedd] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form className="form" style={{ padding: 16, background: "var(--ws-paper)", marginBottom: 12 }} onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); start(async () => { const r = await sparaSat(fd); if (r.ok) onKlar(); else setMedd(r.fel ?? "Fel"); }); }}>
      <input type="hidden" name="tillfalle_id" value={tillfalleId} />
      {sat && <input type="hidden" name="id" value={sat.id} />}
      <div className="field"><label>Såtens namn</label><input name="namn" defaultValue={sat?.namn ?? ""} placeholder="Storskogen" required /></div>
      <div className="field"><label>Ordning</label><input name="ordning" type="number" defaultValue={sat?.ordning ?? nastaOrdning ?? 1} /></div>
      <div className="field field--full"><label>Beskrivning <small>samling, tider, hundar</small></label><input name="beskrivning" defaultValue={sat?.beskrivning ?? ""} placeholder="Samling vid ladan 08.30, två drivande hundar" /></div>
      <div className="field--full cta-row">
        <button className="btn btn--sm" type="submit" disabled={pending}>{pending ? "Sparar…" : sat ? "Spara" : "Lägg till såt"}</button>
        <button className="btn btn--sm btn--ghost" type="button" onClick={onKlar}>Avbryt</button>
        {medd && <span className="admin__meta">{medd}</span>}
      </div>
    </form>
  );
}

function PassForm({ satId, pass, platser, jagare, nastaNummer, nastaOrdning, onKlar }: { satId: string; pass?: Pass; platser: Plats[]; jagare: Jagare[]; nastaNummer?: string; nastaOrdning?: number; onKlar: () => void }) {
  const [medd, setMedd] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form className="form" style={{ padding: 16, background: "var(--ws-paper)" }} onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); start(async () => { const r = await sparaPass(fd); if (r.ok) onKlar(); else setMedd(r.fel ?? "Fel"); }); }}>
      <input type="hidden" name="sat_id" value={satId} />
      {pass && <input type="hidden" name="id" value={pass.id} />}
      <div className="field"><label>Passnummer</label><input name="nummer" defaultValue={pass?.nummer ?? nastaNummer ?? ""} placeholder="1" required /></div>
      <div className="field">
        <label>Plats <small>ur platsbiblioteket, för kartan</small></label>
        <select name="plats_id" defaultValue={pass?.plats_id ?? ""}>
          <option value="">— ingen —</option>
          {platser.map((p) => <option key={p.id} value={p.id}>{p.namn}</option>)}
        </select>
      </div>
      <div className="field">
        <label>Jägare</label>
        <select name="anmalan_id" defaultValue={pass?.anmalan_id ?? ""}>
          <option value="">— ledigt —</option>
          {jagare.map((j) => <option key={j.id} value={j.id}>{j.namn}</option>)}
        </select>
      </div>
      <div className="field"><label>Ordning</label><input name="ordning" type="number" defaultValue={pass?.ordning ?? nastaOrdning ?? 1} /></div>
      <div className="field field--full"><label>Anteckning <small>skjutriktning, väg dit</small></label><input name="anteckning" defaultValue={pass?.anteckning ?? ""} placeholder="Skjut bara mot söder, in i drevet är förbjudet" /></div>
      <div className="field--full cta-row">
        <button className="btn btn--sm" type="submit" disabled={pending}>{pending ? "Sparar…" : pass ? "Spara" : "Lägg till pass"}</button>
        <button className="btn btn--sm btn--ghost" type="button" onClick={onKlar}>Avbryt</button>
        {medd && <span className="admin__meta">{medd}</span>}
      </div>
    </form>
  );
}
