"use client";

import { useState, useTransition } from "react";
import { sattAnmalanStatus } from "@/app/admin/actions";

type A = { id: string; namn: string; epost: string; telefon: string | null; antal: number; antal_barn?: number; meddelande: string | null; status: string };

export default function AnmalanRad({ a, sittning }: { a: A; sittning?: string | null }) {
  const [fel, setFel] = useState<string | null>(null);
  const [medd, setMedd] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <tr className={`st-${a.status}`}>
      <td><b>{a.namn}</b>{sittning && <div className="admin__meta">{sittning}</div>}</td>
      <td><small>{a.epost}{a.telefon ? " · " + a.telefon : ""}</small></td>
      <td className="num">{a.antal}{a.antal_barn ? <div className="admin__meta">varav {a.antal_barn} barn</div> : null}</td>
      <td><small>{a.meddelande}</small></td>
      <td>
        <select value={a.status} disabled={pending} title="Bekräftad och Väntelista skickar ett mejl till gästen" onChange={(e) => {
          const v = e.target.value; setFel(null); setMedd(null);
          start(async () => { const r = await sattAnmalanStatus(a.id, v); if (!r.ok) setFel(r.fel ?? "Kunde inte ändra status."); else if (r.mejlat) setMedd(`Mejl skickat till ${a.epost}`); });
        }}>
          <option value="anmald">Anmäld</option><option value="bekraftad">Bekräftad</option><option value="vantelista">Väntelista</option><option value="avbokad">Avbokad</option>
        </select>
        {fel && <div className="notice notice--fel" role="alert" style={{ marginTop: 6 }}>{fel}</div>}
        {medd && <div className="admin__meta" role="status" style={{ marginTop: 6 }}>{medd}</div>}
      </td>
    </tr>
  );
}
