"use client";

import { useState, useTransition } from "react";
import { sparaKursinstallning } from "@/app/admin/actions";

type Inst = { antal_fragor: number; godkant_procent: number; giltighet: string; ingress: string | null; version: number } | null;

export default function Installningar({ inst, kritiska }: { inst: Inst; kritiska: number }) {
  const [medd, setMedd] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form className="form form--1" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); start(async () => { const r = await sparaKursinstallning(fd); setMedd(r.ok ? "Sparat." : r.fel ?? "Kunde inte spara."); }); }}>
      <div className="field">
        <label htmlFor="ki-antal">Antal frågor per prov</label>
        <input id="ki-antal" name="antal_fragor" type="number" min={1} max={60} defaultValue={inst?.antal_fragor ?? 15} />
        <p className="hint">De {kritiska} kritiska frågorna är alltid med; resten fylls på slumpvis.</p>
      </div>
      <div className="field">
        <label htmlFor="ki-proc">Godkänt, procent rätt</label>
        <input id="ki-proc" name="godkant_procent" type="number" min={0} max={100} defaultValue={inst?.godkant_procent ?? 80} />
        <p className="hint">Utöver detta måste alla kritiska frågor vara rätt.</p>
      </div>
      <div className="field">
        <label htmlFor="ki-gilt">Hur länge gäller ett godkänt prov?</label>
        <select id="ki-gilt" name="giltighet" defaultValue={inst?.giltighet ?? "sasong"}>
          <option value="sasong">En säsong — nytt prov varje jaktår</option>
          <option value="version">Tills innehållet ändras (nu version {inst?.version})</option>
          <option value="alltid">Tills vidare — en gång per medlem</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="ki-ingress">Ingress på kurssidan</label>
        <textarea id="ki-ingress" name="ingress" className="ta--s" defaultValue={inst?.ingress ?? ""} />
      </div>
      <div className="cta-row">
        <button className="btn btn--sm" type="submit" disabled={pending}>{pending ? "Sparar…" : "Spara inställningar"}</button>
        {medd && <span className="admin__meta">{medd}</span>}
      </div>
    </form>
  );
}
