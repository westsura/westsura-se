"use client";

import { useState } from "react";

/** Frivilliga fakturauppgifter — ihopfällt tills gästen behöver dem. Fälten heter faktura_* och läses av actions. */
export default function Fakturafalt({ prefix = "fk", full = false }: { prefix?: string; full?: boolean }) {
  const [open, setOpen] = useState(false);
  const cls = full ? "field field--full" : "field";
  return (
    <div className={full ? "field--full" : undefined} style={{ gridColumn: full ? "1 / -1" : undefined }}>
      <label className="checkfield checkfield--bare" htmlFor={`${prefix}-open`}>
        <input type="checkbox" id={`${prefix}-open`} checked={open} onChange={(e) => setOpen(e.target.checked)} />
        <span>Vi ska faktureras (företag, förening eller organisation)</span>
      </label>
      {open && (
        <div className="form" style={{ marginTop: 14, gridTemplateColumns: full ? "1fr 1fr" : "1fr" }}>
          <div className={cls}><label htmlFor={`${prefix}-foretag`}>Företag eller organisation</label><input id={`${prefix}-foretag`} name="faktura_foretag" autoComplete="organization" /></div>
          <div className={cls}><label htmlFor={`${prefix}-orgnr`}>Organisationsnummer</label><input id={`${prefix}-orgnr`} name="faktura_orgnr" inputMode="numeric" placeholder="556xxx-xxxx" /></div>
          <div className="field field--full" style={{ gridColumn: "1 / -1" }}><label htmlFor={`${prefix}-adress`}>Fakturaadress</label><textarea id={`${prefix}-adress`} name="faktura_adress" style={{ minHeight: 64 }} placeholder="Gata, postnummer och ort" /></div>
          <div className={cls}><label htmlFor={`${prefix}-ref`}>Er referens</label><input id={`${prefix}-ref`} name="faktura_referens" placeholder="Namn eller kostnadsställe" /></div>
          <div className={cls}><label htmlFor={`${prefix}-epost`}>E-post för faktura</label><input id={`${prefix}-epost`} name="faktura_epost" type="email" placeholder="Om annan än ovan" /></div>
        </div>
      )}
    </div>
  );
}
