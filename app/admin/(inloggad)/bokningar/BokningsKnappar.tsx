"use client";

import { useTransition } from "react";
import { sattBokningsstatus } from "@/app/admin/actions";

export default function BokningsKnappar({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  const satt = (s: "preliminar" | "bekraftad" | "avbokad") => start(async () => { await sattBokningsstatus(id, s); });
  return (
    <div className="admin__actions">
      {status !== "bekraftad" && <button className="btn btn--sm" disabled={pending} onClick={() => satt("bekraftad")}>Bekräfta</button>}
      {status !== "avbokad" && <button className="btn btn--sm btn--ghost" disabled={pending} onClick={() => { if (confirm("Avboka bokningen?")) satt("avbokad"); }}>Avboka</button>}
      {status === "avbokad" && <button className="btn btn--sm btn--ghost" disabled={pending} onClick={() => satt("preliminar")}>Återöppna</button>}
    </div>
  );
}
