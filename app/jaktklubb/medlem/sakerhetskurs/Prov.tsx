"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startaProv, lamnaProv, type Provfraga, type Provresultat } from "@/app/jaktklubb/actions";

/** Provet: hämtar slumpade frågor från servern, rättas på servern. */
export default function Prov({ redanGodkand }: { redanGodkand: boolean }) {
  const [provId, setProvId] = useState<string | null>(null);
  const [fragor, setFragor] = useState<Provfraga[]>([]);
  const [svar, setSvar] = useState<Record<string, number>>({});
  const [resultat, setResultat] = useState<Provresultat | null>(null);
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const starta = () => start(async () => {
    setFel(null); setResultat(null); setSvar({});
    const r = await startaProv();
    if (!r.ok) { setFel(r.fel); return; }
    setProvId(r.provId); setFragor(r.fragor);
    setTimeout(() => document.getElementById("prov")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  });

  const lamna = () => start(async () => {
    setFel(null);
    const r = await lamnaProv(provId!, svar);
    if (!r.ok) { setFel(r.fel); return; }
    setResultat(r.resultat); setProvId(null); setFragor([]);
    router.refresh();
    setTimeout(() => document.getElementById("prov")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  });

  const besvarade = fragor.filter((f) => typeof svar[f.id] === "number").length;

  if (resultat) {
    const fela = resultat.genomgang.filter((g) => g.ditt !== g.ratt);
    return (
      <div className="jk-kort jk-kort--bred jk-kort--ljus kurs__resultat">
        <p className="jk-etikett">Resultat</p>
        <p className="jk-kort__rubrik jk-kort__rubrik--mork">
          {resultat.godkand ? "Godkänt — välkommen ut i skogen." : "Inte godkänt den här gången."}
        </p>
        <p className="jk-lede">
          {resultat.poang} av {resultat.max} rätt ({resultat.procent} %).
          {resultat.kritisktFel && " Minst en säkerhetskritisk fråga blev fel — de måste alla vara rätt."}
          {!resultat.kritisktFel && !resultat.godkand && ` Godkänt kräver ${resultat.godkantProcent} %.`}
        </p>
        {!!fela.length && (
          <>
            <div className="jk-avdelare" />
            <p className="jk-etikett">Gå igenom det här igen</p>
            {fela.map((g) => (
              <div key={g.id} className="kurs__fel">
                <p className="kurs__fel-fraga">{g.fraga}{g.kritisk && <span className="kurs__kritisk">Säkerhetskritisk</span>}</p>
                <p className="jk-hjalp">Ditt svar: {g.ditt >= 0 ? g.alternativ[g.ditt] : "obesvarad"}</p>
                <p className="jk-hjalp">Rätt svar: <b>{g.alternativ[g.ratt]}</b></p>
                {g.forklaring && <p className="kurs__forklaring">{g.forklaring}</p>}
                {g.avsnitt && <p className="jk-hjalp">Läs om: {g.avsnitt}</p>}
              </div>
            ))}
          </>
        )}
        <div className="jk-avdelare" />
        <div className="cta-row">
          {!resultat.godkand && <button className="btn" type="button" disabled={pending} onClick={starta}>{pending ? "Hämtar…" : "Gör om provet"}</button>}
          {resultat.godkand && <a className="btn" href="/jaktklubb/medlem/boka">Boka en jaktdag</a>}
          <a className="btn btn--ghost" href="#avsnitt-1">Läs kursen igen</a>
        </div>
      </div>
    );
  }

  if (!provId) {
    return (
      <div className="jk-kort jk-kort--bred jk-kort--ljus">
        <p className="jk-lede">
          {redanGodkand ? "Du är redan godkänd. Vill du repetera kan du göra provet igen — resultatet påverkar inte din status." : "När du läst avsnitten ovan startar du provet här. Du kan göra om det så många gånger du behöver."}
        </p>
        {fel && <p className="notice notice--fel" role="alert">{fel}</p>}
        <button className="btn" type="button" disabled={pending} onClick={starta}>{pending ? "Hämtar frågor…" : "Starta provet"}</button>
      </div>
    );
  }

  return (
    <div className="kurs__prov">
      {fragor.map((f, i) => (
        <fieldset key={f.id} className="kurs__fraga">
          <legend><span className="jk-etikett">Fråga {i + 1} av {fragor.length}</span><span className="kurs__fraga-text">{f.fraga}</span></legend>
          {f.alternativ.map((alt, n) => (
            <label key={n} className={`kurs__alt${svar[f.id] === n ? " kurs__alt--vald" : ""}`}>
              <input type="radio" name={f.id} value={n} checked={svar[f.id] === n} onChange={() => setSvar((s) => ({ ...s, [f.id]: n }))} />
              <span>{alt}</span>
            </label>
          ))}
        </fieldset>
      ))}
      <div className="jk-kort jk-kort--bred jk-kort--ljus">
        <p className="jk-lede">{besvarade} av {fragor.length} besvarade.</p>
        {fel && <p className="notice notice--fel" role="alert">{fel}</p>}
        <button className="btn" type="button" disabled={pending || besvarade < fragor.length} onClick={lamna}>{pending ? "Rättar…" : "Lämna in provet"}</button>
      </div>
    </div>
  );
}
