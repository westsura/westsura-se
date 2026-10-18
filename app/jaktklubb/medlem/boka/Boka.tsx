"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useMemo, useState, useTransition } from "react";
import { bokaJaktdag } from "@/app/jaktklubb/actions";
import { MANAD, VECKODAG } from "../delar";
import { platsstatus } from "@/lib/sittning";

export type Jaktdag = {
  id: string; titel: string; beskrivning: string | null; datum: string; tid: string | null;
  samling: string | null; program: string | null; platser: number; kvar: number; minStatus: string | null;
  pris?: number | null; synlighet?: string;
  /** Gästplats på jaktklubbens egen jakt (visas bara för gästjägare). */
  gastplats?: boolean;
};
const kr = (n: number) => n.toLocaleString("sv-SE") + " kr";

const manadsnyckel = (d: string) => d.slice(0, 7);
const manadsnamn = (n: string) => `${MANAD[Number(n.slice(5, 7)) - 1]} ${n.slice(0, 4)}`;

/** Statusraden på en jaktdag: egen bokning först, annars platser kvar. */
function status(j: Jaktdag) {
  if (j.minStatus === "vantelista") return "Du står på kölistan";
  if (j.minStatus) return "Du är bokad";
  return platsText(j);
}

/** Antal visas aldrig — bara "Få platser kvar" när det börjar ta slut. */
const platsText = (j: Jaktdag) => (j.kvar <= 0 ? "Fullbokad · kölista" : platsstatus(j.kvar, j.platser).text);

export default function Boka({ jaktdagar, dokumentKlara, kursKlar = true, gast = false }: { jaktdagar: Jaktdag[]; dokumentKlara: boolean; kursKlar?: boolean; gast?: boolean }) {
  const manader = useMemo(() => [...new Set(jaktdagar.map((j) => manadsnyckel(j.datum)))].sort(), [jaktdagar]);
  // Alla kommande jaktdagar visas från start; månadsknapparna är bara ett filter.
  const [manad, setManad] = useState<string | null>(null);
  const [valdId, setValdId] = useState<string | null>(jaktdagar[0]?.id ?? null);
  const [fel, setFel] = useState<string | null>(null);
  const [kvitto, setKvitto] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const visade = manad ? jaktdagar.filter((j) => manadsnyckel(j.datum) === manad) : jaktdagar;
  const vald = jaktdagar.find((j) => j.id === valdId) ?? visade[0] ?? null;

  const boka = () => start(async () => {
    setFel(null); setKvitto(null);
    const r = await bokaJaktdag(vald!.id);
    if (!r.ok) { setFel(r.fel ?? "Bokningen gick inte igenom."); return; }
    setKvitto((r.status === "vantelista"
      ? "Jaktdagen var fullbokad — du står på kölistan och vi hör av oss om en plats blir ledig."
      : r.gastplats
        ? "Gästplatsen är reserverad åt dig. Vi bekräftar den när dina handlingar är granskade."
        : "Din plats är bokad. Bekräftelsen ligger i din inkorg.") + (kursKlar ? "" : " Kom ihåg säkerhetskursen före jaktdagen."));
    router.refresh();
  });

  return (
    <>
      <div className="jk-jaktform">
        <span className="btn" aria-current="page">Gemensam jakt</span>
        <Link className="btn btn--ghost" href="/jaktklubb/medlem/vak">Vak &amp; pyrsch</Link>
      </div>

      <div className="jk-manad" style={{ flexWrap: "wrap", gap: 8 }}>
        <b>{manad ? `${visade.length} ${visade.length === 1 ? "jaktdag" : "jaktdagar"} i ${manadsnamn(manad)}` : `Alla kommande jaktdagar · ${jaktdagar.length} st`}</b>
        <span className="jk-head__luft" />
        {manader.length > 1 && (
          <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }} role="group" aria-label="Visa månad">
            <button type="button" className={`btn btn--sm${manad ? " btn--ghost" : ""}`} aria-pressed={!manad} onClick={() => setManad(null)}>Alla</button>
            {manader.map((m) => (
              <button key={m} type="button" className={`btn btn--sm${manad === m ? "" : " btn--ghost"}`} aria-pressed={manad === m} onClick={() => setManad(m)}>
                {MANAD[Number(m.slice(5, 7)) - 1].slice(0, 3)}
              </button>
            ))}
          </span>
        )}
      </div>

      <div className="jk-boka">
        <div className="jk-boka__lista">
          {!visade.length && <p className="jk-lede">Inga jaktdagar den här månaden.</p>}
          {visade.map((j, n) => {
            const d = new Date(j.datum);
            // I listan över alla datum får varje ny månad en egen rubrik.
            const nyManad = !manad && (n === 0 || manadsnyckel(visade[n - 1].datum) !== manadsnyckel(j.datum));
            return (
              <Fragment key={j.id}>
              {nyManad && <p className="jk-etikett" style={{ margin: n === 0 ? "0 0 6px" : "18px 0 6px" }}>{manadsnamn(manadsnyckel(j.datum))}</p>}
              <button type="button" onClick={() => setValdId(j.id)}
                className={`jk-jaktrad${j.id === vald?.id ? " jk-jaktrad--vald" : ""}`} aria-current={j.id === vald?.id ? "true" : undefined}>
                <span className="jk-jaktrad__datum"><b>{d.getDate()}</b><span>{MANAD[d.getMonth()].slice(0, 3)}</span></span>
                <span className="jk-jaktrad__text">
                  <span className="jk-jaktrad__titel">{j.titel}</span>
                  <span className="jk-jaktrad__tid">{VECKODAG[d.getDay()].replace(/^./, (c) => c.toUpperCase())}{j.tid ? ` · ${j.tid}` : ""}</span>
                  <span className="jk-jaktrad__status">{status(j)}</span>
                </span>
                <span className="jk-jaktrad__pil">→</span>
              </button>
              </Fragment>
            );
          })}
        </div>

        {vald && (
          <aside className="jk-kort jk-kort--ljus jk-boka__detalj">
            <p className="jk-etikett">
              {VECKODAG[new Date(vald.datum).getDay()]} {new Date(vald.datum).getDate()} {MANAD[new Date(vald.datum).getMonth()]}
            </p>
            <p className="jk-kort__rubrik jk-kort__rubrik--mork">{vald.titel}</p>
            {vald.beskrivning && <p className="jk-lede">{vald.beskrivning}</p>}
            {vald.program && (
              <>
                <div className="jk-avdelare" />
                <div className="jk-program">{vald.program.split("\n").filter(Boolean).map((rad, n) => <p key={n}>{rad}</p>)}</div>
              </>
            )}
            <div className="jk-avdelare" />
            <p className="jk-etikett" style={{ margin: 0 }}>{platsText(vald)}</p>
            <p className="jk-hjalp">
              {vald.gastplats
                ? <>Gästplats på jaktklubbens jakt{vald.pris ? ` — ${kr(vald.pris)}, faktureras efter jaktdagen` : ""}.<br />Platsen bekräftas när dina handlingar är granskade.</>
                : <>{vald.synlighet === "publik" && (gast || vald.pris) ? (vald.pris ? `${kr(vald.pris)} per person — faktureras efter jaktdagen.` : "Öppen jaktdag.") : "Ingår enligt ditt medlemskap."}
                  <br />Din plats bekräftas i nästa steg.</>}
            </p>

            {kvitto && <p className="notice">{kvitto}</p>}
            {fel && <p className="notice notice--fel" role="alert">{fel}</p>}

            {vald.minStatus ? (
              <Link className="btn btn--ghost btn--block" href="/jaktklubb/medlem/bokningar">Visa min bokning</Link>
            ) : (
              <button className="btn btn--block" type="button" disabled={pending || (gast && !dokumentKlara && !vald.gastplats)} onClick={boka}>
                {pending ? "Bokar…" : vald.gastplats ? "Anmäl mig till gästplatsen" : "Fortsätt till bokning"}
              </button>
            )}
            {!dokumentKlara && !vald.minStatus && (
              <p className="jk-hjalp">
                {vald.gastplats
                  ? <>Ladda upp jaktkort och ID på <Link className="jk-lank" href="/jaktklubb/medlem/medlemskap">Mitt jägarkonto</Link> så att vi kan granska dem och bekräfta platsen.</>
                  : gast
                  ? <>Ladda upp och få dina dokument godkända innan du bokar — <Link className="jk-lank" href="/jaktklubb/medlem/medlemskap">Mitt jägarkonto</Link>.</>
                  : <>Du kan anmäla dig nu. Kom ihåg att jaktkort, ID och älgskyttemärke ska vara uppladdade och godkända innan du kommer på jakten — <Link className="jk-lank" href="/jaktklubb/medlem/medlemskap">Mitt medlemskap</Link>.</>}
              </p>
            )}
          </aside>
        )}
      </div>
    </>
  );
}
