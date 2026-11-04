"use client";

import { useState } from "react";
import { DELTYP, type Del } from "@/lib/arende";

export type Resurser = { enheter: { id: string; namn: string; ingar_i: string | null }[]; lokaler: { id: string; namn: string }[] };

const dagEfter = (d: string) => { const x = new Date(d + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() + 1); return x.toISOString().slice(0, 10); };

/**
 * Fälten för en del (tjänst) i en bokning: typ, datum, tid, lokaler/boenden, antal.
 * Boende anges som ankomst/avresa; övrigt som datum (och ev. sista dag).
 */
export default function DelFalt({ resurser, del, intern, standardTyp, valfritt }: { resurser: Resurser; del?: Del; intern?: boolean; standardTyp?: string; valfritt?: boolean }) {
  const [typ, setTyp] = useState(del?.typ ?? standardTyp ?? "konferens");
  const boende = typ === "boende";
  const [flerDagar, setFlerDagar] = useState(!!del && del.till !== del.fran && !boende);
  return (
    <>
      {del?.id && <input type="hidden" name="del_id" value={del.id} />}
      <div className="field"><label>Vad</label>
        <select name="del_typ" value={typ} onChange={(e) => setTyp(e.target.value)}>
          {Object.entries(DELTYP).filter(([k]) => intern ? ["intern", "aktivitet"].includes(k) : k !== "intern").map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="field"><label>{boende ? "Ankomst" : "Datum"}</label><input type="date" name="fran" defaultValue={del?.fran} required={!valfritt} /></div>
      {boende ? (
        <div className="field"><label>Avresa</label><input type="date" name="till" defaultValue={del?.fran ? dagEfter(del.till) : ""} required={!valfritt} /></div>
      ) : flerDagar ? (
        <div className="field"><label>Till och med</label><input type="date" name="till" defaultValue={del?.till} /></div>
      ) : (
        <div className="field" style={{ alignSelf: "end" }}><button type="button" className="linkbtn" onClick={() => setFlerDagar(true)}>+ Flera dagar</button></div>
      )}
      {!boende && (
        <>
          <div className="field"><label>Från kl.</label><input type="time" name="tid_fran" defaultValue={del?.tid_fran?.slice(0, 5) ?? ""} /></div>
          <div className="field"><label>Till kl.</label><input type="time" name="tid_till" defaultValue={del?.tid_till?.slice(0, 5) ?? ""} /></div>
        </>
      )}
      <div className="field"><label>Antal</label><input type="number" name="antal" min={0} defaultValue={del?.antal ?? ""} placeholder="Personer" /></div>
      {!boende && (
        <div className="field field--full"><label>Lokal</label>
          <div className="valrad">
            {resurser.lokaler.map((l) => <label key={l.id} className="checkfield"><input type="checkbox" name="lokal" value={l.id} defaultChecked={del?.lokal_ids.includes(l.id)} /><span>{l.namn}</span></label>)}
          </div>
        </div>
      )}
      {(boende || intern) && (
        <div className="field field--full"><label>Boende</label>
          <div className="valrad">
            {resurser.enheter.map((e) => <label key={e.id} className="checkfield"><input type="checkbox" name="enhet" value={e.id} defaultChecked={del?.enhet_ids.includes(e.id)} /><span>{e.ingar_i ? "↳ " : ""}{e.namn}</span></label>)}
          </div>
        </div>
      )}
      <div className="field field--full"><label>Beskrivning</label><input name="beskrivning" defaultValue={del?.beskrivning ?? ""} placeholder={boende ? "T.ex. 2 dubbelrum, sen incheckning" : "T.ex. konferens med fm-fika och lunch"} /></div>
      {intern && (
        <div className="field field--full">
          <input type="hidden" name="blockerar_finns" value="1" />
          <label className="checkfield checkfield--bare"><input type="checkbox" name="blockerar" defaultChecked={del?.blockerar ?? true} />
            <span>Blockerar valda lokaler och boenden (annars visas aktiviteten bara som information i kalendern)</span></label>
        </div>
      )}
    </>
  );
}
