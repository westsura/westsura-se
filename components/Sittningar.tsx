"use client";

import { useState, useTransition } from "react";
import { skapaAnmalan } from "@/app/actions";
import { site } from "@/lib/site";
import { dagRubrik, platsstatus, type Sittning } from "@/lib/sittning";

const kr = (n: number | null) => (n == null ? "" : n === 0 ? "Fri entré" : n.toLocaleString("sv-SE") + " kr");

/** Välj sittning (dag och tid) och anmäl dig. Antal platser visas inte — bara "Få platser kvar" och "Fullbokat". */
export default function Sittningar({ tillfalleId, titel, pris, sittningar }: { tillfalleId: string; titel: string; pris: number | null; sittningar: Sittning[] }) {
  const idag = new Date().toISOString().slice(0, 10);
  const kommande = sittningar.filter((s) => s.datum >= idag);
  const [valt, setValt] = useState<Sittning | null>(kommande.length === 1 ? kommande[0] : null);
  const [resultat, setResultat] = useState<string | null>(null);
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const dagar = [...new Set(kommande.map((s) => s.datum))];

  if (!kommande.length) return <p className="empty">Alla sittningar har varit. Ring {site.phone} om du har frågor.</p>;

  return (
    <div>
      <p className="label">Välj sittning</p>
      {dagar.map((d) => (
        <div key={d} style={{ marginBottom: 18 }}>
          <p style={{ fontWeight: 600, margin: "0 0 8px" }}>{dagRubrik(d)}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {kommande.filter((s) => s.datum === d).map((s) => {
              const st = platsstatus(s.kvar, s.platser);
              const ar = valt?.id === s.id;
              return (
                <button key={s.id} type="button" onClick={() => { setValt(s); setResultat(null); setFel(null); }}
                  className={`btn btn--sm${ar ? "" : " btn--ghost"}`} aria-pressed={ar}
                  style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2, height: "auto", padding: "10px 14px", textTransform: "none", letterSpacing: 0 }}>
                  <span style={{ fontSize: 16, fontWeight: 600 }}>{s.tid || "Hela dagen"}</span>
                  <span style={{ fontSize: 12, opacity: 0.85 }}>{st.text}{s.pris != null && s.pris !== pris ? ` · ${kr(s.pris)}` : ""}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="tf-anmalan">
        {resultat ? (
          <div className="notice notice--lg" role="status">{resultat}</div>
        ) : valt ? (
          <div className="card card--accent">
            <p className="label">{valt.kvar <= 0 ? "Väntelista" : "Anmälan"}</p>
            <h3>{titel} · {dagRubrik(valt.datum).toLowerCase()}{valt.tid ? `, ${valt.tid}` : ""}</h3>
            <p className="small">
              {valt.kvar <= 0 ? "Sittningen är fullbokad — anmäl dig till väntelistan så hör vi av oss om en plats blir ledig." : "Fyll i uppgifterna så bekräftar vi platsen inom en vardag."}
              {(valt.pris ?? pris) != null ? ` Pris: ${kr(valt.pris ?? pris)}${(valt.pris ?? pris) ? " per person" : ""}.` : ""}
            </p>
            <form className="form" onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              fd.set("tillfalle", tillfalleId); fd.set("sittning", valt.id);
              setFel(null);
              start(async () => {
                const r = await skapaAnmalan(fd);
                if (!r.ok) { setFel(r.fel); return; }
                setResultat(r.data.status === "vantelista"
                  ? "Du står på väntelistan. Vi hör av oss om en plats blir ledig — en bekräftelse har skickats till din e-post."
                  : "Tack för din anmälan! Vi bekräftar platsen inom en vardag. En kopia har skickats till din e-post.");
              });
            }}>
              <div className="field"><label htmlFor="s-namn">Namn</label><input id="s-namn" name="namn" required autoComplete="name" /></div>
              <div className="field"><label htmlFor="s-antal">Antal personer</label><input id="s-antal" name="antal" type="number" min={1} max={20} defaultValue={2} required /></div>
              <div className="field"><label htmlFor="s-epost">E-post</label><input id="s-epost" name="epost" type="email" required autoComplete="email" /></div>
              <div className="field"><label htmlFor="s-tel">Telefon</label><input id="s-tel" name="telefon" type="tel" autoComplete="tel" /></div>
              <div className="field field--full"><label htmlFor="s-medd">Meddelande</label><textarea id="s-medd" name="meddelande" className="ta--s" placeholder="Valfritt — allergier, specialkost eller andra önskemål…" /></div>
              {fel && <div className="notice notice--fel field--full" role="alert">{fel}</div>}
              <div className="field--full cta-row">
                <button className="btn" type="submit" disabled={pending}>{pending ? "Skickar…" : valt.kvar <= 0 ? "Ställ mig på väntelista" : "Skicka anmälan"}</button>
                <a className="btn btn--ghost" href={site.phoneHref}>Ring {site.phone}</a>
              </div>
            </form>
          </div>
        ) : (
          <p className="muted">Välj dag och tid ovan för att anmäla dig — eller ring <a href={site.phoneHref}>{site.phone}</a>.</p>
        )}
      </div>
    </div>
  );
}
