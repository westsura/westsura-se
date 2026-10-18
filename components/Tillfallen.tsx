"use client";

import { useState, useTransition } from "react";
import { skapaAnmalan } from "@/app/actions";
import { site } from "@/lib/site";
import { platsstatus } from "@/lib/sittning";
import AntalFalt from "@/components/AntalFalt";

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
  /** Gästplats på jaktklubbens egen jakt — en plats per anmälan, bekräftas efter granskade handlingar. */
  gast?: boolean;
};

const TYP: Record<Tillfalle["typ"], string> = { jakt: "Jakttillfälle", hundtraning: "Hundträning", jaktkurs: "Jaktkurs", evenemang: "Evenemang" };
/** Vad som är bra att få veta i meddelandet, per typ av tillfälle. */
const MEDDELANDE: Record<Tillfalle["typ"], string> = {
  jakt: "Valfritt — erfarenhet, hund, önskemål…",
  hundtraning: "Valfritt — hundens ras och ålder, vad ni vill träna…",
  jaktkurs: "Valfritt — förkunskaper, önskemål…",
  evenemang: "Valfritt — allergier, specialkost eller andra önskemål…",
};
const MAN = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
function fmt(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return { dag: ["sön", "mån", "tis", "ons", "tor", "fre", "lör"][d.getDay()], d: d.getDate(), m: MAN[d.getMonth()] };
}
const kr = (n: number | null) => (n == null ? "" : n === 0 ? "Fri entré" : n.toLocaleString("sv-SE") + " kr");

/** Lista över utlysta tillfällen med anmälan direkt till databasen. */
export default function Tillfallen({ tillfallen, rubrik = "Kommande tillfällen", barn }: { tillfallen: Tillfalle[]; rubrik?: string; barn?: { pris: number; alder: number } | null }) {
  // Ett enda tillfälle (t.ex. på en evenemangssida) är förvalt, så att anmälan syns direkt.
  const [valt, setValt] = useState<Tillfalle | null>(tillfallen.length === 1 ? tillfallen[0] : null);
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
                  <span className="tf-meta">{t.gast ? "Gästplats på jaktklubbens jakt" : TYP[t.typ]}{t.tid ? ` · ${t.tid}` : ""} · {full ? "Fullbokat" : platsstatus(t.kvar, t.platser).text}</span>
                  <button className={`btn${ar || full ? " btn--ghost" : ""}`} type="button" onClick={() => { setValt(t); setResultat(null); setFel(null); }}>
                    {ar ? "Vald" : full ? "Ställ mig på väntelista" : "Boka plats"}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div id="forfragan" className="tf-anmalan">
        {resultat ? (
          <div className="notice notice--lg" role="status">
            <strong>{resultat.status === "vantelista" ? "Du står på väntelistan." : "Tack för din anmälan."}</strong>{" "}
            {resultat.status === "vantelista" ? "Vi hör av oss om en plats blir ledig." : valt?.gast ? "Gästplatsen är reserverad åt dig. Vi bekräftar den när vi har granskat dina handlingar, och fakturan kommer efter jaktdagen." : valt?.typ === "evenemang" && valt.pris ? `Dina platser är reserverade. Betala med Swish till ${site.swish} och skriv ditt namn och antal platser i meddelandet — bokningen är klar när betalningen har kommit in.` : "Vi bekräftar platsen inom en vardag."} En bekräftelse har skickats till din e-post.
            {valt?.typ === "jakt" && <> Jakten kräver jaktkort, ID-handling och vår säkerhetskurs online — du har fått ett jägarkonto där du laddar upp och gör kursen. <a href="/jaktklubb/login">Logga in på jägarkontot →</a></>}
          </div>
        ) : valt ? (
          <div className="card card--accent">
            <p className="label">{valt.kvar <= 0 ? "Väntelista" : "Anmälan"}</p>
            <h3>{valt.titel} · {fmt(valt.datum).d} {fmt(valt.datum).m}</h3>
            <p className="small">{valt.gast
              ? "En gästplats på jaktklubbens egen jakt. Efter anmälan får du ett jägarkonto där du laddar upp jaktkort och ID-handling och gör vår säkerhetskurs online. Vi bekräftar platsen när handlingarna är granskade. Faktura efter jaktdagen."
              : valt.typ === "evenemang" && valt.pris
              ? `Betalning sker i förskott med Swish till ${site.swish} — bokningen är klar när betalningen har kommit in. Instruktioner kommer i bekräftelsemejlet.`
              : "Fyll i uppgifterna så bekräftar vi platsen inom en vardag. Anmälan är bindande först när ni fått vår bekräftelse."}</p>
            <form className="form" onSubmit={anmal}>
              <div className="field"><label htmlFor="a-namn">Namn</label><input id="a-namn" name="namn" required autoComplete="name" /></div>
              {valt.gast
                ? <input type="hidden" name="antal" value="1" />
                : <AntalFalt pris={valt.pris} barnpris={barn?.pris} barnAlder={barn?.alder} standard={valt.typ === "evenemang" ? 2 : 1} />}
              <div className="field"><label htmlFor="a-epost">E-post</label><input id="a-epost" name="epost" type="email" required autoComplete="email" /></div>
              <div className="field"><label htmlFor="a-tel">Telefon</label><input id="a-tel" name="telefon" type="tel" autoComplete="tel" /></div>
              <div className="field field--full"><label htmlFor="a-medd">Meddelande</label><textarea id="a-medd" name="meddelande" className="ta--s" placeholder={MEDDELANDE[valt.typ]} /></div>
              {fel && <div className="notice notice--fel field--full" role="alert">{fel}</div>}
              <div className="field--full cta-row">
                <button className="btn" type="submit" disabled={pending}>{pending ? "Skickar…" : valt.kvar <= 0 ? "Ställ mig på väntelista" : "Skicka anmälan"}</button>
                <a className="btn btn--ghost" href={site.phoneHref}>Ring {site.phone}</a>
              </div>
            </form>
          </div>
        ) : (
          <p className="muted">Välj ett tillfälle ovan för att anmäla dig — eller ring <a href={site.phoneHref}>{site.phone}</a>.</p>
        )}
      </div>
    </div>
  );
}
