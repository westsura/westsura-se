"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onskaVakdygn } from "@/app/jaktklubb/actions";
import { OMRADETYP, VAKTYP, kr, type Omrade, type Utbud } from "@/lib/vak";
import { MANAD, VECKODAG } from "../delar";

type Props = {
  gast: boolean;
  omraden: Omrade[];
  utbud: Utbud[];
  kvotText: string | null;
  dokumentKlara: boolean;
};

/** Välj ett av de utlagda dygnen och önska det. Datumen släpps av herrgården. */
export default function VakForm({ gast, omraden, utbud, kvotText, dokumentKlara }: Props) {
  const [valt, setValt] = useState<Utbud | null>(utbud[0] ?? null);
  const [kvitto, setKvitto] = useState<string | null>(null);
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function skicka(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!valt) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("utbud", valt.id);
    setFel(null); setKvitto(null);
    start(async () => {
      const r = await onskaVakdygn(fd);
      if (!r.ok) { setFel(r.fel ?? "Det gick inte att skicka önskan."); return; }
      setKvitto(`Din önskan är skickad — jaktledaren bekräftar inom en vardag.${r.pris ? ` Pris ${kr(r.pris)}, faktureras efter dygnet.` : ""}`);
      form.reset();
      router.refresh();
    });
  }

  if (!utbud.length) {
    return (
      <section className="jk-kort jk-kort--ljus jk-kort--bred">
        <p className="jk-etikett">Utlagda dygn</p>
        <p className="jk-lede mb-0">Inga vak- eller pyrschdygn ligger ute just nu. Herrgården släpper dygn löpande under säsongen, mellan drevjakterna — titta in igen, eller ring oss.</p>
      </section>
    );
  }

  const d = valt ? new Date(valt.datum) : null;

  return (
    <div className="jk-boka">
      <div className="jk-boka__lista">
        {utbud.map((u) => {
          const dd = new Date(u.datum);
          const ar = valt?.id === u.id;
          return (
            <button key={u.id} type="button" onClick={() => { setValt(u); setKvitto(null); setFel(null); }}
              className={`jk-jaktrad${ar ? " jk-jaktrad--vald" : ""}`} aria-current={ar ? "true" : undefined}>
              <span className="jk-jaktrad__datum"><b>{dd.getDate()}</b><span>{MANAD[dd.getMonth()].slice(0, 3)}</span></span>
              <span className="jk-jaktrad__text">
                <span className="jk-jaktrad__titel">{VAKTYP[u.typ]}{u.beskrivning ? ` · ${u.beskrivning}` : ""}</span>
                <span className="jk-jaktrad__tid">{VECKODAG[dd.getDay()].replace(/^./, (c) => c.toUpperCase())}{u.synlighet === "alla" && !gast ? " · öppet även för gäster" : ""}</span>
                <span className="jk-jaktrad__status">{gast ? kr(u.pris) : "Enligt ditt medlemskap"}</span>
              </span>
              <span className="jk-jaktrad__pil">→</span>
            </button>
          );
        })}
      </div>

      {valt && d && (
        <aside className="jk-kort jk-kort--ljus jk-boka__detalj">
          <p className="jk-etikett">{VECKODAG[d.getDay()]} {d.getDate()} {MANAD[d.getMonth()]}</p>
          <p className="jk-kort__rubrik jk-kort__rubrik--mork">{VAKTYP[valt.typ]}</p>
          {valt.beskrivning && <p className="jk-lede">{valt.beskrivning}</p>}
          {kvotText && <p className="jk-hjalp">{kvotText}</p>}
          {gast && <p className="jk-hjalp">{kr(valt.pris)} — faktureras efter dygnet.</p>}

          <form className="form form--1" onSubmit={skicka}>
            {valt.typ === "bada" && (
              <div className="field">
                <label htmlFor="vak-typ">Jaktform</label>
                <select id="vak-typ" name="typ" defaultValue="vak">
                  <option value="vak">Vak — från torn eller vakplats</option>
                  <option value="pyrsch">Pyrsch — smygjakt i ett område</option>
                </select>
              </div>
            )}
            {!gast && omraden.length > 0 && (
              <div className="field">
                <label htmlFor="vak-omrade">Önskat område <small>valfritt</small></label>
                <select id="vak-omrade" name="omrade" defaultValue="">
                  <option value="">Jaktledaren föreslår</option>
                  {omraden.map((o) => <option key={o.id} value={o.id}>{o.namn} · {OMRADETYP[o.typ]}</option>)}
                </select>
              </div>
            )}
            <div className="field">
              <label htmlFor="vak-medd">Meddelande <small>valfritt</small></label>
              <textarea id="vak-medd" name="meddelande" className="ta--xs" placeholder="Vilt du helst vill jaga, tid på dygnet, hund…" />
            </div>

            {kvitto && <p className="notice">{kvitto}</p>}
            {fel && <p className="notice notice--fel" role="alert">{fel}</p>}

            <button className="btn btn--block" type="submit" disabled={pending || !dokumentKlara}>
              {pending ? "Skickar…" : gast ? "Boka dygnet" : "Önska dygnet"}
            </button>
            <p className="jk-hjalp">Jaktledaren tilldelar torn eller område och bekräftar. Först då är dygnet ditt.</p>
            {!dokumentKlara && (
              <p className="jk-hjalp">
                Ladda upp och få dina dokument godkända innan du bokar — <Link className="jk-lank" href="/jaktklubb/medlem/medlemskap">{gast ? "Mitt jägarkonto" : "Mitt medlemskap"}</Link>.
              </p>
            )}
          </form>
        </aside>
      )}
    </div>
  );
}
