"use client";

import { useEffect, useState, useTransition } from "react";
import { sparaGrundpris, sparaPrissasong, taBortPrissasong, sparaPrisregel, taBortPrisregel, hamtaPrisexempel } from "@/app/admin/actions";

export type Enhet = { id: string; namn: string; grundpris: number; ingar_i: string | null; ar_hela_boendet: boolean };
export type Prissasong = { id: string; namn: string; fran: string; till: string };
export type Regel = { id: string; namn: string; enhet_id: string | null; sasong_id: string | null; veckodagar: number[] | null; datum: string | null; typ: "pris" | "procent"; varde: number; prioritet: number; aktiv: boolean };

const kr = (n: number) => n.toLocaleString("sv-SE") + " kr";
// Postgres räknar söndag = 0.
const DAGAR: [number, string][] = [[1, "Mån"], [2, "Tis"], [3, "Ons"], [4, "Tor"], [5, "Fre"], [6, "Lör"], [0, "Sön"]];

/* ---------- Grundpris ---------- */
export function Grundpris({ enheter }: { enheter: Enhet[] }) {
  return (
    <div className="tablewrap">
      <table className="admin__table">
        <thead><tr><th>Rum</th><th className="num">Pris per natt</th><th></th></tr></thead>
        <tbody>{enheter.map((e) => <GrundprisRad key={e.id} e={e} />)}</tbody>
      </table>
    </div>
  );
}

function GrundprisRad({ e }: { e: Enhet }) {
  const [v, setV] = useState(String(e.grundpris));
  const [medd, setMedd] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const andrat = Number(v) !== e.grundpris;
  return (
    <tr>
      <td><b>{e.namn}</b>{e.ingar_i && <div className="admin__meta">Del av {e.ingar_i === "f2" ? "Familjeflygel 2" : e.ingar_i}</div>}{e.ar_hela_boendet && <div className="admin__meta">Alla rum samtidigt</div>}</td>
      <td className="num"><input type="number" min={0} step={50} value={v} onChange={(x) => { setV(x.target.value); setMedd(null); }} style={{ width: 110, textAlign: "right" }} aria-label={`Grundpris ${e.namn}`} /> kr</td>
      <td>
        {andrat && <button className="btn btn--sm" type="button" disabled={pending} onClick={() => start(async () => { const r = await sparaGrundpris(e.id, Number(v)); setMedd(r.ok ? "Sparat" : r.fel ?? "Fel"); })}>{pending ? "…" : "Spara"}</button>}
        {medd && <span className="admin__meta"> {medd}</span>}
      </td>
    </tr>
  );
}

/* ---------- Säsonger ---------- */
export function SasongLista({ sasonger }: { sasonger: Prissasong[] }) {
  const [ny, setNy] = useState(false);
  return (
    <>
      {!sasonger.length && <p className="empty">Inga säsonger ännu.</p>}
      {sasonger.map((s) => <SasongRad key={s.id} s={s} />)}
      {ny ? <SasongForm onKlar={() => setNy(false)} /> : <button className="btn btn--sm btn--ghost" type="button" onClick={() => setNy(true)}>+ Ny säsong</button>}
    </>
  );
}

function SasongRad({ s }: { s: Prissasong }) {
  const [red, setRed] = useState(false);
  const [pending, start] = useTransition();
  if (red) return <SasongForm s={s} onKlar={() => setRed(false)} />;
  return (
    <div className="row" style={{ alignItems: "center" }}>
      <span className="row__main"><b>{s.namn}</b> · {s.fran} – {s.till}</span>
      <span className="admin__actions">
        <button className="btn btn--sm btn--ghost" type="button" onClick={() => setRed(true)}>Redigera</button>
        <button className="admin__logout" type="button" disabled={pending} onClick={() => { if (confirm(`Ta bort säsongen ${s.namn}? Regler som hör till den tas också bort.`)) start(async () => { const r = await taBortPrissasong(s.id); if (!r.ok) alert(r.fel); }); }}>Ta bort</button>
      </span>
    </div>
  );
}

function SasongForm({ s, onKlar }: { s?: Prissasong; onKlar: () => void }) {
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form className="form" style={{ padding: 16, background: "var(--ws-paper)", margin: "8px 0" }} onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); start(async () => { const r = await sparaPrissasong(fd); if (r.ok) onKlar(); else setFel(r.fel ?? "Fel"); }); }}>
      {s && <input type="hidden" name="id" value={s.id} />}
      <div className="field"><label>Namn</label><input name="namn" defaultValue={s?.namn ?? ""} placeholder="Högsäsong sommar" required /></div>
      <div className="field"><label>Från</label><input name="fran" type="date" defaultValue={s?.fran ?? ""} required /></div>
      <div className="field"><label>Till och med</label><input name="till" type="date" defaultValue={s?.till ?? ""} required /></div>
      {fel && <div className="notice notice--fel field--full" role="alert">{fel}</div>}
      <div className="field--full cta-row">
        <button className="btn btn--sm" type="submit" disabled={pending}>{pending ? "Sparar…" : "Spara"}</button>
        <button className="btn btn--sm btn--ghost" type="button" onClick={onKlar}>Avbryt</button>
      </div>
    </form>
  );
}

/* ---------- Prisregler ---------- */
export function Regellista({ regler, enheter, sasonger }: { regler: Regel[]; enheter: Enhet[]; sasonger: Prissasong[] }) {
  const [ny, setNy] = useState(false);
  return (
    <>
      {!regler.length && <p className="empty">Inga prisregler — alla nätter kostar grundpriset.</p>}
      {regler.map((r) => <RegelRad key={r.id} r={r} enheter={enheter} sasonger={sasonger} />)}
      {ny ? <RegelForm enheter={enheter} sasonger={sasonger} onKlar={() => setNy(false)} /> : <button className="btn btn--sm btn--ghost" type="button" onClick={() => setNy(true)}>+ Ny prisregel</button>}
    </>
  );
}

function beskriv(r: Regel, enheter: Enhet[], sasonger: Prissasong[]) {
  const delar: string[] = [];
  delar.push(r.enhet_id ? enheter.find((e) => e.id === r.enhet_id)?.namn ?? r.enhet_id : "Alla rum");
  if (r.sasong_id) delar.push(sasonger.find((s) => s.id === r.sasong_id)?.namn ?? "säsong");
  if (r.veckodagar?.length) delar.push(DAGAR.filter(([n]) => r.veckodagar!.includes(n)).map(([, t]) => t.toLowerCase()).join(", ") + "nätter");
  if (r.datum) delar.push(r.datum);
  const pris = r.typ === "pris" ? `${kr(r.varde)} per natt` : `${r.varde > 0 ? "+" : ""}${r.varde} % mot grundpris`;
  return `${delar.join(" · ")} → ${pris}`;
}

function RegelRad({ r, enheter, sasonger }: { r: Regel; enheter: Enhet[]; sasonger: Prissasong[] }) {
  const [red, setRed] = useState(false);
  const [pending, start] = useTransition();
  if (red) return <RegelForm r={r} enheter={enheter} sasonger={sasonger} onKlar={() => setRed(false)} />;
  return (
    <div className="row" style={{ alignItems: "center", opacity: r.aktiv ? 1 : 0.5 }}>
      <span className="row__main"><b>{r.namn}</b>{!r.aktiv && " (avstängd)"}<br /><small>{beskriv(r, enheter, sasonger)}</small></span>
      <span className="admin__actions">
        <button className="btn btn--sm btn--ghost" type="button" onClick={() => setRed(true)}>Redigera</button>
        <button className="admin__logout" type="button" disabled={pending} onClick={() => { if (confirm(`Ta bort regeln ${r.namn}?`)) start(async () => { const x = await taBortPrisregel(r.id); if (!x.ok) alert(x.fel); }); }}>Ta bort</button>
      </span>
    </div>
  );
}

function RegelForm({ r, enheter, sasonger, onKlar }: { r?: Regel; enheter: Enhet[]; sasonger: Prissasong[]; onKlar: () => void }) {
  const [typ, setTyp] = useState<"pris" | "procent">(r?.typ ?? "pris");
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form className="form" style={{ padding: 16, background: "var(--ws-paper)", margin: "8px 0" }} onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); setFel(null); start(async () => { const x = await sparaPrisregel(fd); if (x.ok) onKlar(); else setFel(x.fel ?? "Fel"); }); }}>
      {r && <input type="hidden" name="id" value={r.id} />}
      <div className="field field--full"><label>Namn</label><input name="namn" defaultValue={r?.namn ?? ""} placeholder="Helgpris sommar" required /></div>
      <div className="field">
        <label>Rum</label>
        <select name="enhet_id" defaultValue={r?.enhet_id ?? ""}>
          <option value="">Alla rum</option>
          {enheter.map((e) => <option key={e.id} value={e.id}>{e.namn}</option>)}
        </select>
      </div>
      <div className="field">
        <label>Säsong</label>
        <select name="sasong_id" defaultValue={r?.sasong_id ?? ""}>
          <option value="">Hela året</option>
          {sasonger.map((s) => <option key={s.id} value={s.id}>{s.namn} ({s.fran} – {s.till})</option>)}
        </select>
      </div>
      <div className="field field--full">
        <label>Nätter <span className="hint">tomt = alla veckodagar</span></label>
        <div className="admin__actions">
          {DAGAR.map(([n, t]) => (
            <label key={n} className="checkfield checkfield--bare"><input type="checkbox" name="veckodag" value={n} defaultChecked={r?.veckodagar?.includes(n) ?? false} /><span>{t}</span></label>
          ))}
        </div>
        <p className="hint">Helg = fre och lör.</p>
      </div>
      <div className="field"><label>Enskilt datum <span className="hint">valfritt, t.ex. midsommarafton</span></label><input name="datum" type="date" defaultValue={r?.datum ?? ""} /></div>
      <div className="field">
        <label>Pris</label>
        <select name="typ" value={typ} onChange={(e) => setTyp(e.target.value as "pris" | "procent")}>
          <option value="pris">Fast nattpris</option>
          <option value="procent">Procent mot grundpriset</option>
        </select>
      </div>
      <div className="field">
        <label>{typ === "pris" ? "Kronor per natt" : "Procent (t.ex. 20 eller −10)"}</label>
        <input name="varde" type="number" defaultValue={r?.varde ?? (typ === "pris" ? "" : 20)} step={typ === "pris" ? 50 : 1} required />
      </div>
      <div className="field"><label>Prioritet <span className="hint">högst vinner vid lika</span></label><input name="prioritet" type="number" defaultValue={r?.prioritet ?? 0} /></div>
      <label className="checkfield checkfield--bare"><input type="checkbox" name="aktiv" defaultChecked={r?.aktiv ?? true} /><span>Aktiv</span></label>
      {fel && <div className="notice notice--fel field--full" role="alert">{fel}</div>}
      <div className="field--full cta-row">
        <button className="btn btn--sm" type="submit" disabled={pending}>{pending ? "Sparar…" : "Spara regel"}</button>
        <button className="btn btn--sm btn--ghost" type="button" onClick={onKlar}>Avbryt</button>
      </div>
    </form>
  );
}

/* ---------- Prisexempel ---------- */
export function Prisexempel({ enheter }: { enheter: Enhet[] }) {
  const [fran, setFran] = useState(new Date().toISOString().slice(0, 10));
  const [rader, setRader] = useState<{ enhet_id: string; datum: string; pris: number }[]>([]);
  const [fel, setFel] = useState<string | null>(null);
  useEffect(() => {
    let aktiv = true;
    hamtaPrisexempel(fran).then((r) => { if (!aktiv) return; if (r.ok) { setRader(r.data); setFel(null); } else setFel(r.fel); });
    return () => { aktiv = false; };
  }, [fran]);
  const datum = [...new Set(rader.map((r) => r.datum))];
  const pris = (e: string, d: string) => rader.find((r) => r.enhet_id === e && r.datum === d)?.pris;
  const vd = (d: string) => ["sön", "mån", "tis", "ons", "tor", "fre", "lör"][new Date(d + "T12:00:00").getDay()];
  return (
    <>
      <div className="field" style={{ maxWidth: 220, marginBottom: 12 }}><label>Från</label><input type="date" value={fran} onChange={(e) => setFran(e.target.value)} /></div>
      {fel && <div className="notice notice--fel">{fel}</div>}
      <div className="tablewrap">
        <table className="admin__table">
          <thead><tr><th>Rum</th>{datum.map((d) => <th key={d} className="num">{vd(d)}<br />{d.slice(5)}</th>)}</tr></thead>
          <tbody>
            {enheter.map((e) => (
              <tr key={e.id}>
                <td><b>{e.namn}</b></td>
                {datum.map((d) => { const p = pris(e.id, d); return <td key={d} className="num" style={p !== e.grundpris ? { color: "var(--ws-gold-700)", fontWeight: 700 } : undefined}>{p != null ? p.toLocaleString("sv-SE") : "—"}</td>; })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="hint" style={{ marginTop: 8 }}>Guldmarkerade priser skiljer sig från grundpriset.</p>
    </>
  );
}
