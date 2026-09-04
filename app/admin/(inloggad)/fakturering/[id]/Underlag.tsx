"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sparaUnderlag, taBortUnderlag, type Fakturarad } from "@/app/admin/actions";
import { FAKTURASTATUS, kr } from "@/lib/admin";

type U = {
  id: string; nummer: number; rubrik: string; status: string;
  kund_namn: string; kund_foretag: string | null; kund_orgnr: string | null; kund_adress: string | null; kund_referens: string | null; kund_epost: string | null; kund_telefon: string | null;
  fortnox_nummer: string | null; fakturerad: string | null; forfallodatum: string | null; betald: string | null; anteckning: string | null;
  bokning_nummer: number | null; forfragan_nummer: number | null;
};

/* Snabbrader med rätt moms från början. Priser inkl. moms, som allt annat på sajten. */
const MALLAR: { t: string; r: Fakturarad }[] = [
  { t: "Boende", r: { beskrivning: "Boende", antal: 1, enhet: "natt", a_pris: 0, moms: 12 } },
  { t: "Frukostkorg", r: { beskrivning: "Frukostkorg", antal: 2, enhet: "st", a_pris: 95, moms: 12 } },
  { t: "Lokalhyra", r: { beskrivning: "Lokalhyra", antal: 1, enhet: "st", a_pris: 0, moms: 25 } },
  { t: "Mat", r: { beskrivning: "Mat", antal: 1, enhet: "pers", a_pris: 0, moms: 12 } },
  { t: "Alkohol", r: { beskrivning: "Dryck, alkohol", antal: 1, enhet: "st", a_pris: 0, moms: 25 } },
  { t: "Konferens", r: { beskrivning: "Dagskonferens", antal: 1, enhet: "pers", a_pris: 0, moms: 25 } },
  { t: "Jakt", r: { beskrivning: "Jakttillfälle", antal: 1, enhet: "pers", a_pris: 0, moms: 25 } },
  { t: "Rabatt", r: { beskrivning: "Rabatt", antal: 1, enhet: "st", a_pris: 0, moms: 12 } },
];

const idag = () => new Date().toISOString().slice(0, 10);
const n2 = (x: number) => x.toLocaleString("sv-SE", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export default function Underlag({ u, rader: start }: { u: U; rader: Fakturarad[] }) {
  const [h, setH] = useState({
    rubrik: u.rubrik, kund_namn: u.kund_namn ?? "", kund_foretag: u.kund_foretag ?? "", kund_orgnr: u.kund_orgnr ?? "", kund_adress: u.kund_adress ?? "",
    kund_referens: u.kund_referens ?? "", kund_epost: u.kund_epost ?? "", kund_telefon: u.kund_telefon ?? "",
    status: u.status, fortnox_nummer: u.fortnox_nummer ?? "", fakturerad: u.fakturerad ?? "", forfallodatum: u.forfallodatum ?? "", betald: u.betald ?? "", anteckning: u.anteckning ?? "",
  });
  const [rader, setRader] = useState<Fakturarad[]>(start.length ? start : [{ beskrivning: "", antal: 1, enhet: "st", a_pris: 0, moms: 12 }]);
  const [andrad, setAndrad] = useState(false);
  const [medd, setMedd] = useState<string | null>(null);
  const [pending, startT] = useTransition();
  const router = useRouter();

  const set = (k: keyof typeof h, v: string) => { setH((x) => ({ ...x, [k]: v })); setAndrad(true); };
  const setRad = (i: number, k: keyof Fakturarad, v: string | number) => { setRader((rs) => rs.map((r, j) => (j === i ? { ...r, [k]: v } : r))); setAndrad(true); };
  const laggTill = (r: Fakturarad) => { setRader((rs) => [...rs, { ...r }]); setAndrad(true); };
  const taBort = (i: number) => { setRader((rs) => rs.filter((_, j) => j !== i)); setAndrad(true); };

  /* Summor per momssats */
  const sum = useMemo(() => {
    const per: Record<number, { inkl: number; moms: number }> = {};
    let inkl = 0;
    rader.forEach((r) => {
      const b = (Number(r.antal) || 0) * (Number(r.a_pris) || 0);
      const m = b * (Number(r.moms) || 0) / (100 + (Number(r.moms) || 0));
      per[r.moms] = per[r.moms] ?? { inkl: 0, moms: 0 };
      per[r.moms].inkl += b; per[r.moms].moms += m; inkl += b;
    });
    const moms = Object.values(per).reduce((a, x) => a + x.moms, 0);
    return { inkl, moms, exkl: inkl - moms, per };
  }, [rader]);

  function spara(extra?: Partial<typeof h>) {
    const hh = { ...h, ...extra };
    if (extra) setH(hh);
    const fd = new FormData();
    Object.entries(hh).forEach(([k, v]) => fd.set(k, v));
    setMedd(null);
    startT(async () => {
      const r = await sparaUnderlag(u.id, fd, rader);
      if (r.ok) { setAndrad(false); setMedd("Sparat."); router.refresh(); } else setMedd(r.fel ?? "Kunde inte spara.");
    });
  }

  function kopiera() {
    const kund = [h.kund_foretag, h.kund_namn, h.kund_orgnr && `Org.nr ${h.kund_orgnr}`, h.kund_adress, h.kund_referens && `Er referens: ${h.kund_referens}`, h.kund_epost].filter(Boolean).join("\n");
    const rows = rader.filter((r) => r.beskrivning).map((r) => `${r.beskrivning}\t${n2(r.antal)} ${r.enhet}\t${n2(r.a_pris)} kr\t${r.moms} %\t${n2(r.antal * r.a_pris)} kr`).join("\n");
    const text = `${h.rubrik}\n\n${kund}\n\nBeskrivning\tAntal\tÁ-pris inkl. moms\tMoms\tBelopp\n${rows}\n\nExkl. moms\t${n2(sum.exkl)} kr\nMoms\t${n2(sum.moms)} kr\nAtt betala\t${n2(sum.inkl)} kr${h.forfallodatum ? `\nFörfallodatum\t${h.forfallodatum}` : ""}`;
    navigator.clipboard.writeText(text).then(() => setMedd("Kopierat — klistra in i Fortnox."));
  }

  const I = (k: keyof typeof h, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="field"><label htmlFor={k}>{label}</label><input id={k} value={h[k]} onChange={(e) => set(k, e.target.value)} {...props} /></div>
  );

  return (
    <div className="underlag">
      {/* Verktygsrad */}
      <div className="underlag__bar print-hide">
        <div className="admin__actions">
          <button className="btn btn--sm" disabled={pending} onClick={() => spara()}>{pending ? "Sparar…" : andrad ? "Spara ändringar" : "Spara"}</button>
          {h.status === "ej_fakturerad" && <button className="btn btn--sm btn--ghost" disabled={pending} onClick={() => spara({ status: "fakturerad", fakturerad: h.fakturerad || idag() })}>Markera fakturerad</button>}
          {h.status === "fakturerad" && <button className="btn btn--sm btn--ghost" disabled={pending} onClick={() => spara({ status: "betald", betald: h.betald || idag() })}>Markera betald</button>}
          <button className="btn btn--sm btn--ghost" type="button" onClick={kopiera}>Kopiera för Fortnox</button>
          <button className="btn btn--sm btn--ghost" type="button" onClick={() => window.print()}>Skriv ut</button>
        </div>
        <div className="admin__meta">{medd ?? (andrad ? "Osparade ändringar" : "")}</div>
      </div>

      <div className="underlag__grid">
        {/* Kund */}
        <section className="admin__panel">
          <h2 className="admin__h2">Faktureras till</h2>
          <div className="form" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="field field--full"><label htmlFor="rubrik">Avser</label><input id="rubrik" value={h.rubrik} onChange={(e) => set("rubrik", e.target.value)} /></div>
            {I("kund_foretag", "Företag / organisation")}
            {I("kund_orgnr", "Org.nr")}
            {I("kund_namn", "Kontaktperson")}
            {I("kund_referens", "Er referens")}
            <div className="field field--full"><label htmlFor="kund_adress">Fakturaadress</label><textarea id="kund_adress" value={h.kund_adress} onChange={(e) => set("kund_adress", e.target.value)} style={{ minHeight: 64 }} /></div>
            {I("kund_epost", "E-post för faktura", { type: "email" })}
            {I("kund_telefon", "Telefon", { type: "tel" })}
          </div>
          <div className="print-only underlag__kund">
            <p className="label">Faktureras till</p>
            {[h.kund_foretag, h.kund_namn, h.kund_orgnr && `Org.nr ${h.kund_orgnr}`, h.kund_adress, h.kund_referens && `Er referens: ${h.kund_referens}`, h.kund_epost].filter(Boolean).map((x, i) => <div key={i} style={{ whiteSpace: "pre-wrap" }}>{x}</div>)}
          </div>
        </section>

        {/* Status */}
        <section className="admin__panel">
          <h2 className="admin__h2">Status</h2>
          <div className="form" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="field"><label htmlFor="status">Status</label>
              <select id="status" value={h.status} onChange={(e) => set("status", e.target.value)}>
                {Object.entries(FAKTURASTATUS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            {I("fortnox_nummer", "Fakturanr i Fortnox")}
            {I("fakturerad", "Fakturerad", { type: "date" })}
            {I("forfallodatum", "Förfallodatum", { type: "date" })}
            {I("betald", "Betald", { type: "date" })}
            <div className="field field--full"><label htmlFor="anteckning">Anteckning</label><textarea id="anteckning" value={h.anteckning} onChange={(e) => set("anteckning", e.target.value)} style={{ minHeight: 64 }} placeholder="Avtalat pris, delbetalning, vad som återstår…" /></div>
          </div>
        </section>
      </div>

      {/* Rader */}
      <section className="admin__panel" style={{ marginTop: 16 }}>
        <div className="admin__head" style={{ marginBottom: 12 }}>
          <h2 className="admin__h2" style={{ margin: 0 }}>Rader <small style={{ fontWeight: 400, color: "var(--ws-ink-40)" }}>· priser inkl. moms</small></h2>
          <div className="admin__actions print-hide">
            {MALLAR.map((m) => <button key={m.t} type="button" className="btn btn--sm btn--ghost" onClick={() => laggTill(m.r)}>+ {m.t}</button>)}
          </div>
        </div>
        <div className="tablewrap">
          <table className="admin__table underlag__rader">
            <thead><tr><th style={{ width: "44%" }}>Beskrivning</th><th className="num">Antal</th><th>Enhet</th><th className="num">Á-pris</th><th>Moms</th><th className="num">Belopp</th><th className="print-hide"></th></tr></thead>
            <tbody>
              {rader.map((r, i) => (
                <tr key={i}>
                  <td><input value={r.beskrivning} onChange={(e) => setRad(i, "beskrivning", e.target.value)} placeholder="Vad som faktureras" style={{ width: "100%" }} /><span className="print-only">{r.beskrivning}</span></td>
                  <td className="num"><input type="number" step="0.5" value={r.antal} onChange={(e) => setRad(i, "antal", Number(e.target.value))} style={{ width: 70, textAlign: "right" }} /><span className="print-only">{n2(r.antal)}</span></td>
                  <td><input value={r.enhet} onChange={(e) => setRad(i, "enhet", e.target.value)} style={{ width: 64 }} /><span className="print-only">{r.enhet}</span></td>
                  <td className="num"><input type="number" step="1" value={r.a_pris} onChange={(e) => setRad(i, "a_pris", Number(e.target.value))} style={{ width: 100, textAlign: "right" }} /><span className="print-only">{n2(r.a_pris)} kr</span></td>
                  <td><select value={r.moms} onChange={(e) => setRad(i, "moms", Number(e.target.value))}>{[0, 6, 12, 25].map((m) => <option key={m} value={m}>{m} %</option>)}</select><span className="print-only">{r.moms} %</span></td>
                  <td className="num">{kr(Math.round(r.antal * r.a_pris))}</td>
                  <td className="print-hide"><button type="button" className="admin__logout" onClick={() => taBort(i)} title="Ta bort rad">✕</button></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              {Object.entries(sum.per).map(([m, x]) => (
                <tr key={m} className="underlag__sub"><td colSpan={5} className="num"><small>Varav moms {m} % (på {kr(Math.round(x.inkl))})</small></td><td className="num"><small>{kr(Math.round(x.moms))}</small></td><td className="print-hide"></td></tr>
              ))}
              <tr><td colSpan={5} className="num">Exkl. moms</td><td className="num">{kr(Math.round(sum.exkl))}</td><td className="print-hide"></td></tr>
              <tr><td colSpan={5} className="num">Moms</td><td className="num">{kr(Math.round(sum.moms))}</td><td className="print-hide"></td></tr>
              <tr className="underlag__total"><td colSpan={5} className="num">Att betala</td><td className="num">{kr(Math.round(sum.inkl))}</td><td className="print-hide"></td></tr>
            </tfoot>
          </table>
        </div>
      </section>

      <p className="print-hide" style={{ marginTop: 28, textAlign: "right" }}>
        <button type="button" className="admin__logout" onClick={() => { if (confirm("Ta bort underlaget? Bokningen eller förfrågan finns kvar.")) startT(async () => { await taBortUnderlag(u.id); router.push("/admin/fakturering"); }); }}>Ta bort underlaget</button>
      </p>
    </div>
  );
}
