"use client";

import { useState, useTransition } from "react";
import { registreraEkipage } from "@/app/actions";
import { DRIVER } from "@/lib/ekipage";
import { site } from "@/lib/site";

/** Registrering av hundekipage: förare, typ av ekipage och en eller flera hundar. */
export default function EkipageForm() {
  const [typ, setTyp] = useState<"hundforare" | "eftersok">("hundforare");
  const [examen, setExamen] = useState(false);
  const [hundar, setHundar] = useState(1);
  const [klar, setKlar] = useState(false);
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (klar) {
    return (
      <div className="notice notice--lg">
        <strong>Tack — ditt ekipage är registrerat.</strong> Vi tittar på uppgifterna och hör av oss. När ekipaget är godkänt får du ett mejl med inloggning till ditt konto. Frågor under tiden: <a href={site.phoneHref}>{site.phone}</a>.
      </div>
    );
  }

  return (
    <form className="form" onSubmit={(e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      fd.set("antal_hundar", String(hundar));
      setFel(null);
      start(async () => { const r = await registreraEkipage(fd); if (r.ok) setKlar(true); else setFel(r.fel); });
    }}>
      <div className="field field--full">
        <span className="field-label">Typ av ekipage</span>
        <label className="checkfield">
          <input type="radio" name="ekipage" value="hundforare" checked={typ === "hundforare"} onChange={() => setTyp("hundforare")} />
          <span><b>Hundförare</b> — du går med hund i drevet eller på ståndskall. Jägarexamen behövs inte.</span>
        </label>
        <label className="checkfield">
          <input type="radio" name="ekipage" value="eftersok" checked={typ === "eftersok"} onChange={() => setTyp("eftersok")} />
          <span><b>Eftersöksekipage</b> — du och hunden följer upp skadat vilt. Jägarexamen krävs.</span>
        </label>
      </div>

      <div className="field"><label htmlFor="e-namn">Namn</label><input id="e-namn" name="namn" required autoComplete="name" /></div>
      <div className="field"><label htmlFor="e-ort">Bostadsort</label><input id="e-ort" name="ort" autoComplete="address-level2" /></div>
      <div className="field"><label htmlFor="e-epost">E-post</label><input id="e-epost" name="epost" type="email" required autoComplete="email" /></div>
      <div className="field"><label htmlFor="e-tel">Telefon</label><input id="e-tel" name="telefon" type="tel" required autoComplete="tel" /></div>

      <label className="checkfield field--full">
        <input type="checkbox" name="jagarexamen" value="1" checked={examen} onChange={(e) => setExamen(e.target.checked)} required={typ === "eftersok"} />
        <span>Jag har jägarexamen{typ === "eftersok" ? " (krävs för eftersök)" : " (valfritt för hundförare)"}</span>
      </label>

      {Array.from({ length: hundar }, (_, i) => (
        <fieldset key={i} className="field field--full" style={{ border: "1px solid var(--line, #ddd)", borderRadius: 6, padding: 16 }}>
          <legend className="field-label" style={{ padding: "0 6px" }}>Hund {hundar > 1 ? i + 1 : ""}</legend>
          <div className="form" style={{ margin: 0 }}>
            <div className="field"><label htmlFor={`h${i}-namn`}>Hundens namn</label><input id={`h${i}-namn`} name={`hund${i}_namn`} required /></div>
            <div className="field"><label htmlFor={`h${i}-ras`}>Ras</label><input id={`h${i}-ras`} name={`hund${i}_ras`} required /></div>
            <div className="field"><label htmlFor={`h${i}-fodd`}>Födelseår</label><input id={`h${i}-fodd`} name={`hund${i}_fodd`} inputMode="numeric" pattern="\d{4}" placeholder="Valfritt — t.ex. 2021" /></div>
            <div className="field"><label htmlFor={`h${i}-regnr`}>Registreringsnummer</label><input id={`h${i}-regnr`} name={`hund${i}_regnr`} placeholder="Valfritt — SKK-nummer" /></div>
            <div className="field field--full">
              <span className="field-label">Vad används hunden till?</span>
              {DRIVER.map((d) => (
                <label key={d.v} className="checkfield"><input type="checkbox" name={`hund${i}_driver`} value={d.v} /><span>{d.t}</span></label>
              ))}
              <label className="checkfield"><input type="checkbox" name={`hund${i}_eftersok`} value="1" defaultChecked={typ === "eftersok"} /><span>Eftersök på skadat vilt</span></label>
            </div>
            <div className="field field--full"><label htmlFor={`h${i}-meriter`}>Prov och meriter</label><input id={`h${i}-meriter`} name={`hund${i}_meriter`} placeholder="Valfritt — t.ex. jaktprov, viltspårprov, anlagsprov" /></div>
          </div>
        </fieldset>
      ))}
      <div className="field--full cta-row">
        {hundar < 4 && <button type="button" className="btn btn--sm btn--ghost" onClick={() => setHundar(hundar + 1)}>+ Lägg till en hund till</button>}
        {hundar > 1 && <button type="button" className="btn btn--sm btn--ghost" onClick={() => setHundar(hundar - 1)}>Ta bort sista hunden</button>}
      </div>

      <div className="field field--full">
        <label htmlFor="e-medd">Något mer vi bör veta</label>
        <textarea id="e-medd" name="meddelande" className="ta--s" placeholder="Valfritt — erfarenhet, hur långt du har till Westsura, när du brukar kunna ställa upp…" />
      </div>

      <label className="checkfield field--full">
        <input type="checkbox" name="villkor" value="1" required />
        <span>Jag har läst och godkänner <a href="/jaktklubb/villkor" target="_blank" rel="noopener">villkoren för jakt</a>, och att uppgifterna sparas för att herrgården ska kunna kontakta mig inför jakter.</span>
      </label>

      {fel && <div className="notice notice--fel field--full" role="alert">{fel}</div>}
      <div className="field--full cta-row">
        <button className="btn" type="submit" disabled={pending}>{pending ? "Skickar…" : "Registrera ekipaget"}</button>
      </div>
    </form>
  );
}
