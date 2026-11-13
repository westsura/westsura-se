"use client";

import { useState, useTransition } from "react";
import { skickaKursbokningsmejlIgen } from "@/app/admin/actions";

/** Skicka bokningsmejlet till kunden igen — t.ex. om det inte kom fram eller hamnade i skräpposten. */
export default function SkickaIgen({ id, epost, mejlat }: { id: string; epost: string; mejlat: boolean | null }) {
  const [medd, setMedd] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div style={{ marginTop: 4 }}>
      {mejlat === false && !medd && <div className="folj folj--passerat">Bokningsmejlet gick inte fram</div>}
      <button type="button" className="linkbtn" disabled={pending} onClick={() => {
        if (!confirm(`Skicka bokningsmejlet igen till ${epost}?`)) return;
        start(async () => { const r = await skickaKursbokningsmejlIgen(id); setMedd(r.ok ? "Skickat igen." : r.fel ?? "Gick inte."); });
      }}>{pending ? "Skickar…" : "Skicka bokningsmejlet igen"}</button>
      {medd && <div className="admin__meta">{medd}</div>}
    </div>
  );
}
