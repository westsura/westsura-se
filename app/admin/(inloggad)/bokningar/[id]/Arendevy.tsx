"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sattArendestatus, sparaArende, sparaDel, taBortDel, taBortArende } from "@/app/admin/arenden";
import { ARENDETYP, DELTYP, tid, type Arende, type Del } from "@/lib/arende";
import DelFalt, { type Resurser } from "../DelFalt";
import Konflikter from "../Konflikter";
import { oppnaMejl } from "./Mejl";

const MAN = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
const DAG = ["sön", "mån", "tis", "ons", "tor", "fre", "lör"];
const dag = (d: string) => { const x = new Date(d + "T12:00:00"); return `${DAG[x.getDay()]} ${x.getDate()} ${MAN[x.getMonth()]} ${x.getFullYear()}`; };
const dagEfter = (d: string) => { const x = new Date(d + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() + 1); return x.toISOString().slice(0, 10); };

/**
 * Statusknappar. Varje byte bekräftas först. Mejl går bara ut automatiskt vid bekräftelse om
 * bokningen har läget Automatiskt — annars öppnas mejlrutan för granskning (eller inget alls).
 */
export function Statusknappar({ a }: { a: Arende }) {
  const [fel, setFel] = useState<{ fel: string; k: string[] } | null>(null);
  const [pending, start] = useTransition();
  if (a.typ === "intern") return null;
  const byt = (status: string, fraga: string) => {
    if (!confirm(fraga)) return;
    setFel(null);
    start(async () => {
      const r = await sattArendestatus(a.id, status);
      if (!r.ok) setFel({ fel: r.fel ?? "Kunde inte ändra status.", k: r.konflikter ?? [] });
      else if (r.fel) setFel({ fel: r.fel, k: [] });
      else if (r.foreslaMejl) oppnaMejl(r.foreslaMejl);
    });
  };
  const namn = a.kund_foretag || a.kund_namn || "bokningen";
  // Vad händer med mejl när statusen byts? Står i varje fråga.
  const mejl = (syfte: string) => !a.kund_epost || a.mejllage === "inget" ? "Inget mejl skickas till kunden."
    : a.mejllage === "auto" && syfte === "bekraftelse" ? `Kunden får ett bekräftelsemejl automatiskt till ${a.kund_epost}.`
    : "Inget mejl skickas automatiskt — du får ett förslag att granska och kan välja att inte skicka.";
  return (
    <div>
      <div className="admin__actions" style={{ flexWrap: "wrap" }}>
        {a.status === "forfragan" && <button className="btn btn--sm" disabled={pending} onClick={() => byt("preliminar", `Gör ${namn} till preliminär bokning? Valda lokaler och boenden reserveras (och stängs på sajten). ${mejl("preliminar")}`)}>Gör preliminär</button>}
        {(a.status === "forfragan" || a.status === "preliminar") && <button className="btn btn--sm" disabled={pending} onClick={() => byt("bekraftad", `Bekräfta bokningen för ${namn}? Valda lokaler och boenden reserveras. ${mejl("bekraftelse")}`)}>Bekräfta</button>}
        {a.status !== "avbokad" && <button className="btn btn--sm btn--ghost" disabled={pending} onClick={() => byt("avbokad", `Avboka ${namn}? Lokaler och boenden släpps. ${mejl("avbokning")}`)}>Avboka</button>}
        {(a.status === "avbokad" || a.status === "bekraftad") && <button className="btn btn--sm btn--ghost" disabled={pending} onClick={() => byt("preliminar", `Ändra ${namn} till preliminär?`)}>Gör preliminär</button>}
        {a.status === "avbokad" && <button className="btn btn--sm btn--ghost" disabled={pending} onClick={() => byt("forfragan", `Öppna ${namn} igen som förfrågan?`)}>Öppna som förfrågan</button>}
      </div>
      {fel && <div style={{ marginTop: 10 }}><Konflikter fel={fel.fel} konflikter={fel.k} /></div>}
    </div>
  );
}

/** Kund- och bokningsuppgifter. */
export function Uppgifter({ a }: { a: Arende }) {
  const [andrar, setAndrar] = useState(false);
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const intern = a.typ === "intern";
  if (!andrar) {
    const rad = (k: string, v: React.ReactNode) => v ? <div><dt>{k}</dt><dd>{v}</dd></div> : null;
    return (
      <section className="admin__panel">
        <div className="ff__head"><h2 className="admin__h2" style={{ margin: 0 }}>{intern ? "Aktiviteten" : "Kund och önskemål"}</h2>
          <button className="btn btn--sm btn--ghost" onClick={() => setAndrar(true)}>Ändra</button></div>
        <dl className="uppgifter">
          {rad("Typ", ARENDETYP[a.typ])}
          {rad("Rubrik", a.rubrik)}
          {!intern && rad("Kontakt", a.kund_namn)}
          {!intern && rad("Företag", a.kund_foretag)}
          {!intern && rad("E-post", a.kund_epost && <a href={`mailto:${a.kund_epost}`}>{a.kund_epost}</a>)}
          {!intern && rad("Telefon", a.kund_telefon && <a href={`tel:${a.kund_telefon}`}>{a.kund_telefon}</a>)}
          {!intern && rad("Gäster", a.antal_gaster)}
          {!intern && rad("Svar senast", a.svara_senast && dag(a.svara_senast))}
          {!intern && rad("Önskemål", a.onskemal && <span style={{ whiteSpace: "pre-line" }}>{a.onskemal}</span>)}
          {rad("Interna anteckningar", a.anteckningar && <span style={{ whiteSpace: "pre-line" }}>{a.anteckningar}</span>)}
        </dl>
      </section>
    );
  }
  return (
    <form className="form admin__panel" onSubmit={(e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      setFel(null);
      start(async () => { const r = await sparaArende(a.id, fd); if (r.ok) setAndrar(false); else setFel(r.fel ?? "Kunde inte spara."); });
    }}>
      <h2 className="admin__h2 field--full" style={{ margin: 0 }}>Ändra uppgifter</h2>
      <p className="hint field--full" style={{ marginTop: 0 }}>Ändringar här skickar inget till kunden.</p>
      <div className="field"><label>Typ</label>
        <select name="typ" defaultValue={a.typ}>{Object.entries(ARENDETYP).filter(([k]) => intern ? k === "intern" : k !== "intern").map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
      <div className="field"><label>Rubrik</label><input name="rubrik" defaultValue={a.rubrik ?? ""} required={intern} /></div>
      {!intern && (
        <>
          <div className="field"><label>Kontaktperson</label><input name="kund_namn" defaultValue={a.kund_namn ?? ""} /></div>
          <div className="field"><label>Företag / sällskap</label><input name="kund_foretag" defaultValue={a.kund_foretag ?? ""} /></div>
          <div className="field"><label>E-post</label><input name="kund_epost" type="email" defaultValue={a.kund_epost ?? ""} /></div>
          <div className="field"><label>Telefon</label><input name="kund_telefon" defaultValue={a.kund_telefon ?? ""} /></div>
          <div className="field"><label>Antal gäster</label><input name="antal_gaster" type="number" min={0} defaultValue={a.antal_gaster ?? ""} /></div>
          <div className="field"><label>Sista svarsdatum</label><input name="svara_senast" type="date" defaultValue={a.svara_senast ?? ""} /></div>
          <div className="field field--full"><label>Särskilda önskemål</label><textarea name="onskemal" className="ta--s" defaultValue={a.onskemal ?? ""} /></div>
        </>
      )}
      <div className="field field--full"><label>Interna anteckningar</label><textarea name="anteckningar" className="ta--s" defaultValue={a.anteckningar ?? ""} /></div>
      {fel && <div className="notice notice--fel field--full" role="alert">{fel}</div>}
      <div className="field--full cta-row">
        <button className="btn" type="submit" disabled={pending}>{pending ? "Sparar…" : "Spara"}</button>
        <button className="btn btn--ghost" type="button" onClick={() => setAndrar(false)}>Avbryt</button>
      </div>
    </form>
  );
}

/** Tjänsterna i bokningen: konferens, middag, boende … var och en med datum, tid och lokal/boende. */
export function Delar({ a, delar, resurser }: { a: Arende; delar: Del[]; resurser: Resurser }) {
  const [redigerar, setRedigerar] = useState<string | null>(null); // del-id, "ny" eller null
  const [fel, setFel] = useState<{ fel: string; k: string[] } | null>(null);
  const [pending, start] = useTransition();
  const intern = a.typ === "intern";
  const lokal = (id: string) => resurser.lokaler.find((l) => l.id === id)?.namn ?? id;
  const enhet = (id: string) => resurser.enheter.find((e) => e.id === id)?.namn ?? id;

  const form = (d?: Del) => (
    <form className="form" style={{ marginTop: 12 }} onSubmit={(e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      setFel(null);
      start(async () => {
        const r = await sparaDel(a.id, fd);
        if (r.ok) setRedigerar(null); else setFel({ fel: r.fel ?? "Kunde inte spara.", k: r.konflikter ?? [] });
      });
    }}>
      <DelFalt resurser={resurser} del={d} intern={intern} standardTyp={a.typ === "boende" ? "boende" : a.typ === "middag" ? "middag" : intern ? "intern" : "konferens"} />
      {fel && <Konflikter fel={fel.fel} konflikter={fel.k} />}
      <div className="field--full cta-row">
        <button className="btn btn--sm" type="submit" disabled={pending}>{pending ? "Sparar…" : "Spara"}</button>
        <button className="btn btn--sm btn--ghost" type="button" onClick={() => { setRedigerar(null); setFel(null); }}>Avbryt</button>
      </div>
    </form>
  );

  return (
    <section className="admin__panel">
      <div className="ff__head"><h2 className="admin__h2" style={{ margin: 0 }}>{intern ? "När och var" : "Tjänster"}</h2>
        {redigerar !== "ny" && <button className="btn btn--sm btn--ghost" onClick={() => { setRedigerar("ny"); setFel(null); }}>+ Lägg till {intern ? "tid" : "tjänst"}</button>}</div>
      {!delar.length && redigerar !== "ny" && <p className="empty">Inget datum inlagt ännu.</p>}
      <ul className="delar">
        {delar.map((d) => (
          <li key={d.id}>
            {redigerar === d.id ? form(d) : (
              <div className="delar__rad">
                <div>
                  <b>{d.typ === "boende" ? `${dag(d.fran)} – ${dag(dagEfter(d.till))}` : d.till !== d.fran ? `${dag(d.fran)} – ${dag(d.till)}` : dag(d.fran)}</b>
                  {(d.tid_fran || d.tid_till) && <> · {tid(d.tid_fran)}{d.tid_till ? "–" + tid(d.tid_till) : ""}</>}
                  <br />
                  <span className="kal-typ" data-typ={d.typ === "aktivitet" ? "intern" : d.typ}>{DELTYP[d.typ]}</span>
                  {d.beskrivning && <> {d.beskrivning}</>}
                  {d.antal != null && <> · {d.antal} pers.</>}
                  {(d.lokal_ids.length > 0 || d.enhet_ids.length > 0) && <><br /><small>{[...d.lokal_ids.map(lokal), ...d.enhet_ids.map(enhet)].join(", ")}{intern && !d.blockerar ? " · bara information, blockerar inte" : ""}</small></>}
                </div>
                <div className="admin__actions">
                  <button className="btn btn--sm btn--ghost" onClick={() => { setRedigerar(d.id); setFel(null); }}>Ändra</button>
                  <button className="linkbtn" disabled={pending} onClick={() => { if (confirm("Ta bort den här tjänsten från bokningen? Lokaler och boenden den tog släpps.")) start(async () => { const r = await taBortDel(a.id, d.id); if (!r.ok) setFel({ fel: r.fel ?? "Kunde inte ta bort.", k: [] }); }); }}>Ta bort</button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      {redigerar === "ny" && form()}
      {fel && !redigerar && <Konflikter fel={fel.fel} konflikter={fel.k} />}
      {!intern && a.status === "forfragan" && delar.some((d) => d.lokal_ids.length || d.enhet_ids.length) && (
        <p className="hint" style={{ marginTop: 12 }}>En förfrågan reserverar inget. Lokaler och boenden blir upptagna när bokningen görs preliminär eller bekräftas.</p>
      )}
    </section>
  );
}

export function TaBort({ a }: { a: Arende }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button className="linkbtn" disabled={pending} onClick={() => {
      if (!confirm(`Ta bort ${a.typ === "intern" ? "aktiviteten" : "bokningen"} #${a.nummer} helt? Det går inte att ångra.${a.typ !== "intern" ? "\n\nVill du bara släppa datumen — använd hellre Avboka." : ""}`)) return;
      start(async () => { const r = await taBortArende(a.id); if (r.ok) router.push("/admin/bokningar"); else alert(r.fel); });
    }}>Ta bort {a.typ === "intern" ? "aktiviteten" : "bokningen"}</button>
  );
}

