"use client";

import { useState, useTransition } from "react";
import { skapaManuellBokning } from "@/app/admin/actions";

export default function ManuellBokning({ enheter }: { enheter: { id: string; namn: string }[] }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (!open) return <p style={{ marginBottom: 20 }}><button className="btn btn--ghost btn--sm" onClick={() => setOpen(true)}>+ Lägg in bokning (telefon)</button></p>;
  return (
    <div className="admin__panel" style={{ marginBottom: 24 }}>
      <h2 className="admin__h2">Ny bokning</h2>
      <form className="form" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); const valda = Array.from(e.currentTarget.querySelectorAll<HTMLInputElement>("input[name=enhet]:checked")).map((i) => i.value); fd.set("enheter", valda.join(",")); setMsg(null); start(async () => { const r = await skapaManuellBokning(fd); setMsg(r.ok ? `Bokning ${r.nummer} inlagd och bekräftad.` : r.fel || "Fel"); if (r.ok) setOpen(false); }); }}>
        <div className="field"><label>Ankomst</label><input type="date" name="ankomst" required /></div>
        <div className="field"><label>Avresa</label><input type="date" name="avresa" required /></div>
        <div className="field field--full"><label>Enheter</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {enheter.map((e) => <label key={e.id} className="checkfield" style={{ height: 40, fontSize: 14 }}><input type="checkbox" name="enhet" value={e.id} /><span>{e.namn}</span></label>)}
          </div>
        </div>
        <div className="field"><label>Namn</label><input name="namn" required /></div>
        <div className="field"><label>Telefon</label><input name="telefon" /></div>
        <div className="field"><label>E-post</label><input name="epost" type="email" /></div>
        <div className="field"><label>Personer</label><input name="personer" type="number" defaultValue={2} min={1} /></div>
        <div className="field"><label>Hundar</label><input name="hundar" type="number" defaultValue={0} min={0} /></div>
        <div className="field"><label className="checkfield checkfield--bare" style={{ marginTop: 26 }}><input type="checkbox" name="frukost" /><span>Frukostkorg</span></label></div>
        <div className="field field--full"><label>Anteckning</label><textarea name="meddelande" style={{ minHeight: 70 }} /></div>
        {msg && <div className="notice field--full">{msg}</div>}
        <div className="field--full cta-row">
          <button className="btn" type="submit" disabled={pending}>{pending ? "Sparar…" : "Lägg in bokning"}</button>
          <button className="btn btn--ghost" type="button" onClick={() => setOpen(false)}>Avbryt</button>
        </div>
      </form>
    </div>
  );
}
