"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import Fakturafalt from "@/components/Fakturafalt";
import { hamtaTillganglighet, hamtaPris, skapaBokning } from "@/app/actions";
import { img, site } from "@/lib/site";

export type Enhet = {
  id: string; namn: string; ordning: number; ingar_i: string | null; ar_hela_boendet: boolean;
  baddar: number; grundpris: number; egenskaper: string[]; beskrivning: string | null; notering: string | null; bild: string | null;
};

type Prisrad = { enhet_id: string; natter: number; pris_per_natt: number; belopp: number; frukost_belopp: number; rabatt: number; summa: number };

const kr = (n: number) => n.toLocaleString("sv-SE") + " kr";
function plus(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); }
function natter(a: string, b: string) { const d = Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000); return d > 0 ? d : 0; }

const FALLBACK_BILD: Record<string, string> = { f1: img.sovrum, f2: img.sang, f2a: img.sang, f2b: img.sang, r1: img.sang, r2: img.sang, r3: img.sovrum, r4: img.sovrum, hela: img.sangStor };

export default function Booking({ enheter }: { enheter: Enhet[] }) {
  const params = useSearchParams();
  const idag = new Date();
  const [q, setQ] = useState({ in: params.get("in") || plus(idag, 7), out: params.get("out") || plus(idag, 9), guests: params.get("guests") || "2", dog: params.get("dog") === "1" });
  const [ledig, setLedig] = useState<Record<string, boolean>>({});
  const [laddar, setLaddar] = useState(true);
  const [valda, setValda] = useState<Set<string>>(new Set());
  const [frukost, setFrukost] = useState(false);
  const [kod, setKod] = useState("");
  const [pris, setPris] = useState<Prisrad[] | null>(null);
  const [visaDelrum, setVisaDelrum] = useState(false);
  const [steg, setSteg] = useState<"valj" | "uppgifter" | "klar">("valj");
  const [fel, setFel] = useState<string | null>(null);
  const [kvitto, setKvitto] = useState<{ nummer: number; summa: number } | null>(null);
  const [pending, start] = useTransition();

  const n = natter(q.in, q.out);
  const hela = enheter.find((e) => e.ar_hela_boendet);
  const vanliga = enheter.filter((e) => !e.ar_hela_boendet);
  const helaVald = !!hela && valda.has(hela.id);

  /* Tillgänglighet från databasen */
  const sok = useCallback(async (nq: typeof q) => {
    setQ(nq); setValda(new Set()); setPris(null); setLaddar(true); setFel(null);
    const r = await hamtaTillganglighet(nq.in, nq.out);
    if (r.ok) setLedig(r.data); else setFel(r.fel);
    setLaddar(false);
  }, []);
  useEffect(() => { sok(q); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  /* Pris från databasen när valet ändras */
  useEffect(() => {
    if (valda.size === 0) { setPris(null); return; }
    let aktiv = true;
    hamtaPris(Array.from(valda), q.in, q.out, frukost, Number(q.guests) || 2, kod).then((r) => { if (aktiv && r.ok) setPris(r.data); });
    return () => { aktiv = false; };
  }, [valda, q.in, q.out, q.guests, frukost, kod]);

  /* Enheter som innehåller varandra: valet spärrar släkten */
  const sparrad = (e: Enhet) => {
    if (helaVald && !e.ar_hela_boendet) return true;
    if (e.ar_hela_boendet && valda.size > 0 && !helaVald) return true;
    if (e.ingar_i && valda.has(e.ingar_i)) return true;
    if (enheter.some((x) => x.ingar_i === e.id && valda.has(x.id))) return true;
    return false;
  };

  const toggla = (id: string) => setValda((s) => { const x = new Set(s); if (x.has(id)) x.delete(id); else x.add(id); return x; });

  const synliga = vanliga.filter((e) => !e.ingar_i || visaDelrum);
  const antalLediga = vanliga.filter((e) => !e.ingar_i && ledig[e.id]).length;
  const summa = pris?.[0]?.summa ?? 0;

  const rader = useMemo(() => {
    if (!pris) return [];
    const r: { t: string; v: string; rabatt?: boolean }[] = pris.map((p) => ({ t: `${enheter.find((e) => e.id === p.enhet_id)?.namn ?? p.enhet_id} · ${p.natter} ${p.natter === 1 ? "natt" : "nätter"}`, v: kr(p.belopp) }));
    if (pris[0].frukost_belopp) r.push({ t: "Frukostkorg", v: kr(pris[0].frukost_belopp) });
    if (q.dog) r.push({ t: "Hund i rummet", v: "Ingen avgift" });
    if (pris[0].rabatt) r.push({ t: "Rabattkod", v: "−" + kr(pris[0].rabatt), rabatt: true });
    else if (kod.trim().length > 2) r.push({ t: "Koden känns inte igen", v: "—", rabatt: true });
    return r;
  }, [pris, q.dog, kod, enheter]);

  function boka(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("enheter", Array.from(valda).join(","));
    fd.set("ankomst", q.in); fd.set("avresa", q.out);
    fd.set("personer", q.guests); fd.set("hundar", q.dog ? "1" : "0");
    fd.set("frukost", frukost ? "1" : "0"); fd.set("kod", kod);
    setFel(null);
    start(async () => {
      const r = await skapaBokning(fd);
      if (r.ok) { setKvitto(r.data); setSteg("klar"); window.scrollTo({ top: (document.getElementById("bokning")?.offsetTop ?? 0) - 80, behavior: "smooth" }); }
      else { setFel(r.fel); if (/inte längre ledig/.test(r.fel)) { setSteg("valj"); sok(q); } }
    });
  }

  if (enheter.length === 0) {
    return (
      <section className="section section--tight tint" id="bokning">
        <div className="container"><div className="notice">Bokningen är tillfälligt otillgänglig. Ring oss på <a href={site.phoneHref}>{site.phone}</a> så hjälper vi dig.</div></div>
      </section>
    );
  }

  if (steg === "klar" && kvitto) {
    return (
      <section className="section section--tight tint" id="bokning">
        <div className="container" style={{ maxWidth: 720 }}>
          <div className="card" style={{ borderTopColor: "var(--accent)", padding: 40 }}>
            <p className="label">Bokning {kvitto.nummer}</p>
            <h2 className="lower">tack, vi har tagit emot din bokning</h2>
            <p>En bekräftelse är på väg till din e-post. Bokningen är preliminär tills du fått vår bekräftelse, som kommer inom en vardag. Summa {kr(kvitto.summa)} — betalning senast 7 dagar före ankomst.</p>
            <p style={{ marginBottom: 0 }}>Frågor? Ring <a href={site.phoneHref}>{site.phone}</a>.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section section--tight tint" id="bokning">
      <div className="container">
        <p className="label">Boka din vistelse</p>
        <h2 className="lower" style={{ marginBottom: 28 }}>se vad som är ledigt</h2>

        <SearchBar inline onSearch={sok} />

        <div className="results-head">
          <p>{laddar ? "Söker…" : `Lediga enheter · ${q.in} till ${q.out} · ${n} ${n === 1 ? "natt" : "nätter"}`}</p>
          <p><strong>{antalLediga} av {vanliga.filter((e) => !e.ingar_i).length}</strong> lediga</p>
        </div>
        {fel && <div className="notice" style={{ borderLeftColor: "#a33", marginBottom: 20 }}>{fel}</div>}

        <div className="booking">
          <div>
            {synliga.map((e) => {
              const vald = valda.has(e.id);
              const upptagen = !laddar && ledig[e.id] === false;
              const block = sparrad(e);
              return (
                <article key={e.id} className={`unit${vald ? " is-selected" : ""}${(upptagen || block) && !vald ? " is-unavailable" : ""}`}>
                  <div className="unit__img">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={e.bild || FALLBACK_BILD[e.id] || img.sang} alt={`${e.namn} på Westsura Herrgård`} loading="lazy" />
                  </div>
                  <div className="unit__body">
                    <div className="unit__top">
                      <h3>{e.namn}</h3>
                      <div className="unit__price"><span className="amount">{kr(e.grundpris)}</span><span className="per">per natt</span></div>
                    </div>
                    <ul className="unit__meta">
                      {e.egenskaper.map((x) => <li key={x}>{x}</li>)}
                      <li className="dog">Hundvänligt</li>
                    </ul>
                    {e.beskrivning && <p>{e.beskrivning}</p>}
                    {e.notering && <p className="unit__note">{e.notering}</p>}
                    <div className="unit__foot">
                      {e.id === "f2" && !vald && (
                        <button type="button" className="link-more" style={{ background: "none", border: 0, borderBottom: "1px solid var(--border-gold)", cursor: "pointer", marginRight: "auto" }} onClick={() => setVisaDelrum(!visaDelrum)}>
                          {visaDelrum ? "Dölj rummen" : "Visa rummen var för sig"}
                        </button>
                      )}
                      {laddar ? <span className="unit__status">Söker…</span>
                        : upptagen ? <span className="unit__status">Bokad dessa datum</span>
                        : block && !vald ? <span className="unit__status">{helaVald ? "Ingår i hela boendet" : "Upptagen av ditt val"}</span>
                        : (
                          <>
                            {vald && <span className="unit__status" style={{ color: "var(--accent-strong)" }}>Vald</span>}
                            <button className={`btn${vald ? " btn--ghost" : ""}`} type="button" onClick={() => toggla(e.id)}>{vald ? "Ta bort" : "Välj"}</button>
                          </>
                        )}
                    </div>
                  </div>
                </article>
              );
            })}

            {hela && (
              <div className="card" style={{ borderTopColor: "var(--accent)", marginTop: 28 }}>
                <h3>{hela.namn}</h3>
                <p style={{ fontSize: 17 }}>{hela.beskrivning}</p>
                <p className="price price--lg">{kr(hela.grundpris)}<small>per natt</small></p>
                {!laddar && ledig[hela.id] === false
                  ? <span className="unit__status">Någon enhet är bokad dessa datum — hela boendet går inte att boka</span>
                  : <button className={`btn${helaVald ? "" : " btn--ghost"}`} type="button" disabled={laddar} onClick={() => setValda(helaVald ? new Set() : new Set([hela.id]))}>{helaVald ? "Valt — ta bort" : "Boka hela boendet"}</button>}
              </div>
            )}
          </div>

          <aside>
            <div className="summary">
              <h3>Din bokning</h3>
              {rader.length === 0 ? (
                <p className="empty">Välj en eller flera enheter i listan, så räknar vi fram priset här.</p>
              ) : (
                <>
                  {rader.map((x, i) => <div key={i} className={`sumrow${x.rabatt ? " sumrow--discount" : ""}`}><span>{x.t}</span><span>{x.v}</span></div>)}
                  <div className="sumrow sumrow--total"><span>Totalt</span><span>{kr(summa)}</span></div>
                </>
              )}
              <div style={{ marginTop: 20 }}>
                <label className="checkfield checkfield--bare" htmlFor="frukost" style={{ marginBottom: 16, alignItems: "flex-start" }}>
                  <input type="checkbox" id="frukost" checked={frukost} onChange={(e) => setFrukost(e.target.checked)} style={{ marginTop: 2 }} />
                  <span>Frukostkorg, 95&nbsp;kr per person och natt</span>
                </label>
                <div className="field" style={{ marginBottom: 16 }}>
                  <label htmlFor="kod">Rabattkod från nyhetsbrevet</label>
                  <input type="text" id="kod" placeholder="t.ex. VANNER10" value={kod} onChange={(e) => setKod(e.target.value)} />
                </div>

                {steg === "valj" ? (
                  <button className="btn btn--block" type="button" disabled={valda.size === 0 || !pris} onClick={() => setSteg("uppgifter")}>Gå vidare till bokning</button>
                ) : (
                  <form onSubmit={boka} className="form" style={{ gridTemplateColumns: "1fr" }}>
                    <div className="field"><label htmlFor="b-namn">Namn</label><input id="b-namn" name="namn" required autoComplete="name" /></div>
                    <div className="field"><label htmlFor="b-epost">E-post</label><input id="b-epost" name="epost" type="email" required autoComplete="email" /></div>
                    <div className="field"><label htmlFor="b-tel">Telefon</label><input id="b-tel" name="telefon" type="tel" required autoComplete="tel" /></div>
                    <div className="field"><label htmlFor="b-medd">Önskemål</label><textarea id="b-medd" name="meddelande" style={{ minHeight: 80 }} placeholder="Sen ankomst, allergier, hundens namn…" /></div>
                    <Fakturafalt prefix="bf" />
                    <button className="btn btn--block" type="submit" disabled={pending}>{pending ? "Skickar…" : `Boka för ${kr(summa)}`}</button>
                    <button type="button" className="link-more" style={{ background: "none", border: 0, borderBottom: "1px solid var(--border-gold)", cursor: "pointer", justifySelf: "center" }} onClick={() => setSteg("valj")}>Ändra valet</button>
                    <p style={{ fontSize: 13, color: "var(--ws-ink-40)", margin: 0 }}>Bokningen blir preliminär direkt och bindande när ni fått vår bekräftelse. Fri avbokning fram till 7 dagar före ankomst.</p>
                  </form>
                )}
                <p style={{ fontSize: 14, margin: "16px 0 0", textAlign: "center", color: "var(--ws-ink-40)" }}>
                  Vill du hellre boka per telefon?<br /><a className="tel" href={site.phoneHref}>{site.phone}</a>
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
