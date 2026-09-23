"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { bokaJaktdag } from "@/app/jaktklubb/actions";
import { MANAD, VECKODAG } from "../delar";

export type Jaktdag = {
  id: string; titel: string; beskrivning: string | null; datum: string; tid: string | null;
  samling: string | null; program: string | null; platser: number; kvar: number; minStatus: string | null;
  pris?: number | null; synlighet?: string;
};
const kr = (n: number) => n.toLocaleString("sv-SE") + " kr";

const manadsnyckel = (d: string) => d.slice(0, 7);
const manadsnamn = (n: string) => `${MANAD[Number(n.slice(5, 7)) - 1]} ${n.slice(0, 4)}`;

/** Statusraden på en jaktdag: egen bokning först, annars platser kvar. */
function status(j: Jaktdag) {
  if (j.minStatus === "vantelista") return "Du står på kölistan";
  if (j.minStatus) return "Du är bokad";
  if (j.kvar <= 0) return "Fullbokad · kölista";
  return `${j.kvar} platser kvar`;
}

export default function Boka({ jaktdagar, dokumentKlara, kursKlar = true, gast = false }: { jaktdagar: Jaktdag[]; dokumentKlara: boolean; kursKlar?: boolean; gast?: boolean }) {
  const manader = useMemo(() => [...new Set(jaktdagar.map((j) => manadsnyckel(j.datum)))].sort(), [jaktdagar]);
  const [manad, setManad] = useState<string | null>(manader[0] ?? null);
  const [valdId, setValdId] = useState<string | null>(jaktdagar[0]?.id ?? null);
  const [fel, setFel] = useState<string | null>(null);
  const [kvitto, setKvitto] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const visade = manad ? jaktdagar.filter((j) => manadsnyckel(j.datum) === manad) : jaktdagar;
  const vald = jaktdagar.find((j) => j.id === valdId) ?? visade[0] ?? null;
  const i = manad ? manader.indexOf(manad) : -1;

  const boka = () => start(async () => {
    setFel(null); setKvitto(null);
    const r = await bokaJaktdag(vald!.id);
    if (!r.ok) { setFel(r.fel ?? "Bokningen gick inte igenom."); return; }
    setKvitto((r.status === "vantelista"
      ? "Jaktdagen var fullbokad — du står på kölistan och vi hör av oss om en plats blir ledig."
      : "Din plats är bokad. Bekräftelsen ligger i din inkorg.") + (kursKlar ? "" : " Kom ihåg säkerhetskursen före jaktdagen."));
    router.refresh();
  });

  return (
    <>
      <div className="jk-jaktform">
        <span className="btn" aria-current="page">Gemensam jakt</span>
        <Link className="btn btn--ghost" href="/jaktklubb/medlem/vak">Vak &amp; pyrsch</Link>
      </div>

      <div className="jk-manad">
        <b>{manad ? manadsnamn(manad) : "Alla datum"}</b>
        <span className="jk-manad__pilar">
          <button type="button" disabled={i <= 0} onClick={() => setManad(manader[i - 1])} aria-label="Föregående månad">←</button>
          <button type="button" disabled={i < 0 || i >= manader.length - 1} onClick={() => setManad(manader[i + 1])} aria-label="Nästa månad">→</button>
        </span>
        <span className="jk-head__luft" />
        <button type="button" className="jk-manad__alla" onClick={() => setManad(null)}>
          Alla datum&nbsp; · &nbsp;{visade.length} {visade.length === 1 ? "jaktdag" : "jaktdagar"}
        </button>
      </div>

      <div className="jk-boka">
        <div className="jk-boka__lista">
          {!visade.length && <p className="jk-lede">Inga jaktdagar den här månaden.</p>}
          {visade.map((j) => {
            const d = new Date(j.datum);
            return (
              <button key={j.id} type="button" onClick={() => setValdId(j.id)}
                className={`jk-jaktrad${j.id === vald?.id ? " jk-jaktrad--vald" : ""}`} aria-current={j.id === vald?.id ? "true" : undefined}>
                <span className="jk-jaktrad__datum"><b>{d.getDate()}</b><span>{MANAD[d.getMonth()].slice(0, 3)}</span></span>
                <span className="jk-jaktrad__text">
                  <span className="jk-jaktrad__titel">{j.titel}</span>
                  <span className="jk-jaktrad__tid">{VECKODAG[d.getDay()].replace(/^./, (c) => c.toUpperCase())}{j.tid ? ` · ${j.tid}` : ""}</span>
                  <span className="jk-jaktrad__status">{status(j)}</span>
                </span>
                <span className="jk-jaktrad__pil">→</span>
              </button>
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
            <p className="jk-etikett" style={{ margin: 0 }}>{vald.kvar > 0 ? `${vald.kvar} platser kvar` : "Fullbokad · kölista"}</p>
            <p className="jk-hjalp">
              {vald.synlighet === "publik" && (gast || vald.pris) ? (vald.pris ? `${kr(vald.pris)} per person — faktureras efter jaktdagen.` : "Öppen jaktdag.") : "Ingår enligt ditt medlemskap."}
              <br />Din plats bekräftas i nästa steg.
            </p>

            {kvitto && <p className="notice">{kvitto}</p>}
            {fel && <p className="notice notice--fel" role="alert">{fel}</p>}

            {vald.minStatus ? (
              <Link className="btn btn--ghost btn--block" href="/jaktklubb/medlem/bokningar">Visa min bokning</Link>
            ) : (
              <button className="btn btn--block" type="button" disabled={pending || !dokumentKlara} onClick={boka}>
                {pending ? "Bokar…" : "Fortsätt till bokning"}
              </button>
            )}
            {!dokumentKlara && !vald.minStatus && (
              <p className="jk-hjalp">
                Ladda upp och få dina dokument godkända innan du bokar — <Link className="jk-lank" href="/jaktklubb/medlem/medlemskap">Mitt medlemskap</Link>.
              </p>
            )}
          </aside>
        )}
      </div>
    </>
  );
}
