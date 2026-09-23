"use client";

import { useState, useTransition } from "react";
import { bokaVakUtbud } from "@/app/actions";
import { site } from "@/lib/site";
import { VAKTYP, type Utbud } from "@/lib/vak";

const MAN = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
function fmt(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return { dag: ["sön", "mån", "tis", "ons", "tor", "fre", "lör"][d.getDay()], d: d.getDate(), m: MAN[d.getMonth()] };
}
const kr = (n: number) => n.toLocaleString("sv-SE") + " kr";

/** Utlagda vak- och pyrschdygn på /jakt. Samma formspråk som Tillfallen. */
export default function VakUtbud({ utbud }: { utbud: Utbud[] }) {
  const [valt, setValt] = useState<Utbud | null>(null);
  const [klart, setKlart] = useState<string | null>(null);
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function boka(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!valt) return;
    const fd = new FormData(e.currentTarget);
    fd.set("utbud", valt.id);
    setFel(null);
    start(async () => {
      const r = await bokaVakUtbud(fd);
      if (r.ok) setKlart(`${VAKTYP[valt.typ]} ${valt.datum}`); else setFel(r.fel);
    });
  }

  return (
    <div>
      <p className="label">Utlagda dygn</p>
      {utbud.length === 0 && <p className="empty">Inga vak- eller pyrschdygn ligger ute just nu. Vi lägger ut dygn löpande under säsongen — ring {site.phone} om du vill höra vad som är på gång.</p>}
      <ul className="tf">
        {utbud.map((u) => {
          const f = fmt(u.datum);
          const full = (u.kvar ?? 1) <= 0;
          const ar = valt?.id === u.id;
          return (
            <li key={u.id} className={`tf-item${ar ? " is-selected" : ""}${full ? " is-full" : ""}`}>
              <div className="tf-date"><b>{f.d}</b><span>{f.m}</span><small>{f.dag}</small></div>
              <div className="tf-body">
                <div className="tf-top">
                  <h3>{VAKTYP[u.typ]}</h3>
                  <span className="tf-price">{kr(u.pris)}</span>
                </div>
                {u.beskrivning && <p>{u.beskrivning}</p>}
                <div className="tf-foot">
                  <span className="tf-meta">Eget dygn · en jägare per område{full ? " · Bokat" : ""}</span>
                  {!full && (
                    <button className={`btn${ar ? " btn--ghost" : ""}`} type="button" onClick={() => { setValt(u); setKlart(null); setFel(null); }}>
                      {ar ? "Vald" : "Boka dygnet"}
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="tf-anmalan">
        {klart ? (
          <div className="notice notice--lg" role="status">
            <strong>Tack — din bokning är mottagen.</strong> {klart}. Jaktledaren tilldelar område och bekräftar inom en vardag; du har fått ett mejl. Jakten kräver jaktkort, ID och vår säkerhetskurs online — det gör du på ditt jägarkonto. <a href="/jaktklubb/login">Logga in på jägarkontot →</a>
          </div>
        ) : valt ? (
          <div className="card card--accent">
            <p className="label">Boka {VAKTYP[valt.typ].toLowerCase()}</p>
            <h3>{fmt(valt.datum).dag} {fmt(valt.datum).d} {fmt(valt.datum).m} · {kr(valt.pris)}</h3>
            <p className="small">Dygnet faktureras efteråt. Bokningen är bindande när jaktledaren bekräftat område.</p>
            <form className="form" onSubmit={boka}>
              <div className="field"><label htmlFor="v-namn">Namn</label><input id="v-namn" name="namn" required autoComplete="name" /></div>
              <div className="field"><label htmlFor="v-tel">Telefon</label><input id="v-tel" name="telefon" type="tel" autoComplete="tel" /></div>
              <div className="field"><label htmlFor="v-epost">E-post</label><input id="v-epost" name="epost" type="email" required autoComplete="email" /></div>
              {valt.typ === "bada" && (
                <div className="field"><label htmlFor="v-typ">Jaktform</label>
                  <select id="v-typ" name="typ" defaultValue="vak"><option value="vak">Vak</option><option value="pyrsch">Pyrsch</option></select>
                </div>
              )}
              <div className="field field--full"><label htmlFor="v-medd">Meddelande</label><textarea id="v-medd" name="meddelande" className="ta--xs" placeholder="Vilt du helst jagar, tid på dygnet, hund…" /></div>
              {fel && <div className="notice notice--fel field--full" role="alert">{fel}</div>}
              <div className="field--full cta-row">
                <button className="btn" type="submit" disabled={pending}>{pending ? "Skickar…" : "Boka dygnet"}</button>
                <a className="btn btn--ghost" href={site.phoneHref}>Ring {site.phone}</a>
              </div>
            </form>
          </div>
        ) : utbud.length > 0 ? (
          <p className="muted">Välj ett dygn ovan — eller ring <a href={site.phoneHref}>{site.phone}</a>.</p>
        ) : null}
      </div>
    </div>
  );
}
