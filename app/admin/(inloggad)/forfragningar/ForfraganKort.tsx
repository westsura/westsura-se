"use client";

import { useState, useTransition } from "react";
import { uppdateraForfragan } from "@/app/admin/actions";
import FakturaKnapp from "../FakturaKnapp";

type Faktura = { foretag?: string; orgnr?: string; adress?: string; referens?: string; epost?: string } | null;
type F = { id: string; nummer: number; typ: string; onskat_datum: string | null; antal_gaster: string | null; hundar: boolean; namn: string; telefon: string | null; epost: string; meddelande: string | null; status: string; anteckningar: string | null; skapad: string; faktura?: Faktura };
const STATUS = [["ny", "Ny"], ["pagar", "Pågår"], ["besvarad", "Besvarad"], ["bokad", "Bokad"], ["avslutad", "Avslutad"]];

export default function ForfraganKort({ f, underlag }: { f: F; underlag?: { id: string; status: string } }) {
  const [status, setStatus] = useState(f.status);
  const [ant, setAnt] = useState(f.anteckningar ?? "");
  const [pending, start] = useTransition();
  const spara = (s = status, a = ant) => start(async () => { await uppdateraForfragan(f.id, s, a); });
  return (
    <article className={`admin__panel ff st-${status}`} id={String(f.nummer)} style={{ marginBottom: 14 }}>
      <div className="ff__head">
        <div>
          <span className={`pill pill--${status}`}>{STATUS.find((x) => x[0] === status)?.[1]}</span>
          <b style={{ marginLeft: 10 }}>{f.typ}</b> · {f.namn}
          <div className="admin__meta">#{f.nummer} · {new Date(f.skapad).toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" })} · {f.onskat_datum || "datum ej satt"} · {f.antal_gaster || "?"} gäster{f.hundar ? " · hundar" : ""}</div>
        </div>
        <div className="admin__meta"><a href={`tel:${f.telefon}`}>{f.telefon}</a><br /><a href={`mailto:${f.epost}?subject=${encodeURIComponent("Er förfrågan till Westsura Herrgård")}`}>{f.epost}</a></div>
      </div>
      {f.meddelande && <p style={{ fontSize: 15, margin: "12px 0", whiteSpace: "pre-wrap" }}>{f.meddelande}</p>}
      {f.faktura && (
        <p className="admin__meta" style={{ margin: "8px 0" }}>
          <b>Fakturauppgifter:</b> {[f.faktura.foretag, f.faktura.orgnr && `org.nr ${f.faktura.orgnr}`, f.faktura.adress, f.faktura.referens && `ref ${f.faktura.referens}`, f.faktura.epost].filter(Boolean).join(" · ")}
        </p>
      )}
      <div className="ff__foot">
        <select value={status} onChange={(e) => { setStatus(e.target.value); spara(e.target.value); }} disabled={pending}>
          {STATUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <input value={ant} onChange={(e) => setAnt(e.target.value)} onBlur={() => spara()} placeholder="Anteckning — ringt, offert skickad…" style={{ flex: 1 }} />
        <FakturaKnapp forfraganId={f.id} underlagId={underlag?.id} status={underlag?.status} />
      </div>
    </article>
  );
}
