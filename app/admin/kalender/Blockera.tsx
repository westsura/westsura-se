"use client";

import { useState, useTransition } from "react";
import { skapaBlockering, taBortBlockering } from "@/app/admin/actions";

export default function Blockera({ enheter, blockeringar }: { enheter: { id: string; namn: string }[]; blockeringar: { id: string; enhet: string; fran: string; till: string; orsak: string | null }[] }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <button className="btn btn--ghost btn--sm" onClick={() => setOpen(!open)}>{open ? "Stäng" : "+ Blockera datum"}</button>
        {blockeringar.map((b) => (
          <span key={b.id} className="pill pill--block" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
            {b.enhet} {b.fran}–{b.till}{b.orsak ? ` · ${b.orsak}` : ""}
            <button style={{ background: "none", border: 0, cursor: "pointer", color: "inherit", fontWeight: 700 }} title="Ta bort" disabled={pending} onClick={() => start(async () => { await taBortBlockering(b.id); })}>×</button>
          </span>
        ))}
      </div>
      {open && (
        <form className="form admin__panel" style={{ marginTop: 14 }} onSubmit={(e) => { e.preventDefault(); const f = e.currentTarget; const fd = new FormData(f); const valda = Array.from(f.querySelectorAll<HTMLInputElement>("input[name=enhet]:checked")).map((i) => i.value); fd.set("enheter", valda.join(",")); start(async () => { await skapaBlockering(fd); setOpen(false); }); }}>
          <div className="field"><label>Från</label><input type="date" name="fran" required /></div>
          <div className="field"><label>Till (utcheckning)</label><input type="date" name="till" required /></div>
          <div className="field field--full"><label>Enheter</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {enheter.map((e) => <label key={e.id} className="checkfield" style={{ height: 40, fontSize: 14 }}><input type="checkbox" name="enhet" value={e.id} /><span>{e.namn}</span></label>)}
            </div>
          </div>
          <div className="field field--full"><label>Orsak</label><input name="orsak" placeholder="Bröllop, underhåll, privat…" /></div>
          <div className="field--full cta-row"><button className="btn" type="submit" disabled={pending}>Blockera</button></div>
        </form>
      )}
    </div>
  );
}
