"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sparaHund, taBortHund } from "@/app/jaktklubb/actions";
import { DRIVER, DRIVERNAMN, type Hund } from "@/lib/ekipage";

const MAX = 8;

export default function HundLista({ hundar }: { hundar: Hund[] }) {
  const [redigera, setRedigera] = useState<string | "ny" | null>(hundar.length ? null : "ny");
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const formular = (h?: Hund) => (
    <form className="form" style={{ marginTop: 8 }} onSubmit={(e) => {
      e.preventDefault(); const fd = new FormData(e.currentTarget); if (h?.id) fd.set("id", h.id); setFel(null);
      start(async () => { const r = await sparaHund(fd); if (r.ok) { setRedigera(null); router.refresh(); } else setFel(r.fel ?? "Kunde inte spara."); });
    }}>
      <div className="field"><label>Namn</label><input name="namn" defaultValue={h?.namn ?? ""} required /></div>
      <div className="field"><label>Ras</label><input name="ras" defaultValue={h?.ras ?? ""} /></div>
      <div className="field"><label>Födelseår</label><input name="fodd" inputMode="numeric" pattern="\d{4}" defaultValue={h?.fodd ?? ""} placeholder="Valfritt — t.ex. 2021" /></div>
      <div className="field"><label>Registreringsnummer</label><input name="regnr" defaultValue={h?.regnr ?? ""} placeholder="Valfritt — SKK-nummer" /></div>
      <div className="field field--full">
        <span className="field-label">Vad används hunden till?</span>
        {DRIVER.map((d) => <label key={d.v} className="checkfield"><input type="checkbox" name="driver" value={d.v} defaultChecked={h?.driver.includes(d.v)} /><span>{d.t}</span></label>)}
        <label className="checkfield"><input type="checkbox" name="eftersok" value="1" defaultChecked={h?.eftersok} /><span>Eftersök på skadat vilt</span></label>
      </div>
      <div className="field field--full"><label>Prov och meriter</label><input name="meriter" defaultValue={h?.meriter ?? ""} placeholder="Valfritt — t.ex. jaktprov, viltspårprov" /></div>
      {fel && <p className="notice notice--fel field--full" role="alert">{fel}</p>}
      <div className="field--full cta-row">
        <button className="btn btn--sm" type="submit" disabled={pending}>{pending ? "Sparar…" : h ? "Spara" : "Lägg till hunden"}</button>
        {(h || hundar.length > 0) && <button className="btn btn--sm btn--ghost" type="button" onClick={() => { setRedigera(null); setFel(null); }}>Avbryt</button>}
      </div>
    </form>
  );

  return (
    <>
      {hundar.map((h) => (
        <section key={h.id} className="jk-kort jk-kort--ljus jk-kort--bred" style={{ marginBottom: 12 }}>
          {redigera === h.id ? formular(h) : (
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <p className="jk-kort__rubrik jk-kort__rubrik--mork" style={{ margin: 0 }}>{h.namn}</p>
                <p className="jk-hjalp" style={{ margin: "2px 0" }}>{[h.ras, h.fodd ? `född ${h.fodd}` : null, h.regnr].filter(Boolean).join(" · ") || "—"}</p>
                <p className="jk-lede" style={{ fontSize: 15, margin: 0 }}>{[...h.driver.map((d) => DRIVERNAMN[d] ?? d), h.eftersok ? "Eftersök" : ""].filter(Boolean).join(" · ") || "Inget angivet"}</p>
                {h.meriter && <p className="jk-hjalp" style={{ margin: "4px 0 0" }}>{h.meriter}</p>}
              </div>
              <div className="cta-row" style={{ alignSelf: "flex-start" }}>
                <button className="btn btn--sm btn--ghost" type="button" onClick={() => { setRedigera(h.id ?? null); setFel(null); }}>Ändra</button>
                {hundar.length > 1 && <button className="btn btn--sm btn--ghost" type="button" disabled={pending} onClick={() => {
                  if (!confirm(`Ta bort ${h.namn}?`)) return;
                  start(async () => { const r = await taBortHund(h.id!); if (!r.ok) alert(r.fel); else router.refresh(); });
                }}>Ta bort</button>}
              </div>
            </div>
          )}
        </section>
      ))}
      {redigera === "ny" ? (
        <section className="jk-kort jk-kort--ljus jk-kort--bred"><p className="jk-etikett">Ny hund</p>{formular()}</section>
      ) : hundar.length < MAX ? (
        <button className="btn" type="button" onClick={() => { setRedigera("ny"); setFel(null); }}>+ Lägg till en hund</button>
      ) : <p className="jk-hjalp">Du har {MAX} hundar registrerade, vilket är max.</p>}
    </>
  );
}
