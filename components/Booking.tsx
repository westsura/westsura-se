"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import { img, site } from "@/lib/site";

/* Enheter och priser. Flyttas till databasen i etapp II. */
type Enhet = {
  id: string; namn: string; pris: number; badd: number; bild: string;
  egenskaper: string[]; text: string; note?: string; ingarI?: string;
};

const ENHETER: Enhet[] = [
  { id: "f1", namn: "Familjeflygel 1", pris: 2200, badd: 4, bild: img.sovrum,
    egenskaper: ["4 bäddar", "2 sovrum", "Eget kök", "Delad dusch", "2 wc"],
    text: "Hela flygeln för ett sällskap. Två sovrum, fullt utrustat kök och matbord för er som vill äta tillsammans.",
    note: "Bokas alltid hel — de två sovrummen hör ihop." },
  { id: "f2", namn: "Familjeflygel 2", pris: 1950, badd: 4, bild: img.sang,
    egenskaper: ["4 bäddar", "2 sovrum", "Delad dusch och wc", "Gemensamhetskök"],
    text: "Två låsbara sovrum som delar wc och dusch i hallen. Går även att boka rum för rum.",
    note: "Rummen bokas även var för sig, 1 050 kr per rum och natt." },
  { id: "f2a", namn: "Familjeflygel 2 · rum A", pris: 1050, badd: 2, bild: img.sang, ingarI: "f2",
    egenskaper: ["2 bäddar", "Låsbart rum", "Delad dusch och wc i hallen", "Gemensamhetskök"],
    text: "Ett av de två rummen i Familjeflygel 2." },
  { id: "f2b", namn: "Familjeflygel 2 · rum B", pris: 1050, badd: 2, bild: img.sang, ingarI: "f2",
    egenskaper: ["2 bäddar", "Låsbart rum", "Delad dusch och wc i hallen", "Gemensamhetskök"],
    text: "Ett av de två rummen i Familjeflygel 2." },
  { id: "r1", namn: "Dubbelrum 1", pris: 1350, badd: 2, bild: img.sang,
    egenskaper: ["2 bäddar", "Egen dusch", "Eget wc", "Gemensamhetskök"],
    text: "Dubbelrum med eget badrum och tillgång till gemensamhetsköket i servicehuset." },
  { id: "r2", namn: "Dubbelrum 2", pris: 1350, badd: 2, bild: img.sang,
    egenskaper: ["2 bäddar", "Egen dusch", "Eget wc", "Gemensamhetskök"],
    text: "Dubbelrum med eget badrum och tillgång till gemensamhetsköket i servicehuset." },
  { id: "r3", namn: "Dubbelrum 3", pris: 1250, badd: 2, bild: img.sovrum,
    egenskaper: ["2 bäddar", "Stockholmsdusch", "Eget wc", "Gemensamhetskök"],
    text: "Dubbelrum med eget wc och dusch i badrummet. Tillgång till gemensamhetsköket." },
  { id: "r4", namn: "Dubbelrum 4", pris: 1250, badd: 2, bild: img.sovrum,
    egenskaper: ["2 bäddar", "Stockholmsdusch", "Eget wc", "Gemensamhetskök"],
    text: "Dubbelrum med eget wc och dusch i badrummet. Tillgång till gemensamhetsköket." },
];

const HELA_PRIS = 8400;
const FRUKOST = 95;

const KODER: Record<string, { typ: "procent" | "kronor"; varde: number; text: string }> = {
  VANNER10: { typ: "procent", varde: 10, text: "Vänrabatt 10 %" },
  HOSTDAG: { typ: "kronor", varde: 300, text: "Höstdagen, 300 kr" },
};

/* Påhittad beläggning tills kalendern finns i databasen: Dubbelrum 2 är bokat. */
const UPPTAGNA = new Set(["r2"]);

const kr = (n: number) => n.toLocaleString("sv-SE") + " kr";

function natter(a: string, b: string) {
  const d = Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
  return d > 0 ? d : 1;
}

export default function Booking() {
  const params = useSearchParams();
  const [q, setQ] = useState({ in: params.get("in") || "", out: params.get("out") || "", guests: params.get("guests") || "2", dog: params.get("dog") === "1" });
  const [valda, setValda] = useState<Set<string>>(new Set());
  const [hela, setHela] = useState(false);
  const [frukost, setFrukost] = useState(false);
  const [kod, setKod] = useState("");
  const [visaDelrum, setVisaDelrum] = useState(false);

  useEffect(() => {
    if (!q.in || !q.out) {
      const t = new Date();
      const p = (n: number) => { const x = new Date(t); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
      setQ((s) => ({ ...s, in: s.in || p(7), out: s.out || p(9) }));
    }
  }, [q.in, q.out]);

  const n = q.in && q.out ? natter(q.in, q.out) : 2;

  /* Enheter som innehåller varandra: bokas ett delrum försvinner flygeln, och tvärtom. */
  const blockerad = (e: Enhet) => {
    if (hela) return true;
    if (UPPTAGNA.has(e.id)) return true;
    if (e.ingarI && valda.has(e.ingarI)) return true;
    if (!e.ingarI && ENHETER.some((x) => x.ingarI === e.id && valda.has(x.id))) return true;
    return false;
  };

  const synliga = ENHETER.filter((e) => !e.ingarI || visaDelrum);
  const lediga = ENHETER.filter((e) => !e.ingarI && !UPPTAGNA.has(e.id)).length;

  const rader = useMemo(() => {
    const r: { t: string; v: string; rabatt?: boolean }[] = [];
    let total = 0, gaster = 0;
    if (hela) {
      total += HELA_PRIS * n; gaster = 16;
      r.push({ t: `Hela boendet · ${n} ${n === 1 ? "natt" : "nätter"}`, v: kr(HELA_PRIS * n) });
    } else {
      ENHETER.filter((e) => valda.has(e.id)).forEach((e) => {
        total += e.pris * n; gaster += e.badd;
        r.push({ t: `${e.namn} · ${n} ${n === 1 ? "natt" : "nätter"}`, v: kr(e.pris * n) });
      });
    }
    if (r.length === 0) return { r, total: 0 };
    if (frukost) { const f = FRUKOST * gaster * n; total += f; r.push({ t: `Frukostkorg · ${gaster} pers × ${n}`, v: kr(f) }); }
    if (q.dog) r.push({ t: "Hund i rummet", v: "Ingen avgift" });
    const k = KODER[kod.trim().toUpperCase()];
    if (k) { const av = k.typ === "procent" ? Math.round(total * k.varde / 100) : k.varde; total -= av; r.push({ t: k.text, v: "−" + kr(av), rabatt: true }); }
    else if (kod.trim().length > 2) r.push({ t: "Koden känns inte igen", v: "—", rabatt: true });
    return { r, total };
  }, [valda, hela, frukost, kod, n, q.dog]);

  function toggla(id: string) {
    setHela(false);
    setValda((s) => { const x = new Set(s); x.has(id) ? x.delete(id) : x.add(id); return x; });
  }

  return (
    <section className="section section--tight tint" id="bokning">
      <div className="container">
        <p className="label">Boka din vistelse</p>
        <h2 className="lower" style={{ marginBottom: 28 }}>se vad som är ledigt</h2>

        <SearchBar inline onSearch={(nq) => { setQ(nq); setValda(new Set()); setHela(false); }} />

        <div className="results-head">
          <p>Lediga enheter · {q.in} till {q.out} · {n} {n === 1 ? "natt" : "nätter"}</p>
          <p><strong>{lediga} av {ENHETER.filter((e) => !e.ingarI).length}</strong> lediga</p>
        </div>

        <div className="booking">
          <div>
            {synliga.map((e) => {
              const vald = valda.has(e.id);
              const block = blockerad(e);
              return (
                <article key={e.id} className={`unit${vald ? " is-selected" : ""}${block && !vald ? " is-unavailable" : ""}`}>
                  <div className="unit__img">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={e.bild} alt={`${e.namn} på Westsura Herrgård`} loading="lazy" />
                  </div>
                  <div className="unit__body">
                    <div className="unit__top">
                      <h3>{e.namn}</h3>
                      <div className="unit__price"><span className="amount">{kr(e.pris)}</span><span className="per">per natt</span></div>
                    </div>
                    <ul className="unit__meta">
                      {e.egenskaper.map((x) => <li key={x}>{x}</li>)}
                      <li className="dog">Hundvänligt</li>
                    </ul>
                    <p>{e.text}</p>
                    {e.note && <p className="unit__note">{e.note}</p>}
                    <div className="unit__foot">
                      {e.id === "f2" && !vald && (
                        <button type="button" className="link-more" style={{ background: "none", border: 0, borderBottom: "1px solid var(--border-gold)", cursor: "pointer", marginRight: "auto" }} onClick={() => setVisaDelrum(!visaDelrum)}>
                          {visaDelrum ? "Dölj rummen" : "Visa rummen var för sig"}
                        </button>
                      )}
                      {hela ? <span className="unit__status">Ingår i hela boendet</span>
                        : UPPTAGNA.has(e.id) ? <span className="unit__status">Bokad dessa datum</span>
                        : block && !vald ? <span className="unit__status">Upptagen av ditt val</span>
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

            <div className="card" style={{ borderTopColor: "var(--accent)", marginTop: 28 }}>
              <h3>Hela boendet</h3>
              <p style={{ fontSize: 17 }}>Sexton bäddar i fyra flyglar och åtta rum, för jaktlaget, bröllopsgästerna, föreningen eller släktträffen. Ett pris, en bokning, hela herrgårdsmiljön för er själva.</p>
              <p className="price price--lg">8&nbsp;400 kr<small>per natt</small></p>
              <button className={`btn${hela ? "" : " btn--ghost"}`} type="button" onClick={() => { setHela(!hela); setValda(new Set()); }}>
                {hela ? "Valt — ta bort" : "Boka hela boendet"}
              </button>
            </div>
          </div>

          <aside>
            <div className="summary">
              <h3>Din bokning</h3>
              {rader.r.length === 0 ? (
                <p className="empty">Välj en eller flera enheter i listan, så räknar vi fram priset här.</p>
              ) : (
                <>
                  {rader.r.map((x, i) => (
                    <div key={i} className={`sumrow${x.rabatt ? " sumrow--discount" : ""}`}><span>{x.t}</span><span>{x.v}</span></div>
                  ))}
                  <div className="sumrow sumrow--total"><span>Totalt</span><span>{kr(rader.total)}</span></div>
                  <p style={{ fontSize: 14, margin: "14px 0 0", color: "var(--ws-ink-40)" }}>Bokningen blir preliminär direkt och bindande när ni fått vår bekräftelse.</p>
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
                <button className="btn btn--block" type="button" disabled={rader.r.length === 0}>Gå vidare till bokning</button>
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
