"use client";

import { useState, useTransition } from "react";
import { sparaVan, taBortVan } from "@/app/admin/actions";

type Van = { id: string; namn: string | null; epost: string; samtycke_tid: string; kalla: string | null; avanmald_tid?: string | null };

export default function VanRad({ v }: { v: Van }) {
  const [redigera, setRedigera] = useState(false);
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (redigera) {
    return (
      <tr>
        <td colSpan={5}>
          <form className="admin__actions" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); setFel(null); start(async () => { const r = await sparaVan(v.id, fd); if (r.ok) setRedigera(false); else setFel(r.fel ?? "Fel"); }); }}>
            <input name="namn" defaultValue={v.namn ?? ""} placeholder="Namn" aria-label="Namn" />
            <input name="epost" type="email" defaultValue={v.epost} required aria-label="E-post" />
            <button className="btn btn--sm" type="submit" disabled={pending}>{pending ? "Sparar…" : "Spara"}</button>
            <button className="btn btn--sm btn--ghost" type="button" onClick={() => setRedigera(false)}>Avbryt</button>
            {fel && <span className="admin__meta" role="alert">{fel}</span>}
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td>{v.namn}</td>
      <td>{v.epost}</td>
      <td>{v.samtycke_tid.slice(0, 10)}{v.avanmald_tid ? <><br /><small>Avslutad {v.avanmald_tid.slice(0, 10)}</small></> : null}</td>
      <td>{v.kalla}</td>
      <td className="admin__actions">
        <button className="btn btn--sm btn--ghost" type="button" onClick={() => setRedigera(true)}>Redigera</button>
        <button className="admin__logout" type="button" disabled={pending} onClick={() => {
          if (!confirm(`Ta bort ${v.epost} från Westsuras Vänner? Det går inte att ångra.`)) return;
          start(async () => { const r = await taBortVan(v.id); if (!r.ok) alert(r.fel); });
        }}>Ta bort</button>
      </td>
    </tr>
  );
}
