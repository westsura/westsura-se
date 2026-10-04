"use client";

import { useRef, useState, useTransition } from "react";
import { laggTillAdmin } from "@/app/admin/actions";
import { OMRADEN } from "@/lib/roller";

/** Formulär för en ny admin: namn, e-post och vilka områden hen ska komma åt. */
export default function NyAdmin() {
  const [oppen, setOppen] = useState(false);
  const [fel, setFel] = useState<string | null>(null);
  const [klar, setKlar] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const form = useRef<HTMLFormElement>(null);

  if (!oppen) {
    return (
      <div className="admin__panel" style={{ marginBottom: 24 }}>
        {klar && <div className="notice" role="status" style={{ marginBottom: 12 }}>{klar}</div>}
        <button className="btn" type="button" onClick={() => { setOppen(true); setKlar(null); }}>+ Lägg till användare</button>
      </div>
    );
  }

  return (
    <form ref={form} className="admin__panel" style={{ marginBottom: 24 }} onSubmit={(e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const namn = String(fd.get("namn") ?? ""), epost = String(fd.get("epost") ?? "");
      setFel(null);
      start(async () => {
        const r = await laggTillAdmin(fd);
        if (!r.ok) { setFel(r.fel ?? "Något gick fel."); return; }
        setKlar(r.losenord
          ? `${namn} är tillagd. Ett välkomstmejl med inloggningen har skickats till ${epost}. Om det inte kommer fram är det tillfälliga lösenordet: ${r.losenord}`
          : `${namn} är tillagd och kan logga in med sitt befintliga lösenord. Ett mejl om detta har skickats till ${epost}.`);
        setOppen(false);
      });
    }}>
      <h2 className="admin__h2">Ny användare</h2>
      <div className="admin__actions" style={{ flexWrap: "wrap", marginBottom: 16 }}>
        <label style={{ flex: "1 1 220px" }}>Namn<br /><input name="namn" required autoComplete="off" style={{ width: "100%" }} /></label>
        <label style={{ flex: "1 1 260px" }}>E-post<br /><input name="epost" type="email" required autoComplete="off" style={{ width: "100%" }} /></label>
      </div>
      <fieldset style={{ border: 0, padding: 0, margin: "0 0 16px" }}>
        <legend className="label" style={{ marginBottom: 8 }}>Får tillgång till</legend>
        {OMRADEN.map((o) => (
          <label key={o.roll} style={{ display: "flex", gap: 10, alignItems: "flex-start", margin: "0 0 10px" }}>
            <input type="checkbox" name="roll" value={o.roll} style={{ marginTop: 4 }} />
            <span><b>{o.namn}</b><br /><small className="admin__meta">{o.ger}</small></span>
          </label>
        ))}
      </fieldset>
      <p className="admin__meta" style={{ marginBottom: 16 }}>Personen får ett mejl med ett tillfälligt lösenord och byter själv till ett eget. Har adressen redan ett konto, till exempel som jaktmedlem, används det lösenordet.</p>
      {fel && <div className="notice notice--fel" role="alert" style={{ marginBottom: 12 }}>{fel}</div>}
      <div className="admin__actions">
        <button className="btn" type="submit" disabled={pending}>{pending ? "Lägger till…" : "Lägg till och skicka mejl"}</button>
        <button className="btn btn--ghost" type="button" onClick={() => setOppen(false)}>Avbryt</button>
      </div>
    </form>
  );
}
