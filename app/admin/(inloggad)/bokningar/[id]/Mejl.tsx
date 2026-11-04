"use client";

import { useEffect, useState, useTransition } from "react";
import { forhandsgranskaMejl, skickaArendeMejl, sattMejllage } from "@/app/admin/arenden";
import { SYFTE, type Mejlmall } from "@/lib/arendemejl";
import type { Arende } from "@/lib/arende";

export type Logg = { id: string; syfte: string; till: string; amne: string; text: string; ok: boolean; auto: boolean; skickat_av: string | null; skickat: string };
type Utkast = { syfte: string; till: string; amne: string; rubrik: string; text: string };

const LAGE: [string, string][] = [["manuell", "Manuellt — jag granskar och skickar"], ["auto", "Automatiskt — bekräftelse går ut när bokningen bekräftas"], ["inget", "Inga mejl till kunden"]];

/** Öppnar mejlrutan från andra delar av sidan (t.ex. efter en statusändring). */
export const oppnaMejl = (syfte: string) => window.dispatchEvent(new CustomEvent("westsura:mejl", { detail: syfte }));

/**
 * Mejl till kunden: välj mall, granska och redigera, skicka. Allt som skickas sparas i loggen.
 * Ingenting skickas utan att någon trycker Skicka (utom läget Automatiskt vid bekräftelse).
 */
export default function Mejl({ a, mallar, logg }: { a: Arende; mallar: Mejlmall[]; logg: Logg[] }) {
  const [utkast, setUtkast] = useState<Utkast | null>(null);
  const [mallId, setMallId] = useState("");
  const [fel, setFel] = useState<string | null>(null);
  const [kvitto, setKvitto] = useState<string | null>(null);
  const [visa, setVisa] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const hamta = (id: string | null, syfte?: string) => start(async () => {
    setFel(null); setKvitto(null);
    const f = await forhandsgranskaMejl(a.id, id, syfte);
    if (!f) { setFel("Hittade ingen mall."); return; }
    setMallId(f.mallId);
    setUtkast({ syfte: f.syfte, till: f.till, amne: f.amne, rubrik: f.rubrik, text: f.text });
  });

  useEffect(() => {
    const h = (e: Event) => { hamta(null, (e as CustomEvent<string>).detail); document.getElementById("mejl")?.scrollIntoView({ behavior: "smooth" }); };
    window.addEventListener("westsura:mejl", h);
    return () => window.removeEventListener("westsura:mejl", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a.id]);

  // Har bokningen ändrats sedan senaste bekräftelsen gick ut?
  const senaste = logg.find((l) => l.ok && (l.syfte === "bekraftelse" || l.syfte === "uppdaterad"));
  const andrad = a.status === "bekraftad" && senaste && new Date(a.uppdaterad).getTime() > new Date(senaste.skickat).getTime() + 60000;
  const av = a.mejllage === "inget";

  return (
    <section className="admin__panel" id="mejl">
      <div className="ff__head">
        <h2 className="admin__h2" style={{ margin: 0 }}>Mejl till kunden</h2>
        <select value={a.mejllage} aria-label="Mejlläge" disabled={pending} onChange={(e) => { const v = e.target.value; start(async () => { await sattMejllage(a.id, v); }); }} style={{ maxWidth: 360 }}>
          {LAGE.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      {!a.kund_epost && <p className="hint">Bokningen saknar e-postadress — lägg till den under Kund och önskemål, eller skriv in den i mejlet.</p>}
      {andrad && !utkast && !av && (
        <div className="notice" style={{ marginTop: 12 }}>
          Bokningen har ändrats sedan bekräftelsen skickades {new Date(senaste!.skickat).toLocaleDateString("sv-SE", { day: "numeric", month: "short" })}.{" "}
          <button className="linkbtn" onClick={() => hamta(null, "uppdaterad")}>Skicka uppdaterad bekräftelse</button>
        </div>
      )}

      {av ? <p className="empty">Mejl är avstängt för den här bokningen.</p> : !utkast ? (
        <div className="admin__actions" style={{ marginTop: 12 }}>
          <select value="" disabled={pending} onChange={(e) => e.target.value && hamta(e.target.value)} aria-label="Välj mall">
            <option value="">Skriv mejl utifrån mall …</option>
            {mallar.map((m) => <option key={m.id} value={m.id}>{m.namn}</option>)}
          </select>
          <a className="linkbtn" href="/admin/bokningar/mallar">Redigera mallar</a>
        </div>
      ) : (
        <form className="form" style={{ marginTop: 12 }} onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          if (!confirm(`Skicka mejlet till ${fd.get("till")}?`)) return;
          setFel(null);
          start(async () => {
            const r = await skickaArendeMejl(a.id, fd);
            if (r.ok) { setUtkast(null); setKvitto(`Mejlet är skickat till ${fd.get("till")}.`); } else setFel(r.fel ?? "Kunde inte skicka.");
          });
        }}>
          <input type="hidden" name="syfte" value={utkast.syfte} />
          <div className="field"><label>Mall</label>
            <select value={mallId} onChange={(e) => hamta(e.target.value)} disabled={pending}>
              {mallar.map((m) => <option key={m.id} value={m.id}>{m.namn}</option>)}
            </select></div>
          <div className="field"><label>Till</label><input name="till" type="email" defaultValue={utkast.till} key={"t" + mallId} required /></div>
          <div className="field field--full"><label>Ämne</label><input name="amne" defaultValue={utkast.amne} key={"a" + mallId} required /></div>
          <div className="field field--full"><label>Rubrik i mejlet</label><input name="rubrik" defaultValue={utkast.rubrik} key={"r" + mallId} /></div>
          <div className="field field--full"><label>Text</label>
            <textarea name="text" defaultValue={utkast.text} key={"x" + mallId} style={{ minHeight: 280, fontFamily: "inherit" }} required />
            <p className="hint">Granska och ändra fritt — det här är exakt vad kunden får. Tom rad blir nytt stycke. Mejlet får herrgårdens sidhuvud och kontaktuppgifter, och svar kommer till {`boka@westsura.se`}.</p></div>
          {fel && <div className="notice notice--fel field--full" role="alert">{fel}</div>}
          <div className="field--full cta-row">
            <button className="btn" type="submit" disabled={pending}>{pending ? "Skickar…" : "Skicka mejlet"}</button>
            <button className="btn btn--ghost" type="button" onClick={() => { setUtkast(null); setFel(null); }}>Skicka inte</button>
          </div>
        </form>
      )}
      {kvitto && <p className="notice" style={{ marginTop: 12 }}>{kvitto}</p>}
      {fel && !utkast && <p className="notice notice--fel" role="alert" style={{ marginTop: 12 }}>{fel}</p>}

      {!!logg.length && (
        <>
          <h3 className="admin__h3" style={{ margin: "20px 0 4px" }}>Skickat</h3>
          <ul className="delar">
            {logg.map((l) => (
              <li key={l.id}>
                <div className="delar__rad">
                  <div>
                    <b>{l.amne}</b>{!l.ok && <span className="pill pill--avbokad" style={{ marginLeft: 8 }}>gick inte fram</span>}<br />
                    <small>{new Date(l.skickat).toLocaleString("sv-SE", { dateStyle: "medium", timeStyle: "short" })} · {SYFTE[l.syfte] ?? l.syfte} · till {l.till}{l.skickat_av ? ` · ${l.auto ? "automatiskt, " : ""}${l.skickat_av}` : ""}</small>
                    {visa === l.id && <p style={{ whiteSpace: "pre-line", fontSize: 14, margin: "8px 0 0" }}>{l.text}</p>}
                  </div>
                  <button className="linkbtn" onClick={() => setVisa(visa === l.id ? null : l.id)}>{visa === l.id ? "Dölj" : "Visa"}</button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
