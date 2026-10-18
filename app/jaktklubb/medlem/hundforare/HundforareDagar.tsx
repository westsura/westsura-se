"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { anmalHundforare, aterkallaHundforare } from "@/app/jaktklubb/actions";
import { MANAD, VECKODAG } from "../delar";

export type Dag = {
  id: string; titel: string; beskrivning: string | null; datum: string; tid: string | null; samling: string | null;
  anmalan: { id: string; tillfalle_id: string; status: string; hund_ids: string[]; meddelande: string | null } | null;
};
type Hund = { id: string; namn: string; ras: string | null };

const STATUS: Record<string, string> = { intresse: "● Intresse anmält — väntar på besked", godkand: "● Du är med som hundförare", avbojd: "● Inte denna gång" };

export default function HundforareDagar({ dagar, hundar }: { dagar: Dag[]; hundar: Hund[] }) {
  const [oppen, setOppen] = useState<string | null>(null);
  const [valda, setValda] = useState<string[]>(hundar.length === 1 ? [hundar[0].id] : []);
  const [medd, setMedd] = useState("");
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  if (!dagar.length) return <section className="jk-kort jk-kort--ljus jk-kort--bred"><p className="jk-lede mb-0">Inga jaktdagar är utlagda just nu. Vi hör av oss när nästa datum är satt.</p></section>;

  return (
    <div className="jk-boka__lista">
      {dagar.map((d) => {
        const dt = new Date(d.datum + "T12:00:00");
        const ar = oppen === d.id;
        return (
          <div key={d.id} className="jk-kort jk-kort--ljus jk-kort--bred" style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <span className="jk-jaktrad__datum"><b>{dt.getDate()}</b><span>{MANAD[dt.getMonth()].slice(0, 3)}</span></span>
              <div style={{ flex: 1 }}>
                <p className="jk-kort__rubrik jk-kort__rubrik--mork" style={{ margin: 0 }}>{d.titel}</p>
                <p className="jk-hjalp" style={{ margin: "2px 0 6px" }}>{VECKODAG[dt.getDay()].replace(/^./, (c) => c.toUpperCase())} {dt.getDate()} {MANAD[dt.getMonth()]}{d.tid ? ` · ${d.tid}` : ""}{d.samling ? ` · ${d.samling}` : ""}</p>
                {d.beskrivning && <p className="jk-lede" style={{ fontSize: 15 }}>{d.beskrivning}</p>}
                {d.anmalan && <p className="jk-status jk-status--mork" style={{ margin: "4px 0" }}>{STATUS[d.anmalan.status] ?? d.anmalan.status}{d.anmalan.hund_ids.length ? ` · ${hundar.filter((h) => d.anmalan!.hund_ids.includes(h.id)).map((h) => h.namn).join(", ")}` : ""}</p>}
              </div>
            </div>

            {!ar && (
              <div className="cta-row" style={{ marginTop: 10 }}>
                {(!d.anmalan || d.anmalan.status === "avbojd") && <button type="button" className="btn btn--sm" disabled={!hundar.length} onClick={() => { setOppen(d.id); setFel(null); setMedd(""); }}>Anmäl intresse</button>}
                {d.anmalan && d.anmalan.status !== "avbojd" && <>
                  <button type="button" className="btn btn--sm btn--ghost" onClick={() => { setOppen(d.id); setValda(d.anmalan!.hund_ids); setMedd(d.anmalan!.meddelande ?? ""); setFel(null); }}>Ändra hundar</button>
                  <button type="button" className="btn btn--sm btn--ghost" disabled={pending} onClick={() => {
                    if (!confirm(d.anmalan!.status === "godkand" ? "Du är godkänd för dagen. Vill du ändå lämna återbud? Hör gärna också av dig till jaktledaren." : "Dra tillbaka ditt intresse?")) return;
                    start(async () => { const r = await aterkallaHundforare(d.anmalan!.id); if (!r.ok) alert(r.fel); else router.refresh(); });
                  }}>{d.anmalan.status === "godkand" ? "Lämna återbud" : "Dra tillbaka"}</button>
                </>}
              </div>
            )}

            {ar && (
              <form className="form form--1" style={{ marginTop: 12 }} onSubmit={(e) => {
                e.preventDefault(); setFel(null);
                start(async () => { const r = await anmalHundforare(d.id, valda, medd); if (!r.ok) setFel(r.fel ?? "Kunde inte skicka."); else { setOppen(null); router.refresh(); } });
              }}>
                <div className="field">
                  <span className="field-label">Vilka hundar vill du ha med?</span>
                  {hundar.map((h) => (
                    <label key={h.id} className="checkfield">
                      <input type="checkbox" checked={valda.includes(h.id)} onChange={(e) => setValda(e.target.checked ? [...valda, h.id] : valda.filter((x) => x !== h.id))} />
                      <span>{h.namn}{h.ras ? `, ${h.ras}` : ""}</span>
                    </label>
                  ))}
                </div>
                <div className="field"><label htmlFor={`m-${d.id}`}>Meddelande till jaktledaren</label>
                  <input id={`m-${d.id}`} value={medd} onChange={(e) => setMedd(e.target.value)} placeholder="Valfritt — t.ex. kan komma från kl. 8" /></div>
                {fel && <p className="notice notice--fel" role="alert">{fel}</p>}
                <div className="cta-row">
                  <button className="btn btn--sm" type="submit" disabled={pending || !valda.length}>{pending ? "Skickar…" : "Skicka intresseanmälan"}</button>
                  <button className="btn btn--sm btn--ghost" type="button" onClick={() => setOppen(null)}>Avbryt</button>
                </div>
              </form>
            )}
          </div>
        );
      })}
    </div>
  );
}
