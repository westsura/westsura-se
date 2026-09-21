"use client";

import { useState, useTransition } from "react";
import { godkannMedlem, vantelistaMedlem, avbojMedlem, sparaMedlemsanteckning } from "@/app/admin/actions";
import { MEDLEMSSTATUS, datumtid, type Medlem, type Niva } from "./delar";

/** En ansökan med allt den sökande skrivit, plus besluten. */
export default function AnsokanKort({ m, nivaer, kvar }: { m: Medlem; nivaer: Niva[]; kvar: Record<string, number> }) {
  const [valdNiva, setValdNiva] = useState(m.onskad_niva_id ?? nivaer[0]?.id ?? "");
  const [ant, setAnt] = useState(m.anteckning ?? "");
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const kor = (f: () => Promise<{ ok: boolean; fel?: string }>) => start(async () => {
    setFel(null);
    const r = await f();
    if (!r.ok) setFel(r.fel ?? "Något gick fel.");
  });

  const fullt = valdNiva ? (kvar[valdNiva] ?? 0) <= 0 : false;
  const onskad = nivaer.find((n) => n.id === m.onskad_niva_id);

  return (
    <article className={`admin__panel ff st-${m.status}`} style={{ marginBottom: 14 }}>
      <div className="ff__head">
        <div>
          <span className={`pill pill--${m.status}`}>{MEDLEMSSTATUS[m.status]}</span>
          <b style={{ marginLeft: 10 }}>{m.namn}</b>
          <div className="admin__meta">{datumtid(m.skapad)}{m.ort ? ` · ${m.ort}` : ""}{onskad && nivaer.length > 1 ? ` · önskar ${onskad.namn}` : ""}</div>
        </div>
        <div className="admin__meta">
          <a href={`tel:${m.telefon}`}>{m.telefon}</a><br />
          <a href={`mailto:${m.epost}?subject=${encodeURIComponent("Din ansökan till Westsura Herrgårds jaktklubb")}`}>{m.epost}</a>
        </div>
      </div>

      <p className="admin__meta" style={{ margin: "12px 0 4px" }}><b>Jakterfarenhet</b></p>
      <p style={{ fontSize: 15, margin: 0, whiteSpace: "pre-wrap" }}>{m.jakterfarenhet}</p>
      {m.hund && <><p className="admin__meta" style={{ margin: "12px 0 4px" }}><b>Hund</b></p><p style={{ fontSize: 15, margin: 0 }}>{m.hund}</p></>}
      {m.meddelande && <><p className="admin__meta" style={{ margin: "12px 0 4px" }}><b>Meddelande</b></p><p style={{ fontSize: 15, margin: 0, whiteSpace: "pre-wrap" }}>{m.meddelande}</p></>}

      {fullt && <p className="notice notice--fel" style={{ marginTop: 12 }}>Nivån är full. Du kan godkänna ändå — då blir ni fler än platserna.</p>}
      {fel && <p className="notice notice--fel" style={{ marginTop: 12 }} role="alert">{fel}</p>}

      <div className="ff__foot">
        {nivaer.length > 1 && (
          <select value={valdNiva} onChange={(e) => setValdNiva(e.target.value)} disabled={pending}>
            {nivaer.map((n) => <option key={n.id} value={n.id}>{n.namn} ({kvar[n.id] ?? 0} kvar)</option>)}
          </select>
        )}
        <input value={ant} onChange={(e) => setAnt(e.target.value)} onBlur={() => start(async () => { setFel(null); const r = await sparaMedlemsanteckning(m.id, ant); if (!r.ok) setFel(r.fel ?? "Kunde inte spara anteckningen."); })}
          placeholder="Anteckning — ringt, träffat, referens…" style={{ flex: 1 }} />
        <button className="btn btn--sm" type="button" disabled={pending || !valdNiva} onClick={() => kor(() => godkannMedlem(m.id, valdNiva))}>{pending ? "Godkänner…" : "Godkänn"}</button>
        {m.status !== "vantelista" && <button className="btn btn--sm btn--ghost" type="button" disabled={pending} onClick={() => kor(() => vantelistaMedlem(m.id))}>Väntelista</button>}
        <button className="btn btn--sm btn--ghost" type="button" disabled={pending}
          onClick={() => { if (confirm(`Avböj ${m.namn}? Eventuella uppladdade dokument raderas.`)) kor(() => avbojMedlem(m.id)); }}>Avböj</button>
      </div>
    </article>
  );
}
