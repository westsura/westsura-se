"use client";

import { useState } from "react";
import InquiryForm from "@/components/InquiryForm";
import { site } from "@/lib/site";

export type Tillfalle = {
  id: string;
  datum: string;        // ISO
  tid?: string;
  titel: string;
  typ: "Jakttillfälle" | "Hundträning" | "Jaktkurs";
  platser: number;      // kvar
  pris: string;
  text: string;
};

const MAN = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
function fmt(iso: string) {
  const d = new Date(iso);
  const dag = ["sön", "mån", "tis", "ons", "tor", "fre", "lör"][d.getDay()];
  return { dag, d: d.getDate(), m: MAN[d.getMonth()] };
}

/** Lista över utlysta tillfällen med anmälan. Tillfällena läggs i databasen i etapp II. */
export default function Tillfallen({ tillfallen, rubrik = "Kommande tillfällen" }: { tillfallen: Tillfalle[]; rubrik?: string }) {
  const [valt, setValt] = useState<Tillfalle | null>(null);

  return (
    <div>
      <p className="label">{rubrik}</p>
      {tillfallen.length === 0 && <p className="empty">Inga tillfällen är utlysta just nu. Skicka en intresseanmälan så hör vi av oss när nästa datum är satt.</p>}
      <ul className="tf">
        {tillfallen.map((t) => {
          const f = fmt(t.datum);
          const full = t.platser <= 0;
          return (
            <li key={t.id} className={`tf-item${valt?.id === t.id ? " is-selected" : ""}${full ? " is-full" : ""}`}>
              <div className="tf-date"><b>{f.d}</b><span>{f.m}</span><small>{f.dag}</small></div>
              <div className="tf-body">
                <div className="tf-top">
                  <h3>{t.titel}</h3>
                  <span className="tf-price">{t.pris}</span>
                </div>
                <p>{t.text}</p>
                <div className="tf-foot">
                  <span className="tf-meta">{t.typ}{t.tid ? ` · ${t.tid}` : ""} · {full ? "Fullbokat" : `${t.platser} ${t.platser === 1 ? "plats" : "platser"} kvar`}</span>
                  {full
                    ? <button className="btn btn--ghost" type="button" onClick={() => setValt(t)}>Ställ mig på väntelista</button>
                    : <button className={`btn${valt?.id === t.id ? " btn--ghost" : ""}`} type="button" onClick={() => setValt(t)}>{valt?.id === t.id ? "Vald" : "Boka plats"}</button>}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div id="forfragan" style={{ marginTop: 40 }}>
        {valt ? (
          <div className="card" style={{ borderTopColor: "var(--accent)" }}>
            <p className="label">{valt.platser <= 0 ? "Väntelista" : "Anmälan"}</p>
            <h3>{valt.titel} · {fmt(valt.datum).d} {fmt(valt.datum).m}</h3>
            <p style={{ fontSize: 16 }}>Fyll i uppgifterna så bekräftar vi platsen inom en vardag. Anmälan är bindande först när ni fått vår bekräftelse.</p>
            <InquiryForm key={valt.id} typ={`${valt.typ}: ${valt.titel} ${valt.datum}`} alternativ={[`${valt.typ}: ${valt.titel} ${valt.datum}`]} />
          </div>
        ) : (
          <p style={{ fontSize: 15, color: "var(--ws-ink-40)" }}>Välj ett tillfälle ovan för att anmäla dig — eller ring <a href={site.phoneHref}>{site.phone}</a>.</p>
        )}
      </div>
    </div>
  );
}
