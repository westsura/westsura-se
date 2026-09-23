"use client";

import { useTransition } from "react";
import { avbokaVakAdmin } from "@/app/admin/actions";

export default function VakKnappar({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button className="admin__logout" disabled={pending} onClick={() => {
      if (!confirm("Avboka dygnet? Området blir ledigt igen. Jägaren får inget mejl — hör av dig själv.")) return;
      start(async () => { const r = await avbokaVakAdmin(id); if (!r.ok) alert(r.fel); });
    }}>{pending ? "…" : "Avboka"}</button>
  );
}
