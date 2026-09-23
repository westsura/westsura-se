"use client";

import { useState, useTransition } from "react";
import { aktiveraSasong, taBortSasong, sparaNiva, taBortNiva, kopieraNivaer } from "@/app/admin/actions";
import { kr } from "@/lib/faktura";
import SasongForm from "./SasongForm";
import type { SasongRad, NivaRad } from "./delar";

export default function SasongKort({ sasong, nivaer, tagna, andraSasonger }: { sasong: SasongRad; nivaer: NivaRad[]; tagna: Record<string, number>; andraSasonger: SasongRad[] }) {
  const [redigera, setRedigera] = useState(false);
  const [nyNiva, setNyNiva] = useState(false);
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const kor = (fn: () => Promise<{ ok: boolean; fel?: string }>) => start(async () => { setFel(null); const r = await fn(); if (!r.ok) setFel(r.fel ?? "Fel"); });

  return (
    <section className="admin__panel" style={{ marginBottom: 24, borderTop: sasong.aktiv ? "3px solid var(--accent)" : undefined }}>
      <div className="admin__head" style={{ marginBottom: 12 }}>
        <div>
          <h2 className="admin__h2" style={{ margin: 0 }}>Säsong {sasong.namn} {sasong.aktiv && <span className="pill pill--bekraftad" style={{ marginLeft: 8 }}>Aktiv</span>}</h2>
          <p className="admin__meta">{sasong.fran} – {sasong.till} · moms {sasong.moms} %</p>
        </div>
        <div className="admin__actions">
          {!sasong.aktiv && <button className="btn btn--sm" disabled={pending} onClick={() => { if (confirm(`Göra ${sasong.namn} till aktiv säsong? Den syns då på sajten och nya ansökningar hamnar där.`)) kor(() => aktiveraSasong(sasong.id)); }}>Aktivera</button>}
          <button className="btn btn--sm btn--ghost" onClick={() => setRedigera(!redigera)}>{redigera ? "Stäng" : "Redigera"}</button>
          {!sasong.aktiv && <button className="admin__logout" disabled={pending} onClick={() => { if (confirm("Ta bort säsongen och dess nivåer?")) kor(() => taBortSasong(sasong.id)); }}>Ta bort</button>}
        </div>
      </div>
      {fel && <div className="notice notice--fel" role="alert" style={{ marginBottom: 12 }}>{fel}</div>}
      {redigera && <div style={{ padding: 16, background: "var(--ws-paper)", marginBottom: 16 }}><SasongForm sasong={sasong} onKlar={() => setRedigera(false)} /></div>}

      <div className="tablewrap">
        <table className="admin__table">
          <thead><tr><th>Nivå</th><th className="num">Avgift</th><th className="num">Platser</th><th>Bokning öppnar</th><th></th></tr></thead>
          <tbody>
            {!nivaer.length && <tr><td colSpan={5} className="empty">Inga nivåer ännu.</td></tr>}
            {nivaer.map((n) => <NivaRad key={n.id} niva={n} tagna={tagna[n.id] ?? 0} />)}
          </tbody>
        </table>
      </div>
      <div className="admin__actions" style={{ marginTop: 12 }}>
        <button className="btn btn--sm btn--ghost" onClick={() => setNyNiva(!nyNiva)}>{nyNiva ? "Avbryt" : "+ Ny nivå"}</button>
        {!nivaer.length && andraSasonger.map((a) => (
          <button key={a.id} className="btn btn--sm btn--ghost" disabled={pending} onClick={() => kor(() => kopieraNivaer(a.id, sasong.id))}>Kopiera nivåer från {a.namn}</button>
        ))}
      </div>
      {nyNiva && <NivaForm sasongId={sasong.id} nastaOrdning={(nivaer.at(-1)?.ordning ?? 0) + 1} onKlar={() => setNyNiva(false)} />}
    </section>
  );
}

function NivaRad({ niva, tagna }: { niva: NivaRad; tagna: number }) {
  const [redigera, setRedigera] = useState(false);
  const [pending, start] = useTransition();
  if (redigera) return <tr><td colSpan={5}><NivaForm sasongId={niva.sasong_id} niva={niva} onKlar={() => setRedigera(false)} /></td></tr>;
  return (
    <tr>
      <td><b>{niva.namn}</b>{niva.beskrivning && <><br /><small>{niva.beskrivning}</small></>}</td>
      <td className="num">{kr(niva.avgift)}</td>
      <td className="num">{tagna} av {niva.platser}</td>
      <td>{niva.bokning_oppnar ?? <small>—</small>}</td>
      <td className="admin__actions">
        <button className="btn btn--sm btn--ghost" onClick={() => setRedigera(true)}>Redigera</button>
        {!tagna && <button className="admin__logout" disabled={pending} onClick={() => { if (confirm("Ta bort nivån?")) start(async () => { const r = await taBortNiva(niva.id); if (!r.ok) alert(r.fel); }); }}>Ta bort</button>}
      </td>
    </tr>
  );
}

function NivaForm({ sasongId, niva, nastaOrdning, onKlar }: { sasongId: string; niva?: NivaRad; nastaOrdning?: number; onKlar: () => void }) {
  const [medd, setMedd] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form className="form" style={{ padding: 16, background: "var(--ws-paper)", marginTop: 12 }} onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); start(async () => { const r = await sparaNiva(fd); if (r.ok) onKlar(); else setMedd(r.fel ?? "Fel"); }); }}>
      <input type="hidden" name="sasong_id" value={sasongId} />
      {niva && <input type="hidden" name="id" value={niva.id} />}
      <div className="field"><label>Namn</label><input name="namn" defaultValue={niva?.namn ?? ""} placeholder="Kärnmedlem" required /></div>
      <div className="field"><label>Årsavgift, kr inkl. moms</label><input name="avgift" type="number" min={0} defaultValue={niva?.avgift ?? 0} /></div>
      <div className="field"><label>Antal platser</label><input name="platser" type="number" min={0} defaultValue={niva?.platser ?? 10} /></div>
      <div className="field"><label>Bokning öppnar</label><input name="bokning_oppnar" type="date" defaultValue={niva?.bokning_oppnar ?? ""} /><p className="hint">Datum då nivån får boka säsongens jaktdagar. Tomt = direkt.</p></div>
      <div className="field"><label>Ordning</label><input name="ordning" type="number" defaultValue={niva?.ordning ?? nastaOrdning ?? 1} /></div>
      <div className="field field--full"><label>Beskrivning (syns på sajten)</label><textarea name="beskrivning" className="ta--xs" defaultValue={niva?.beskrivning ?? ""} /></div>
      <div className="field--full cta-row">
        <button className="btn btn--sm" type="submit" disabled={pending}>{pending ? "Sparar…" : niva ? "Spara" : "Lägg till nivå"}</button>
        <button type="button" className="btn btn--sm btn--ghost" onClick={onKlar}>Avbryt</button>
        {medd && <span className="admin__meta">{medd}</span>}
      </div>
    </form>
  );
}
