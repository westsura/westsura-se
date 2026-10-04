"use client";

import { useState, useTransition } from "react";
import { sparaAdminRoller } from "@/app/admin/actions";
import { OMRADEN, ROLLNAMN } from "@/lib/roller";

/** Visar en admins områden, och låter superadmin ändra dem. */
export default function Behorighet({ epost, roller }: { epost: string; roller: string[] }) {
  const [redigera, setRedigera] = useState(false);
  const [valda, setValda] = useState<string[]>(roller);
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!redigera) {
    return (
      <div>
        {valda.map((r) => ROLLNAMN[r] ?? r).join(", ") || "—"}
        <br />
        <button className="btn btn--sm btn--ghost" type="button" style={{ marginTop: 6 }} onClick={() => setRedigera(true)}>Ändra</button>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault(); setFel(null);
      start(async () => { const r = await sparaAdminRoller(epost, valda); if (r.ok) setRedigera(false); else setFel(r.fel ?? "Kunde inte spara."); });
    }}>
      {OMRADEN.map((o) => (
        <label key={o.roll} style={{ display: "block", whiteSpace: "nowrap", margin: "0 0 4px" }} title={o.ger}>
          <input type="checkbox" checked={valda.includes(o.roll)} onChange={(e) => setValda(e.target.checked ? [...valda, o.roll] : valda.filter((x) => x !== o.roll))} /> {o.namn}
        </label>
      ))}
      <div className="admin__actions" style={{ marginTop: 6 }}>
        <button className="btn btn--sm" type="submit" disabled={pending}>{pending ? "…" : "Spara"}</button>
        <button className="btn btn--sm btn--ghost" type="button" onClick={() => { setValda(roller); setRedigera(false); setFel(null); }}>Avbryt</button>
      </div>
      {fel && <p className="admin__meta" role="alert">{fel}</p>}
    </form>
  );
}
