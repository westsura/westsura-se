"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { hamtaTillganglighet, hamtaPaketpris, skapaPaketbokning, type Paketpris } from "@/app/actions";
import Fakturafalt from "@/components/Fakturafalt";
import { site } from "@/lib/site";

export type PaketEnhet = { id: string; namn: string; baddar: number; grundpris: number; ingar_i: string | null };
type Props = { paket: { id: string; namn: string; pris: number; ingarNatt: boolean }; enheter: PaketEnhet[] };

const kr = (n: number) => n.toLocaleString("sv-SE") + " kr";
function plus(d: string, n: number) { const x = new Date(d + "T12:00:00"); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); }

/**
 * Boka ett paket direkt: datum, antal personer, var man bor, och förslag på att
 * stanna en natt till. Priset räknas i databasen (paketpris) så att det alltid stämmer.
 */
export default function PaketBokning({ paket, enheter }: Props) {
  const idag = new Date().toISOString().slice(0, 10);
  const [oppen, setOppen] = useState(false);
  const [ankomst, setAnkomst] = useState(plus(idag, 14));
  const [personer, setPersoner] = useState(2);
  const [boende, setBoende] = useState(paket.ingarNatt);
  const [extra, setExtra] = useState(0);
  const [valda, setValda] = useState<string[]>([]);
  const [bricka, setBricka] = useState(false);
  const [frukost, setFrukost] = useState(false);
  const [lasMer, setLasMer] = useState<"frukost" | "bricka" | null>(null);
  const [hund, setHund] = useState(false);
  const [ledig, setLedig] = useState<Record<string, boolean>>({});
  const [pris, setPris] = useState<Paketpris | null>(null);
  const [steg, setSteg] = useState<"valj" | "uppgifter" | "klar">("valj");
  const [fel, setFel] = useState<string | null>(null);
  const [kvitto, setKvitto] = useState<{ nummer: number; summa: number } | null>(null);
  const [pending, start] = useTransition();

  // Nätter som betalas som vanligt: för paket med natt är det de extra; för aktivitetspaket alla.
  const betalda = paket.ingarNatt ? extra : boende ? Math.max(1, extra) : 0;
  const natterTotalt = (paket.ingarNatt ? 1 : 0) + betalda;
  const avresa = plus(ankomst, Math.max(natterTotalt, 1));
  const baddar = valda.reduce((n, id) => n + (enheter.find((e) => e.id === id)?.baddar ?? 0), 0);
  const billigast = useMemo(() => Math.min(...enheter.filter((e) => !e.ingar_i).map((e) => e.grundpris)), [enheter]);

  // Ledigt för hela vistelsen
  useEffect(() => {
    if (!oppen || natterTotalt === 0) return;
    let aktiv = true;
    hamtaTillganglighet(ankomst, avresa).then((r) => { if (aktiv && r.ok) setLedig(r.data); });
    return () => { aktiv = false; };
  }, [oppen, ankomst, avresa, natterTotalt]);

  // Rum som blivit upptagna vid byte av datum tas bort ur valet
  useEffect(() => { setValda((v) => v.filter((id) => ledig[id] !== false)); }, [ledig]);

  // Pris
  useEffect(() => {
    if (!oppen) return;
    let aktiv = true;
    hamtaPaketpris(paket.id, natterTotalt > 0 ? valda : [], ankomst, betalda, personer, bricka && natterTotalt > 0, frukost && betalda > 0).then((r) => { if (aktiv && r.ok) setPris(r.data); });
    return () => { aktiv = false; };
  }, [oppen, paket.id, valda, ankomst, betalda, personer, bricka, frukost, natterTotalt]);

  const toggla = (id: string) => setValda((v) => v.includes(id) ? v.filter((x) => x !== id) : [...v, id]);
  const krockar = (e: PaketEnhet) =>
    (e.ingar_i && valda.includes(e.ingar_i)) || enheter.some((x) => x.ingar_i === e.id && valda.includes(x.id));

  const behoverRum = natterTotalt > 0;
  const klar = !!pris && (!behoverRum || (valda.length > 0 && baddar >= personer));

  function boka(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget);
    fd.set("paket", paket.id); fd.set("ankomst", ankomst); fd.set("personer", String(personer));
    fd.set("natter", String(betalda)); fd.set("enheter", behoverRum ? valda.join(",") : "");
    fd.set("bricka", bricka && behoverRum ? "1" : "0"); fd.set("frukost", frukost && betalda > 0 ? "1" : "0"); fd.set("hund", hund ? "1" : "0");
    setFel(null);
    start(async () => {
      const r = await skapaPaketbokning(fd);
      if (r.ok) { setKvitto(r.data); setSteg("klar"); } else setFel(r.fel);
    });
  }

  if (!oppen) {
    return <button type="button" className="btn" onClick={() => setOppen(true)}>Boka paketet</button>;
  }

  if (steg === "klar" && kvitto) {
    return (
      <div className="notice notice--lg" role="status">
        <strong>Tack — paketet är bokat (nummer {kvitto.nummer}).</strong> En bekräftelse är på väg till din e-post. Bokningen är preliminär tills du fått vår bekräftelse inom en vardag. Summa {kr(kvitto.summa)}.
      </div>
    );
  }

  return (
    <div className="paketbok">
      <div className="form paketbok__grund">
        <div className="field">
          <label htmlFor={`pb-dat-${paket.id}`}>{paket.ingarNatt ? "Ankomstdag" : "Datum"}</label>
          <input id={`pb-dat-${paket.id}`} type="date" min={idag} value={ankomst} onChange={(e) => setAnkomst(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor={`pb-pers-${paket.id}`}>Antal personer</label>
          <select id={`pb-pers-${paket.id}`} value={personer} onChange={(e) => setPersoner(Number(e.target.value))}>
            {Array.from({ length: 16 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} {n === 1 ? "person" : "personer"}</option>)}
          </select>
        </div>
      </div>

      {!paket.ingarNatt && (
        <label className="checkfield checkfield--bare paketbok__rad" htmlFor={`pb-bo-${paket.id}`}>
          <input id={`pb-bo-${paket.id}`} type="checkbox" checked={boende} onChange={(e) => { setBoende(e.target.checked); if (e.target.checked && extra < 1) setExtra(1); }} />
          <span>Stanna över natten i flyglarna — från {kr(billigast)} per natt</span>
        </label>
      )}

      {behoverRum && (
        <>
          <div className="field paketbok__rad">
            <label htmlFor={`pb-nat-${paket.id}`}>{paket.ingarNatt ? "Stanna längre?" : "Antal nätter"}</label>
            <select id={`pb-nat-${paket.id}`} value={paket.ingarNatt ? extra : Math.max(1, extra)} onChange={(e) => setExtra(Number(e.target.value))}>
              {paket.ingarNatt && <option value={0}>Nej, en natt räcker</option>}
              {[1, 2, 3].map((n) => <option key={n} value={n}>{paket.ingarNatt ? `${n} natt${n > 1 ? "er" : ""} till` : `${n} natt${n > 1 ? "er" : ""}`}</option>)}
            </select>
            {paket.ingarNatt && extra === 0 && <p className="hint">Många stannar en natt till och tar det lugnt dagen efter. En extra natt kostar som vanligt, från {kr(billigast)}.</p>}
          </div>

          <p className="label paketbok__rubrik">Var vill ni bo? {ankomst} – {avresa}</p>
          <div className="paketbok__rum">
            {enheter.map((e) => {
              const upptagen = ledig[e.id] === false;
              const vald = valda.includes(e.id);
              const sparr = !vald && (upptagen || !!krockar(e));
              return (
                <label key={e.id} className={`paketbok__enhet${vald ? " is-vald" : ""}${sparr ? " is-sparr" : ""}`}>
                  <input type="checkbox" checked={vald} disabled={sparr} onChange={() => toggla(e.id)} />
                  <span><b>{e.namn}</b><small>{e.baddar} bäddar{upptagen ? " · inte ledig" : ""}</small></span>
                </label>
              );
            })}
          </div>
          {valda.length > 0 && baddar < personer && <p className="notice notice--fel">De valda rummen har {baddar} bäddar — välj fler för {personer} personer.</p>}

          <p className="label paketbok__rubrik">Tillval</p>
          {betalda > 0 ? (
            <div className="tillval">
              <label className="checkfield checkfield--bare checkfield--top" htmlFor={`pb-fr-${paket.id}`}>
                <input id={`pb-fr-${paket.id}`} type="checkbox" checked={frukost} onChange={(e) => setFrukost(e.target.checked)} />
                <span>Frukostkorg{paket.ingarNatt ? " även de extra nätterna" : ""}, 95&nbsp;kr per person och natt</span>
              </label>
              <button type="button" className="linkbtn tillval__mer" aria-expanded={lasMer === "frukost"} onClick={() => setLasMer(lasMer === "frukost" ? null : "frukost")}>{lasMer === "frukost" ? "Dölj" : "Läs mer"}</button>
              {lasMer === "frukost" && <p className="hint tillval__text">En frukostkorg med lokala råvaror levereras till boendet på morgonen, så att ni kan börja dagen i lugn och ro. Utbudet varierar efter årstid.{paket.ingarNatt ? " Första morgonen ingår den redan i paketet." : ""}</p>}
            </div>
          ) : paket.ingarNatt ? <p className="hint">Frukostkorgen ingår i paketet. Stannar ni längre kan ni välja till den även de extra nätterna.</p> : null}
          <div className="tillval">
            <label className="checkfield checkfield--bare checkfield--top" htmlFor={`pb-br-${paket.id}`}>
              <input id={`pb-br-${paket.id}`} type="checkbox" checked={bricka} onChange={(e) => setBricka(e.target.checked)} />
              <span>Västmanländsk välkomstbricka, 249&nbsp;kr per person</span>
            </label>
            <button type="button" className="linkbtn tillval__mer" aria-expanded={lasMer === "bricka"} onClick={() => setLasMer(lasMer === "bricka" ? null : "bricka")}>{lasMer === "bricka" ? "Dölj" : "Läs mer"}</button>
            {lasMer === "bricka" && <p className="hint tillval__text">En smakfull välkomsthälsning på rummet med utvalda charkuterier och andra delikatesser från lokala producenter i Västmanland, tillsammans med alkoholfritt bubbel från Köpings Musteri.</p>}
          </div>
        </>
      )}

      <label className="checkfield checkfield--bare paketbok__rad" htmlFor={`pb-hund-${paket.id}`}>
        <input id={`pb-hund-${paket.id}`} type="checkbox" checked={hund} onChange={(e) => setHund(e.target.checked)} />
        <span>Vi har med hund</span>
      </label>

      {pris && (
        <div className="paketbok__summa">
          <div className="sumrow"><span>{paket.namn} · {personer} pers.</span><span>{kr(pris.paket_belopp)}</span></div>
          {pris.boende_belopp > 0 && <div className="sumrow"><span>{paket.ingarNatt ? "Extra" : "Boende"} · {pris.betalda_natter} {pris.betalda_natter === 1 ? "natt" : "nätter"}</span><span>{kr(pris.boende_belopp)}</span></div>}
          {pris.frukost_belopp > 0 && <div className="sumrow"><span>Frukostkorg · {pris.betalda_natter} {pris.betalda_natter === 1 ? "natt" : "nätter"}</span><span>{kr(pris.frukost_belopp)}</span></div>}
          {pris.bricka_belopp > 0 && <div className="sumrow"><span>Välkomstbricka</span><span>{kr(pris.bricka_belopp)}</span></div>}
          <div className="sumrow sumrow--total"><span>Totalt</span><span>{kr(pris.summa)}</span></div>
        </div>
      )}

      {steg === "valj" ? (
        <button type="button" className="btn" disabled={!klar} onClick={() => setSteg("uppgifter")}>
          {behoverRum && valda.length === 0 ? "Välj var ni vill bo" : "Gå vidare"}
        </button>
      ) : (
        <form className="form" onSubmit={boka}>
          <div className="field"><label htmlFor={`pb-namn-${paket.id}`}>Namn</label><input id={`pb-namn-${paket.id}`} name="namn" required autoComplete="name" /></div>
          <div className="field"><label htmlFor={`pb-tel-${paket.id}`}>Telefon</label><input id={`pb-tel-${paket.id}`} name="telefon" type="tel" required autoComplete="tel" /></div>
          <div className="field field--full"><label htmlFor={`pb-ep-${paket.id}`}>E-post</label><input id={`pb-ep-${paket.id}`} name="epost" type="email" required autoComplete="email" /></div>
          <div className="field field--full"><label htmlFor={`pb-medd-${paket.id}`}>Önskemål</label><textarea id={`pb-medd-${paket.id}`} name="meddelande" className="ta--s" placeholder="Allergier, sen ankomst, Golf-ID och starttid…" /></div>
          <Fakturafalt prefix={`pb-${paket.id}`} full />
          {fel && <div className="notice notice--fel field--full" role="alert">{fel}</div>}
          <div className="field--full cta-row">
            <button className="btn" type="submit" disabled={pending}>{pending ? "Skickar…" : `Boka för ${pris ? kr(pris.summa) : ""}`}</button>
            <button type="button" className="linkbtn" onClick={() => setSteg("valj")}>Ändra</button>
          </div>
          <p className="hint field--full">Bokningen blir preliminär direkt och bindande när ni fått vår bekräftelse. Fri avbokning fram till 7 dagar före ankomst. Frågor? {site.phone}.</p>
        </form>
      )}
    </div>
  );
}
