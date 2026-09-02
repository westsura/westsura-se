"use client";

import { useTransition } from "react";
import { sattAnmalanStatus } from "@/app/admin/actions";

type A = { id: string; namn: string; epost: string; telefon: string | null; antal: number; meddelande: string | null; status: string };

export default function AnmalanRad({ a }: { a: A }) {
  const [pending, start] = useTransition();
  return (
    <tr className={`st-${a.status}`}>
      <td><b>{a.namn}</b></td>
      <td><small>{a.epost}{a.telefon ? " · " + a.telefon : ""}</small></td>
      <td className="num">{a.antal}</td>
      <td><small>{a.meddelande}</small></td>
      <td>
        <select value={a.status} disabled={pending} onChange={(e) => start(async () => { await sattAnmalanStatus(a.id, e.target.value); })}>
          <option value="anmald">Anmäld</option><option value="bekraftad">Bekräftad</option><option value="vantelista">Väntelista</option><option value="avbokad">Avbokad</option>
        </select>
      </td>
    </tr>
  );
}
