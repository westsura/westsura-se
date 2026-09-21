"use client";

import { useState, useTransition } from "react";
import { sattBokningsstatus } from "@/app/admin/actions";

export default function BokningsKnappar({ id, status }: { id: string; status: string }) {
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const satt = (s: "preliminar" | "bekraftad" | "avbokad") => start(async () => {
    setFel(null);
    const r = await sattBokningsstatus(id, s);
    if (!r.ok) setFel(r.fel ?? "Kunde inte ändra status.");
  });
  return (
    <div className="admin__actions">
      {fel && <div className="notice notice--fel" role="alert">{fel}</div>}
      {status !== "bekraftad" && <button className="btn btn--sm" disabled={pending} onClick={() => satt("bekraftad")}>Bekräfta</button>}
      {status !== "avbokad" && <button className="btn btn--sm btn--ghost" disabled={pending} onClick={() => { if (confirm("Avboka bokningen?")) satt("avbokad"); }}>Avboka</button>}
      {status === "avbokad" && <button className="btn btn--sm btn--ghost" disabled={pending} onClick={() => satt("preliminar")}>Återöppna</button>}
    </div>
  );
}
