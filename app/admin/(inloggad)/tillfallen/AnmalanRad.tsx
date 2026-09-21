"use client";

import { useState, useTransition } from "react";
import { sattAnmalanStatus } from "@/app/admin/actions";

type A = { id: string; namn: string; epost: string; telefon: string | null; antal: number; meddelande: string | null; status: string };

export default function AnmalanRad({ a }: { a: A }) {
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <tr className={`st-${a.status}`}>
      <td><b>{a.namn}</b></td>
      <td><small>{a.epost}{a.telefon ? " · " + a.telefon : ""}</small></td>
      <td className="num">{a.antal}</td>
      <td><small>{a.meddelande}</small></td>
      <td>
        <select value={a.status} disabled={pending} onChange={(e) => { const v = e.target.value; setFel(null); start(async () => { const r = await sattAnmalanStatus(a.id, v); if (!r.ok) setFel(r.fel ?? "Kunde inte ändra status."); }); }}>
          <option value="anmald">Anmäld</option><option value="bekraftad">Bekräftad</option><option value="vantelista">Väntelista</option><option value="avbokad">Avbokad</option>
        </select>
        {fel && <div className="notice notice--fel" role="alert" style={{ marginTop: 6 }}>{fel}</div>}
      </td>
    </tr>
  );
}
