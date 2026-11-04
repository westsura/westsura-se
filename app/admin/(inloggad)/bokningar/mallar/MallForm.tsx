"use client";

import { useState, useTransition } from "react";
import { sparaMejlmall } from "@/app/admin/arenden";
import { SYFTE, type Mejlmall } from "@/lib/arendemejl";
import { ARENDETYP } from "@/lib/arende";

export default function MallForm({ m }: { m: Mejlmall }) {
  const [oppen, setOppen] = useState(false);
  const [fel, setFel] = useState<string | null>(null);
  const [sparat, setSparat] = useState(false);
  const [pending, start] = useTransition();
  return (
    <article className="admin__panel" style={{ marginBottom: 14 }}>
      <div className="ff__head">
        <div><b>{m.namn}</b><div className="admin__meta">{SYFTE[m.syfte]}{m.typ ? ` · främst för ${ARENDETYP[m.typ]?.toLowerCase()}` : " · alla typer"} · ämne: {m.amne}</div></div>
        <button className="btn btn--sm btn--ghost" onClick={() => { setOppen(!oppen); setSparat(false); }}>{oppen ? "Stäng" : "Ändra"}</button>
      </div>
      {oppen && (
        <form className="form" style={{ marginTop: 12 }} onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          setFel(null); setSparat(false);
          start(async () => { const r = await sparaMejlmall(m.id, fd); if (r.ok) setSparat(true); else setFel(r.fel ?? "Kunde inte spara."); });
        }}>
          <div className="field"><label>Namn i listan</label><input name="namn" defaultValue={m.namn} required /></div>
          <div className="field"><label>Ämnesrad</label><input name="amne" defaultValue={m.amne} required /></div>
          <div className="field field--full"><label>Rubrik i mejlet</label><input name="rubrik" defaultValue={m.rubrik} required /></div>
          <div className="field field--full"><label>Text</label><textarea name="text" defaultValue={m.text} style={{ minHeight: 260 }} required /></div>
          {fel && <div className="notice notice--fel field--full" role="alert">{fel}</div>}
          {sparat && <div className="notice field--full">Mallen är sparad. Nya mejl använder den direkt — redan skickade mejl påverkas inte.</div>}
          <div className="field--full cta-row"><button className="btn btn--sm" type="submit" disabled={pending}>{pending ? "Sparar…" : "Spara mallen"}</button></div>
        </form>
      )}
    </article>
  );
}
