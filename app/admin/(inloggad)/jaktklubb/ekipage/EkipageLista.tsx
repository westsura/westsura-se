"use client";

import { useMemo, useState, useTransition } from "react";
import { godkannEkipage, avbojEkipage, bjudInEkipage } from "@/app/admin/actions";
import { DRIVER, DRIVERNAMN, EKIPAGESTATUS, EKIPAGETYP, type Hund } from "@/lib/ekipage";

export type Ekipage = {
  id: string; namn: string; epost: string; telefon: string | null; ort: string | null; status: string;
  ekipage: string; ekipage_status: string | null; jagarexamen: boolean; meddelande: string | null; skapad: string;
  hundar: Hund[];
};

export default function EkipageLista({ lista, jaktdagar }: { lista: Ekipage[]; jaktdagar: { id: string; titel: string; datum: string }[] }) {
  const [status, setStatus] = useState("");
  const [typ, setTyp] = useState("");
  const [driver, setDriver] = useState("");
  const [valda, setValda] = useState<Set<string>>(new Set());
  const [jaktdag, setJaktdag] = useState(jaktdagar[0]?.id ?? "");
  const [text, setText] = useState("");
  const [medd, setMedd] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const att = lista.filter((e) => e.ekipage_status === "sokande");
  const synliga = useMemo(() => lista.filter((e) =>
    (!status || e.ekipage_status === status) &&
    (!typ || e.ekipage === typ || (typ === "eftersok" && e.hundar.some((h) => h.eftersok))) &&
    (!driver || e.hundar.some((h) => h.driver.includes(driver)))
  ), [lista, status, typ, driver]);
  const godkandaSynliga = synliga.filter((e) => e.ekipage_status === "godkand");
  const valdaLista = godkandaSynliga.filter((e) => valda.has(e.id));

  const kor = (f: () => Promise<{ ok: boolean; fel?: string }>) => start(async () => { setMedd(null); const r = await f(); if (!r.ok) setMedd(r.fel ?? "Något gick fel."); });
  const vaxla = (id: string) => setValda((s) => { const x = new Set(s); if (x.has(id)) x.delete(id); else x.add(id); return x; });

  return (
    <>
      <div className="admin__stats">
        <div className="stat"><b>{att.length}</b><span>Att godkänna</span></div>
        <div className="stat"><b>{lista.filter((e) => e.ekipage_status === "godkand").length}</b><span>Godkända ekipage</span></div>
        <div className="stat"><b>{lista.filter((e) => e.ekipage_status === "godkand" && (e.ekipage === "eftersok" || e.hundar.some((h) => h.eftersok))).length}</b><span>Varav eftersök</span></div>
      </div>

      <div className="admin__filter" style={{ margin: "24px 0 12px", display: "flex", gap: 8, flexWrap: "wrap" }}>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="">Alla statusar</option>
          {Object.entries(EKIPAGESTATUS).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
        </select>
        <select value={typ} onChange={(e) => setTyp(e.target.value)} aria-label="Typ">
          <option value="">Alla typer</option>
          {Object.entries(EKIPAGETYP).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
        </select>
        <select value={driver} onChange={(e) => setDriver(e.target.value)} aria-label="Hunden används till">
          <option value="">Alla hundar</option>
          {DRIVER.map((d) => <option key={d.v} value={d.v}>{d.t}</option>)}
        </select>
      </div>

      {medd && <p className="notice" role="status" style={{ marginBottom: 12 }}>{medd}</p>}

      <div className="admin__panel">
        <div className="tablewrap">
          <table className="admin__table">
            <thead><tr><th></th><th>Förare</th><th>Hundar</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {!synliga.length && <tr><td colSpan={5} className="empty">Inga ekipage här.</td></tr>}
              {synliga.map((e) => (
                <tr key={e.id}>
                  <td>{e.ekipage_status === "godkand" && <input type="checkbox" aria-label={`Välj ${e.namn}`} checked={valda.has(e.id)} onChange={() => vaxla(e.id)} />}</td>
                  <td>
                    <b>{e.namn}</b> <span className="pill">{EKIPAGETYP[e.ekipage]}</span>
                    <div className="admin__meta">{e.telefon && <a href={`tel:${e.telefon}`}>{e.telefon}</a>} · <a href={`mailto:${e.epost}`}>{e.epost}</a>{e.ort ? ` · ${e.ort}` : ""}</div>
                    <div className="admin__meta">Jägarexamen: {e.jagarexamen ? "ja" : "nej"}{e.status === "godkand" ? " · medlem i jaktlaget" : ""}</div>
                    {e.meddelande && <div className="admin__meta"><em>{e.meddelande}</em></div>}
                  </td>
                  <td>
                    {e.hundar.map((h) => (
                      <div key={h.id ?? h.namn} style={{ marginBottom: 6 }}>
                        <b>{h.namn}</b>{h.ras ? `, ${h.ras}` : ""}{h.fodd ? ` (${h.fodd})` : ""}
                        <div className="admin__meta">{[...h.driver.map((d) => DRIVERNAMN[d] ?? d), h.eftersok ? "Eftersök" : ""].filter(Boolean).join(" · ") || "—"}{h.regnr ? ` · ${h.regnr}` : ""}</div>
                        {h.meriter && <div className="admin__meta">{h.meriter}</div>}
                      </div>
                    ))}
                  </td>
                  <td><span className={`pill pill--${e.ekipage_status === "godkand" ? "godkand" : e.ekipage_status === "avbojd" ? "avbojd" : "inskickad"}`}>{EKIPAGESTATUS[e.ekipage_status ?? "sokande"]}</span></td>
                  <td className="admin__actions">
                    {e.ekipage_status !== "godkand" && <button className="btn btn--sm" type="button" disabled={pending} onClick={() => kor(() => godkannEkipage(e.id))}>Godkänn</button>}
                    {e.ekipage_status !== "avbojd" && <button className="btn btn--sm btn--ghost" type="button" disabled={pending}
                      onClick={() => { if (confirm(e.ekipage_status === "godkand" ? `Dra tillbaka godkännandet för ${e.namn}? Rabatten på boendet upphör.` : `Avböj ${e.namn}?`)) kor(() => avbojEkipage(e.id)); }}>
                      {e.ekipage_status === "godkand" ? "Dra tillbaka" : "Avböj"}
                    </button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <section className="admin__panel" style={{ marginTop: 24 }}>
        <h2 className="admin__h2">Kontakta godkända ekipage</h2>
        <p className="admin__meta" style={{ marginBottom: 12 }}>
          Kryssa i ekipagen i listan — filtrera gärna först, till exempel på älghundar.{" "}
          <button type="button" className="linkbtn" onClick={() => setValda(new Set(godkandaSynliga.map((e) => e.id)))}>Välj alla som syns ({godkandaSynliga.length})</button>
          {valda.size > 0 && <> · <button type="button" className="linkbtn" onClick={() => setValda(new Set())}>Rensa val</button></>}
        </p>
        <p style={{ marginBottom: 12 }}><b>{valdaLista.length}</b> valda.{" "}
          {valdaLista.length > 0 && <a href={`mailto:?bcc=${encodeURIComponent(valdaLista.map((e) => e.epost).join(","))}`}>Skriv ett eget mejl till dem →</a>}
        </p>
        <div className="admin__actions" style={{ flexWrap: "wrap", alignItems: "flex-start" }}>
          <select value={jaktdag} onChange={(e) => setJaktdag(e.target.value)} aria-label="Jaktdag">
            {!jaktdagar.length && <option value="">Inga kommande jaktdagar</option>}
            {jaktdagar.map((j) => <option key={j.id} value={j.id}>{j.datum} · {j.titel}</option>)}
          </select>
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Egen text i inbjudan (valfritt) — t.ex. samlingstid eller vilka hundar ni behöver" style={{ flex: "1 1 320px", minHeight: 60 }} />
          <button className="btn btn--sm" type="button" disabled={pending || !valdaLista.length || !jaktdag}
            onClick={() => start(async () => {
              setMedd(null);
              const r = await bjudInEkipage(jaktdag, valdaLista.map((e) => e.id), text);
              setMedd(r.ok ? `Inbjudan skickad till ${r.skickade} ekipage. Svaren kommer till herrgårdens mejl.` : r.fel ?? "Kunde inte skicka.");
              if (r.ok) setText("");
            })}>{pending ? "Skickar…" : "Bjud in till jaktdagen"}</button>
        </div>
      </section>
    </>
  );
}
