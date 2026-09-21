"use client";

import { useState, useTransition } from "react";
import { sparaTillfalle } from "@/app/admin/actions";

type T = { id: string; typ: string; titel: string; beskrivning: string | null; datum: string; tid: string | null; platser: number; pris: number | null; publicerad: boolean; synlighet?: string; samling?: string | null; program?: string | null };

export default function TillfalleForm({ tillfalle }: { tillfalle?: T }) {
  const [open, setOpen] = useState(false);
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (!open) return <button className="btn btn--ghost btn--sm" onClick={() => setOpen(true)} style={{ marginBottom: tillfalle ? 0 : 20 }}>{tillfalle ? "Ändra" : "+ Nytt tillfälle"}</button>;
  return (
    <form className="form admin__panel" style={{ marginBottom: 20, gridColumn: "1 / -1", width: "100%" }} onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); setFel(null); start(async () => { const r = await sparaTillfalle(fd); if (r.ok) setOpen(false); else setFel(r.fel ?? "Kunde inte spara tillfället."); }); }}>
      {tillfalle && <input type="hidden" name="id" value={tillfalle.id} />}
      <div className="field"><label>Typ</label>
        <select name="typ" defaultValue={tillfalle?.typ ?? "jakt"}><option value="jakt">Jakt</option><option value="hundtraning">Hundträning</option><option value="jaktkurs">Jaktkurs</option><option value="evenemang">Evenemang</option></select></div>
      <div className="field"><label>Titel</label><input name="titel" defaultValue={tillfalle?.titel} required /></div>
      <div className="field"><label>Datum</label><input type="date" name="datum" defaultValue={tillfalle?.datum} required /></div>
      <div className="field"><label>Tid</label><input name="tid" defaultValue={tillfalle?.tid ?? ""} placeholder="09.00–15.00" /></div>
      <div className="field"><label>Platser</label><input type="number" name="platser" defaultValue={tillfalle?.platser ?? 6} min={0} required /></div>
      <div className="field"><label>Pris (kr)</label><input type="number" name="pris" defaultValue={tillfalle?.pris ?? ""} min={0} /></div>
      <div className="field"><label>Synlighet</label>
        <select name="synlighet" defaultValue={tillfalle?.synlighet ?? "publik"}><option value="publik">Publik — syns på sajten</option><option value="medlem">Bara medlemmar — jaktklubben</option></select></div>
      <div className="field"><label>Samling</label><input name="samling" defaultValue={tillfalle?.samling ?? ""} placeholder="Samling vid herrgården" /></div>
      <div className="field field--full"><label>Beskrivning</label><textarea name="beskrivning" defaultValue={tillfalle?.beskrivning ?? ""} style={{ minHeight: 80 }} /></div>
      <div className="field field--full"><label>Program <span className="hint">en rad per punkt</span></label>
        <textarea name="program" defaultValue={tillfalle?.program ?? ""} style={{ minHeight: 100 }} placeholder={"07.00  Samling vid herrgården\n07.30  Säkerhetsgenomgång\n08.00  Jaktdagen börjar"} /></div>
      <div className="field"><label className="checkfield checkfield--bare"><input type="checkbox" name="publicerad" defaultChecked={tillfalle?.publicerad ?? true} /><span>Publicerad på sajten</span></label></div>
      {fel && <div className="notice notice--fel field--full" role="alert">{fel}</div>}
      <div className="field--full cta-row"><button className="btn" type="submit" disabled={pending}>Spara</button><button className="btn btn--ghost" type="button" onClick={() => setOpen(false)}>Avbryt</button></div>
    </form>
  );
}
