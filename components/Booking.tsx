"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import Fakturafalt from "@/components/Fakturafalt";
import { hamtaTillganglighet, hamtaPris, hamtaNattpriser, skapaBokning } from "@/app/actions";
import { img, site } from "@/lib/site";

export type Enhet = {
  id: string; namn: string; ordning: number; ingar_i: string | null; ar_hela_boendet: boolean;
  baddar: number; grundpris: number; egenskaper: string[]; beskrivning: string | null; notering: string | null; bild: string | null;
};

type Prisrad = { enhet_id: string; natter: number; pris_per_natt: number; belopp: number; frukost_belopp: number; bricka_belopp: number; rabatt: number; summa: number };

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
  const [bricka, setBricka] = useState(false);
  const [nattpris, setNattpris] = useState<{ enhet_id: string; datum: string; pris: number }[]>([]);
  const [lasMer, setLasMer] = useState<"frukost" | "bricka" | null>(null);
  const [kod, setKod] = useState("");
  const [pris, setPris] = useState<Prisrad[] | null>(null);
  const [visaDelrum, setVisaDelrum] = useState(false);
  const [steg, setSteg] = useState<"valj" | "uppgifter" | "klar">("valj");
  const [fel, setFel] = useState<string | null>(null);
  const [kvitto, setKvitto] = useState<{ nummer: number; summa: number } | null>(null);
  const [pending, start] = useTransition();
  const summaryRef = useRef<HTMLDivElement>(null);
  const [summarySynlig, setSummarySynlig] = useState(false);

  /* Mobil: den klistrade raden visas bara när summeringen inte syns */
  useEffect(() => {
    const el = summaryRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setSummarySynlig(e.isIntersecting), { rootMargin: "0px 0px -60px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const gaVidare = () => {
    setSteg("uppgifter");
    setTimeout(() => summaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const n = natter(q.in, q.out);
  const hela = enheter.find((e) => e.ar_hela_boendet);
  const vanliga = enheter.filter((e) => !e.ar_hela_boendet);
  const helaVald = !!hela && valda.has(hela.id);

  const qRef = useRef(q);
  qRef.current = q;
  const harSokt = useRef(false);

  /* Tillgänglighet från databasen */
  const sok = useCallback(async (nq: typeof q) => {
    // Valet nollställs bara om datumen ändrats — antal gäster och hund räknas om direkt.
    const nyaDatum = nq.in !== qRef.current.in || nq.out !== qRef.current.out;
    setQ(nq); setFel(null);
    if (nyaDatum || !harSokt.current) { setValda(new Set()); setPris(null); }
    harSokt.current = true;
    setLaddar(true);
    const [r, np] = await Promise.all([hamtaTillganglighet(nq.in, nq.out), hamtaNattpriser(nq.in, nq.out)]);
    if (r.ok) setLedig(r.data); else setFel(r.fel);
    if (np.ok) setNattpris(np.data);
    setLaddar(false);
  }, []);
  useEffect(() => { sok(q); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  /* Pris från databasen när valet ändras */
  useEffect(() => {
    if (valda.size === 0) { setPris(null); return; }
    let aktiv = true;
    hamtaPris(Array.from(valda), q.in, q.out, frukost, Number(q.guests) || 2, kod, bricka).then((r) => { if (aktiv && r.ok) setPris(r.data); });
    return () => { aktiv = false; };
  }, [valda, q.in, q.out, q.guests, frukost, bricka, kod]);

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
  const gaster = Number(q.guests) || 2;
  const baddar = Array.from(valda).reduce((n, id) => n + (enheter.find((e) => e.id === id)?.baddar ?? 0), 0);
  const forFaBaddar = valda.size > 0 && baddar < gaster;

  /* Lägsta nattpris per rum för de sökta datumen (prisregler inräknade) — till "från X kr" på korten. */
  const franPris = (e: Enhet) => {
    const p = nattpris.filter((x) => x.enhet_id === e.id).map((x) => x.pris);
    return p.length ? Math.min(...p) : e.grundpris;
  };

  /* Om nätterna kostar olika delas rummet upp: "2 nätter à 1 350 kr" och "fre, lör à 1 650 kr". */
  const VD = ["sön", "mån", "tis", "ons", "tor", "fre", "lör"];
  const uppdelning = (enhetId: string) => {
    const natter = nattpris.filter((x) => x.enhet_id === enhetId);
    const priser = [...new Set(natter.map((x) => x.pris))].sort((a, b) => a - b);
    if (priser.length < 2) return [];
    return priser.map((p, i) => {
      const d = natter.filter((x) => x.pris === p);
      const dagar = i === 0 ? `${d.length} ${d.length === 1 ? "natt" : "nätter"}` : d.map((x) => VD[new Date(x.datum + "T12:00:00").getDay()]).join(", ");
      return { t: `${dagar} à ${kr(p)}`, v: kr(p * d.length) };
    });
  };

  const rader = useMemo(() => {
    if (!pris) return [];
    const r: { t: string; v: string; rabatt?: boolean; under?: boolean }[] = [];
    for (const p of pris) {
      r.push({ t: `${enheter.find((e) => e.id === p.enhet_id)?.namn ?? p.enhet_id} · ${p.natter} ${p.natter === 1 ? "natt" : "nätter"}`, v: kr(p.belopp) });
      for (const u of uppdelning(p.enhet_id)) r.push({ ...u, under: true });
    }
    if (pris[0].frukost_belopp) r.push({ t: `Frukostkorg · ${q.guests} pers.`, v: kr(pris[0].frukost_belopp) });
    if (pris[0].bricka_belopp) r.push({ t: `Välkomstbricka · ${q.guests} pers.`, v: kr(pris[0].bricka_belopp) });
    if (q.dog) r.push({ t: "Hund i rummet", v: "Ingen avgift" });
    if (pris[0].rabatt) r.push({ t: "Rabattkod", v: "−" + kr(pris[0].rabatt), rabatt: true });
    else if (kod.trim().length > 2) r.push({ t: "Koden känns inte igen", v: "—", rabatt: true });
    return r;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pris, q.dog, q.guests, kod, enheter, nattpris]);

  function boka(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("enheter", Array.from(valda).join(","));
    fd.set("ankomst", q.in); fd.set("avresa", q.out);
    fd.set("personer", q.guests); fd.set("hundar", q.dog ? "1" : "0");
    fd.set("frukost", frukost ? "1" : "0"); fd.set("bricka", bricka ? "1" : "0"); fd.set("kod", kod);
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
        <div className="container narrow">
          <div className="card card--accent card--roomy">
            <p className="label">Bokning {kvitto.nummer}</p>
            <h2 className="lower">tack, vi har tagit emot din bokning</h2>
            <p>En bekräftelse är på väg till din e-post. Bokningen är preliminär tills du fått vår bekräftelse, som kommer inom en vardag. Summa {kr(kvitto.summa)} — betalning senast 7 dagar före ankomst.</p>
            <p className="mb-0">Frågor? Ring <a href={site.phoneHref}>{site.phone}</a>.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section section--tight tint" id="bokning">
      <div className="container">
        <p className="label">Boka din vistelse</p>
        <h2 className="lower h2--tight">se vad som är ledigt</h2>

        <SearchBar inline onSearch={sok} initial={q} onChange={(nq) => setQ((x) => ({ ...x, guests: nq.guests, dog: nq.dog }))} />

        <div className="results-head" aria-live="polite">
          <p>{laddar ? "Söker…" : `Lediga enheter · ${q.in} till ${q.out} · ${n} ${n === 1 ? "natt" : "nätter"}`}</p>
          <p><strong>{antalLediga} av {vanliga.filter((e) => !e.ingar_i).length}</strong> lediga</p>
        </div>
        {fel && <div className="notice notice--fel notice--gap" role="alert">{fel}</div>}

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
                      <div className="unit__price"><span className="per">från</span><span className="amount">{kr(franPris(e))}</span><span className="per">per natt</span></div>
                    </div>
                    <ul className="unit__meta">
                      {e.egenskaper.map((x) => <li key={x}>{x}</li>)}
                      <li className="dog">Hund välkommen</li>
                    </ul>
                    {e.beskrivning && <p>{e.beskrivning}</p>}
                    {e.notering && <p className="unit__note">{e.notering}</p>}
                    <div className="unit__foot">
                      {e.id === "f2" && !vald && (
                        <button type="button" className="linkbtn unit__toggle" onClick={() => setVisaDelrum(!visaDelrum)}>
                          {visaDelrum ? "Dölj rummen" : "Visa rummen var för sig"}
                        </button>
                      )}
                      {laddar ? <span className="unit__status">Söker…</span>
                        : upptagen ? <span className="unit__status">Inte ledig dessa datum</span>
                        : block && !vald ? <span className="unit__status">{helaVald ? "Ingår i hela boendet" : "Upptagen av ditt val"}</span>
                        : (
                          <>
                            {vald && <span className="unit__status unit__status--vald">Vald</span>}
                            <button className={`btn btn--sm${vald ? " btn--ghost" : ""}`} type="button" onClick={() => toggla(e.id)}>{vald ? "Ta bort" : "Välj"}</button>
                          </>
                        )}
                    </div>
                  </div>
                </article>
              );
            })}

            {hela && (
              <div className="card card--accent unit--hela">
                <h3>{hela.namn}</h3>
                <p>{hela.beskrivning}</p>
                <p className="price price--lg"><small>från</small> {kr(franPris(hela))}<small>per natt</small></p>
                {!laddar && ledig[hela.id] === false
                  ? <span className="unit__status">Hela boendet är inte ledigt dessa datum</span>
                  : <button className={`btn${helaVald ? "" : " btn--ghost"}`} type="button" disabled={laddar} onClick={() => setValda(helaVald ? new Set() : new Set([hela.id]))}>{helaVald ? "Valt — ta bort" : "Boka hela boendet"}</button>}
              </div>
            )}
          </div>

          <aside>
            <div className="summary" ref={summaryRef}>
              <h3>Din bokning</h3>
              {rader.length === 0 ? (
                <p className="empty">Välj en eller flera enheter i listan, så räknar vi fram priset här.</p>
              ) : (
                <>
                  {rader.map((x, i) => <div key={i} className={`sumrow${x.rabatt ? " sumrow--discount" : ""}${x.under ? " sumrow--under" : ""}`}><span>{x.t}</span><span>{x.v}</span></div>)}
                  {rader.some((x) => x.under) && <p className="hint">Vissa nätter kostar mer, till exempel helger eller högsäsong.</p>}
                  <div className="sumrow sumrow--total"><span>Totalt</span><span>{kr(summa)}</span></div>
                </>
              )}
              <div className="summary__opts">
                <div className="tillval">
                  <label className="checkfield checkfield--bare checkfield--top" htmlFor="frukost">
                    <input type="checkbox" id="frukost" checked={frukost} onChange={(e) => setFrukost(e.target.checked)} />
                    <span>Frukostkorg, 95&nbsp;kr per person och natt</span>
                  </label>
                  <button type="button" className="linkbtn tillval__mer" aria-expanded={lasMer === "frukost"} onClick={() => setLasMer(lasMer === "frukost" ? null : "frukost")}>{lasMer === "frukost" ? "Dölj" : "Läs mer"}</button>
                  {lasMer === "frukost" && <p className="hint tillval__text">En frukostkorg med lokala råvaror levereras till boendet på morgonen, så att ni kan börja dagen i lugn och ro. Utbudet varierar efter årstid. Vid större bokningar serveras frukosten i herrgården.</p>}
                </div>
                <div className="tillval">
                  <label className="checkfield checkfield--bare checkfield--top" htmlFor="bricka">
                    <input type="checkbox" id="bricka" checked={bricka} onChange={(e) => setBricka(e.target.checked)} />
                    <span>Västmanländsk välkomstbricka, 249&nbsp;kr per person</span>
                  </label>
                  <button type="button" className="linkbtn tillval__mer" aria-expanded={lasMer === "bricka"} onClick={() => setLasMer(lasMer === "bricka" ? null : "bricka")}>{lasMer === "bricka" ? "Dölj" : "Läs mer"}</button>
                  {lasMer === "bricka" && <p className="hint tillval__text">En smakfull välkomsthälsning på rummet med utvalda charkuterier och andra delikatesser från lokala producenter i Västmanland, tillsammans med alkoholfritt bubbel från Köpings Musteri.</p>}
                </div>
                <div className="field">
                  <label htmlFor="kod">Rabattkod</label>
                  <input type="text" id="kod" placeholder="Har du fått en kod? Skriv den här" value={kod} onChange={(e) => setKod(e.target.value)} autoComplete="off" />
                </div>

                {forFaBaddar && <p className="notice notice--fel" role="alert">De valda rummen har {baddar} bäddar. Välj fler rum för {gaster} gäster.</p>}
                {steg === "valj" ? (
                  <button className="btn btn--block" type="button" disabled={valda.size === 0 || !pris || forFaBaddar} onClick={gaVidare}>Gå vidare till bokning</button>
                ) : (
                  <form onSubmit={boka} className="form form--1">
                    <div className="field"><label htmlFor="b-namn">Namn</label><input id="b-namn" name="namn" required autoComplete="name" /></div>
                    <div className="field"><label htmlFor="b-epost">E-post</label><input id="b-epost" name="epost" type="email" required autoComplete="email" /></div>
                    <div className="field"><label htmlFor="b-tel">Telefon</label><input id="b-tel" name="telefon" type="tel" required autoComplete="tel" /></div>
                    <div className="field"><label htmlFor="b-medd">Önskemål</label><textarea id="b-medd" name="meddelande" className="ta--s" placeholder="Sen ankomst, allergier, hundens namn…" /></div>
                    <Fakturafalt prefix="bf" />
                    <button className="btn btn--block" type="submit" disabled={pending}>{pending ? "Skickar…" : `Boka för ${kr(summa)}`}</button>
                    <button type="button" className="linkbtn mx-auto" onClick={() => setSteg("valj")}>Ändra valet</button>
                    <p className="hint">Bokningen blir preliminär direkt och bindande när ni fått vår bekräftelse. Fri avbokning fram till 7 dagar före ankomst.</p>
                  </form>
                )}
                <p className="hint hint--center">
                  Vill du hellre boka per telefon?<br /><a className="tel" href={site.phoneHref}>{site.phone}</a>
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobil: valet följer med i botten */}
      <div className={`stickybar${valda.size > 0 && steg === "valj" && !summarySynlig ? " is-on" : ""}`} aria-hidden={!(valda.size > 0 && steg === "valj" && !summarySynlig)}>
        <div className="stickybar__in">
          <div className="stickybar__txt">
            <small>{helaVald ? "Hela boendet" : `${valda.size} ${valda.size === 1 ? "enhet vald" : "enheter valda"}`} · {n} {n === 1 ? "natt" : "nätter"}</small>
            <strong>{pris ? kr(summa) : "Räknar…"}</strong>
          </div>
          <button className="btn" type="button" disabled={!pris || forFaBaddar} onClick={gaVidare}>{forFaBaddar ? "Välj fler rum" : "Gå vidare →"}</button>
        </div>
      </div>
    </section>
  );
}
