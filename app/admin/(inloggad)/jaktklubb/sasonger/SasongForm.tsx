"use client";

import { useState, useTransition } from "react";
import { sparaSasong } from "@/app/admin/actions";
import type { SasongRad } from "./delar";

export default function SasongForm({ sasong, forslag, onKlar }: { sasong?: SasongRad; forslag?: { namn: string; fran: string; till: string; moms: number }; onKlar?: () => void }) {
  const [medd, setMedd] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const v = sasong ?? forslag;
  return (
    <form className="form" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); start(async () => { const r = await sparaSasong(fd); setMedd(r.ok ? "Sparat." : r.fel ?? "Fel"); if (r.ok) onKlar?.(); }); }}>
      {sasong && <input type="hidden" name="id" value={sasong.id} />}
      <div className="field"><label>Namn</label><input name="namn" defaultValue={v?.namn ?? ""} placeholder="2027/2028" required /></div>
      <div className="field"><label>Moms på avgiften, %</label><input name="moms" type="number" min={0} max={25} defaultValue={v?.moms ?? 25} /></div>
      <div className="field"><label>Från</label><input name="fran" type="date" defaultValue={v?.fran ?? ""} required /></div>
      <div className="field"><label>Till</label><input name="till" type="date" defaultValue={v?.till ?? ""} required /></div>
      <div className="field--full cta-row">
        <button className="btn btn--sm" type="submit" disabled={pending}>{pending ? "Sparar…" : sasong ? "Spara" : "Skapa säsong"}</button>
        {onKlar && <button type="button" className="btn btn--sm btn--ghost" onClick={onKlar}>Avbryt</button>}
        {medd && <span className="admin__meta">{medd}</span>}
      </div>
    </form>
  );
}
