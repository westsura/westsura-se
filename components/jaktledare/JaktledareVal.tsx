"use client";

import { useState, useTransition } from "react";
import { sattJaktledare } from "@/app/jaktledare/actions";

/** Admin pekar ut en medlem som jaktledare för dagen. Medlemmen får då vyn i medlemsklubben. */
export default function JaktledareVal({ tillfalleId, vald, medlemmar }: { tillfalleId: string; vald: string | null; medlemmar: { id: string; namn: string }[] }) {
  const [medd, setMedd] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="form form--1" style={{ maxWidth: 420 }}>
      <div className="field">
        <label>Utpekad jaktledare</label>
        <select defaultValue={vald ?? ""} disabled={pending} onChange={(e) => {
          const v = e.target.value;
          start(async () => { const r = await sattJaktledare(tillfalleId, v); setMedd(r.ok ? "Sparat." : r.fel ?? "Fel"); });
        }}>
          <option value="">— ingen, admin leder —</option>
          {medlemmar.map((m) => <option key={m.id} value={m.id}>{m.namn}</option>)}
        </select>
        <p className="hint">Jaktledaren ser den här vyn under Översikt i medlemsklubben och kan fördela pass och registrera skott. {medd}</p>
      </div>
    </div>
  );
}
