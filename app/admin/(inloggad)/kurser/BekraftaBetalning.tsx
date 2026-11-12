"use client";

import { useState, useTransition } from "react";
import { forslagKursbekraftelse, bekraftaKursbokning } from "@/app/admin/actions";

/** "Betalning mottagen": bekräftar bokningen och visar mejlet till kunden för granskning innan det skickas. */
export default function BekraftaBetalning({ id, namn }: { id: string; namn: string }) {
  const [utkast, setUtkast] = useState<{ till: string; amne: string; text: string } | null>(null);
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!utkast) return (
    <>
      <button type="button" className="btn btn--sm" disabled={pending} onClick={() => start(async () => {
        setFel(null);
        const f = await forslagKursbekraftelse(id);
        if (f) setUtkast(f); else setFel("Hittade inte bokningen.");
      })}>{pending ? "…" : "Betalning mottagen"}</button>
      {fel && <div className="notice notice--fel" role="alert">{fel}</div>}
    </>
  );

  return (
    <form className="form" style={{ minWidth: 320, marginTop: 8 }} onSubmit={(e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const skicka = (e.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "1";
      fd.set("skicka", skicka ? "1" : "0");
      if (!confirm(skicka ? `Bekräfta ${namn}s bokning och skicka mejlet till ${fd.get("till")}?` : `Bekräfta ${namn}s bokning utan att skicka mejl?`)) return;
      setFel(null);
      start(async () => { const r = await bekraftaKursbokning(id, fd); if (r.ok) setUtkast(null); else setFel(r.fel ?? "Kunde inte bekräfta."); });
    }}>
      <div className="field field--full"><label>Till</label><input name="till" type="email" defaultValue={utkast.till} /></div>
      <div className="field field--full"><label>Ämne</label><input name="amne" defaultValue={utkast.amne} /></div>
      <div className="field field--full"><label>Text</label><textarea name="text" defaultValue={utkast.text} style={{ minHeight: 200 }} /></div>
      {fel && <div className="notice notice--fel field--full" role="alert">{fel}</div>}
      <div className="field--full cta-row">
        <button className="btn btn--sm" type="submit" value="1" disabled={pending}>Bekräfta och skicka</button>
        <button className="btn btn--sm btn--ghost" type="submit" value="0" disabled={pending}>Bekräfta utan mejl</button>
        <button className="linkbtn" type="button" onClick={() => setUtkast(null)}>Avbryt</button>
      </div>
    </form>
  );
}
