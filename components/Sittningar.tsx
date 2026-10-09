"use client";

import { useState, useTransition } from "react";
import { skapaAnmalan } from "@/app/actions";
import { site } from "@/lib/site";
import { dagRubrik, platsstatus, type Sittning } from "@/lib/sittning";
import AntalFalt from "@/components/AntalFalt";

const kr = (n: number | null) => (n == null ? "" : n === 0 ? "Fri entré" : n.toLocaleString("sv-SE") + " kr");

/**
 * Anmälan med val av sittning, synlig direkt: först tid, sedan uppgifterna.
 * Antal platser visas inte — bara "Få platser kvar" och "Fullbokat".
 */
export default function Sittningar({ tillfalleId, titel, pris, barnpris, barnAlder, sittningar }: { tillfalleId: string; titel: string; pris: number | null; barnpris?: number | null; barnAlder?: number; sittningar: Sittning[] }) {
  const idag = new Date().toISOString().slice(0, 10);
  const kommande = sittningar.filter((s) => s.datum >= idag);
  const [valt, setValt] = useState<Sittning | null>(kommande.length === 1 ? kommande[0] : null);
  const [resultat, setResultat] = useState<string | null>(null);
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const dagar = [...new Set(kommande.map((s) => s.datum))];
  const prisNu = valt ? valt.pris ?? pris : pris;

  if (!kommande.length) return <p className="empty">Alla sittningar har varit. Ring {site.phone} om du har frågor.</p>;
  if (resultat) return <div className="notice notice--lg" role="status">{resultat}</div>;

  return (
    <div className="card card--accent" id="anmalan">
      <p className="label">Anmälan</p>
      <h3>{titel}</h3>
      <p className="small">Välj tid och fyll i dina uppgifter, så bekräftar vi platsen inom en vardag.{prisNu != null ? ` Pris: ${kr(prisNu)}${prisNu ? " per person" : ""}${barnpris != null ? `, barn upp till ${barnAlder ?? 12} år ${kr(barnpris)}` : ""}.` : ""}</p>

      <p className="field-label" style={{ margin: "18px 0 10px" }}>1 · Välj sittning</p>
      {dagar.map((d) => (
        <div key={d} style={{ marginBottom: 14 }}>
          {dagar.length > 1 && <p style={{ fontWeight: 600, margin: "0 0 8px" }}>{dagRubrik(d)}</p>}
          {dagar.length === 1 && <p style={{ margin: "0 0 8px" }}>{dagRubrik(d)}</p>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {kommande.filter((s) => s.datum === d).map((s) => {
              const st = platsstatus(s.kvar, s.platser);
              const ar = valt?.id === s.id;
              return (
                <button key={s.id} type="button" onClick={() => { setValt(s); setFel(null); }}
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

      <p className="field-label" style={{ margin: "18px 0 10px" }}>2 · Dina uppgifter</p>
      <form className="form" onSubmit={(e) => {
        e.preventDefault();
        if (!valt) { setFel("Välj en sittning ovan först."); return; }
        const fd = new FormData(e.currentTarget);
        fd.set("tillfalle", tillfalleId); fd.set("sittning", valt.id);
        setFel(null);
        start(async () => {
          const r = await skapaAnmalan(fd);
          if (!r.ok) { setFel(r.fel); return; }
          setResultat(r.data.status === "vantelista"
            ? `Du står på väntelistan för ${dagRubrik(valt.datum).toLowerCase()}${valt.tid ? " kl. " + valt.tid : ""}. Vi hör av oss om en plats blir ledig — en bekräftelse har skickats till din e-post.`
            : `Tack för din anmälan till ${dagRubrik(valt.datum).toLowerCase()}${valt.tid ? " kl. " + valt.tid : ""}! Vi bekräftar platsen inom en vardag. En kopia har skickats till din e-post.`);
        });
      }}>
        <div className="field"><label htmlFor="s-namn">Namn</label><input id="s-namn" name="namn" required autoComplete="name" /></div>
        <div className="field"><label htmlFor="s-epost">E-post</label><input id="s-epost" name="epost" type="email" required autoComplete="email" /></div>
        <div className="field"><label htmlFor="s-tel">Telefon</label><input id="s-tel" name="telefon" type="tel" autoComplete="tel" /></div>
        <AntalFalt pris={prisNu} barnpris={barnpris} barnAlder={barnAlder} />
        <div className="field field--full"><label htmlFor="s-medd">Meddelande</label><textarea id="s-medd" name="meddelande" className="ta--s" placeholder="Valfritt — allergier, specialkost eller andra önskemål…" /></div>
        {valt && valt.kvar <= 0 && <p className="notice field--full">Sittningen är fullbokad — skickar du anmälan hamnar du på väntelistan.</p>}
        {fel && <div className="notice notice--fel field--full" role="alert">{fel}</div>}
        <div className="field--full cta-row">
          <button className="btn" type="submit" disabled={pending}>
            {pending ? "Skickar…" : !valt ? "Skicka anmälan" : valt.kvar <= 0 ? "Ställ mig på väntelista" : `Anmäl till ${valt.tid ?? dagRubrik(valt.datum).toLowerCase()}`}
          </button>
          <a className="btn btn--ghost" href={site.phoneHref}>Ring {site.phone}</a>
        </div>
      </form>
    </div>
  );
}
