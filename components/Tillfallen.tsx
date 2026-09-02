"use client";

import { useState, useTransition } from "react";
import { skapaAnmalan } from "@/app/actions";
import { site } from "@/lib/site";

export type Tillfalle = {
  id: string;
  typ: "jakt" | "hundtraning" | "jaktkurs" | "evenemang";
  titel: string;
  beskrivning: string | null;
  datum: string;        // ISO
  tid: string | null;
  pris: number | null;
  vanpris: number | null;
  platser: number;
  kvar: number;
};

const TYP: Record<Tillfalle["typ"], string> = { jakt: "Jakttillfälle", hundtraning: "Hundträning", jaktkurs: "Jaktkurs", evenemang: "Evenemang" };
const MAN = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
function fmt(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return { dag: ["sön", "mån", "tis", "ons", "tor", "fre", "lör"][d.getDay()], d: d.getDate(), m: MAN[d.getMonth()] };
}
const kr = (n: number | null) => (n == null ? "" : n === 0 ? "Fri entré" : n.toLocaleString("sv-SE") + " kr");

/** Lista över utlysta tillfällen med anmälan direkt till databasen. */
export default function Tillfallen({ tillfallen, rubrik = "Kommande tillfällen" }: { tillfallen: Tillfalle[]; rubrik?: string }) {
  const [valt, setValt] = useState<Tillfalle | null>(null);
  const [resultat, setResultat] = useState<{ status: string; titel: string } | null>(null);
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function anmal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!valt) return;
    const fd = new FormData(e.currentTarget);
    fd.set("tillfalle", valt.id);
    setFel(null);
    start(async () => {
      const r = await skapaAnmalan(fd);
      if (r.ok) setResultat({ status: r.data.status, titel: valt.titel }); else setFel(r.fel);
    });
  }

  return (
    <div>
      <p className="label">{rubrik}</p>
      {tillfallen.length === 0 && <p className="empty">Inga tillfällen är utlysta just nu. Ring oss på {site.phone} så hör vi av oss när nästa datum är satt.</p>}
      <ul className="tf">
        {tillfallen.map((t) => {
          const f = fmt(t.datum);
          const full = t.kvar <= 0;
          const ar = valt?.id === t.id;
          return (
            <li key={t.id} className={`tf-item${ar ? " is-selected" : ""}${full ? " is-full" : ""}`}>
              <div className="tf-date"><b>{f.d}</b><span>{f.m}</span><small>{f.dag}</small></div>
              <div className="tf-body">
                <div className="tf-top">
                  <h3>{t.titel}</h3>
                  {t.pris != null && <span className="tf-price">{kr(t.pris)}</span>}
                </div>
                {t.beskrivning && <p>{t.beskrivning}</p>}
                <div className="tf-foot">
                  <span className="tf-meta">{TYP[t.typ]}{t.tid ? ` · ${t.tid}` : ""} · {full ? "Fullbokat" : `${t.kvar} ${t.kvar === 1 ? "plats" : "platser"} kvar`}</span>
                  <button className={`btn${ar || full ? " btn--ghost" : ""}`} type="button" onClick={() => { setValt(t); setResultat(null); setFel(null); }}>
                    {ar ? "Vald" : full ? "Ställ mig på väntelista" : "Boka plats"}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div id="forfragan" style={{ marginTop: 40 }}>
        {resultat ? (
          <div className="notice" style={{ fontSize: 18 }}>
            <strong>{resultat.status === "vantelista" ? "Du står på väntelistan." : "Tack för din anmälan."}</strong>{" "}
            {resultat.status === "vantelista" ? "Vi hör av oss om en plats blir ledig." : "Vi bekräftar platsen inom en vardag."} En bekräftelse har skickats till din e-post.
          </div>
        ) : valt ? (
          <div className="card" style={{ borderTopColor: "var(--accent)" }}>
            <p className="label">{valt.kvar <= 0 ? "Väntelista" : "Anmälan"}</p>
            <h3>{valt.titel} · {fmt(valt.datum).d} {fmt(valt.datum).m}</h3>
            <p style={{ fontSize: 16 }}>Fyll i uppgifterna så bekräftar vi platsen inom en vardag. Anmälan är bindande först när ni fått vår bekräftelse.</p>
            <form className="form" onSubmit={anmal}>
              <div className="field"><label htmlFor="a-namn">Namn</label><input id="a-namn" name="namn" required autoComplete="name" /></div>
              <div className="field"><label htmlFor="a-antal">Antal personer</label><input id="a-antal" name="antal" type="number" min={1} max={20} defaultValue={1} required /></div>
              <div className="field"><label htmlFor="a-epost">E-post</label><input id="a-epost" name="epost" type="email" required autoComplete="email" /></div>
              <div className="field"><label htmlFor="a-tel">Telefon</label><input id="a-tel" name="telefon" type="tel" autoComplete="tel" /></div>
              <div className="field field--full"><label htmlFor="a-medd">Meddelande</label><textarea id="a-medd" name="meddelande" style={{ minHeight: 90 }} placeholder="Hundens ras och ålder, erfarenhet, önskemål…" /></div>
              {fel && <div className="notice field--full" style={{ borderLeftColor: "#a33" }}>{fel}</div>}
              <div className="field--full cta-row">
                <button className="btn" type="submit" disabled={pending}>{pending ? "Skickar…" : valt.kvar <= 0 ? "Ställ mig på väntelista" : "Skicka anmälan"}</button>
                <a className="btn btn--ghost" href={site.phoneHref}>Ring {site.phone}</a>
              </div>
            </form>
          </div>
        ) : (
          <p style={{ fontSize: 15, color: "var(--ws-ink-40)" }}>Välj ett tillfälle ovan för att anmäla dig — eller ring <a href={site.phoneHref}>{site.phone}</a>.</p>
        )}
      </div>
    </div>
  );
}
