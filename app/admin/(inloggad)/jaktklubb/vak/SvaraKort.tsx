"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { svaraVak } from "@/app/admin/actions";
import { VAKTYP, OMRADETYP, kr, type Omrade } from "@/lib/vak";
import type { BokningMedJagare } from "./delar";

/** En önskan att svara på: förslag på lediga områden, bekräfta eller avböj. */
export default function SvaraKort({ b, lediga, alla, onskatNamn }: { b: BokningMedJagare; lediga: Omrade[]; alla: Omrade[]; onskatNamn: string | null }) {
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const onskatLedigt = !!b.onskat_omrade_id && lediga.some((o) => o.id === b.onskat_omrade_id);
  const forslag = onskatLedigt ? b.onskat_omrade_id! : lediga.find((o) => b.typ === "pyrsch" ? o.typ === "pyrschomrade" : o.typ !== "pyrschomrade")?.id ?? lediga[0]?.id ?? "";
  const gast = b.jagare?.status !== "godkand";

  const skicka = (beslut: "bekrafta" | "avboj", form: HTMLFormElement) => {
    const fd = new FormData(form);
    fd.set("beslut", beslut);
    if (beslut === "avboj" && !confirm("Avböja dygnet? Jägaren får ett mejl.")) return;
    setFel(null);
    start(async () => { const r = await svaraVak(b.id, fd); if (!r.ok) setFel(r.fel ?? "Fel"); });
  };

  return (
    <section className="admin__panel" style={{ marginBottom: 16 }}>
      <div className="admin__head" style={{ marginBottom: 8 }}>
        <div>
          <h3 className="admin__h2" style={{ margin: 0 }}>{b.datum} · {VAKTYP[b.typ]}</h3>
          <p className="admin__meta">
            {b.jagare ? <Link href={`/admin/jaktklubb/${b.jagare.id}`}>{b.jagare.namn}</Link> : "—"} · {gast ? "gästjägare" : "medlem"}
            {b.jagare?.telefon ? ` · ${b.jagare.telefon}` : ""} · {b.jagare?.epost}
          </p>
        </div>
        <div>
          <span className={`pill pill--${b.dokument_ok ? "godkand" : "saknas"}`} style={{ marginRight: 4 }}>{b.dokument_ok ? "Dokument klara" : "Dokument saknas"}</span>
          <span className={`pill pill--${b.jagare?.kurs_godkand ? "godkand" : "saknas"}`}>{b.jagare?.kurs_godkand ? "Kurs godkänd" : "Kurs ej gjord"}</span>
        </div>
      </div>
      {onskatNamn && <p className="admin__meta">Önskar: <b>{onskatNamn}</b>{onskatLedigt ? " — ledigt" : " — upptaget det dygnet"}</p>}
      {b.meddelande && <p style={{ margin: "8px 0" }}><small>{b.meddelande}</small></p>}
      {!lediga.length && <div className="notice notice--fel" style={{ marginBottom: 8 }}>Inga lediga områden det dygnet. Lägg upp fler områden eller avböj.</div>}
      {fel && <div className="notice notice--fel" role="alert" style={{ marginBottom: 8 }}>{fel}</div>}

      <form className="form" onSubmit={(e) => { e.preventDefault(); skicka("bekrafta", e.currentTarget); }}>
        <div className="field">
          <label>Tilldela område</label>
          <select name="omrade" defaultValue={forslag} required>
            <option value="">— välj —</option>
            {alla.map((o) => {
              const ledigt = lediga.some((l) => l.id === o.id);
              return <option key={o.id} value={o.id} disabled={!ledigt}>{o.namn} · {OMRADETYP[o.typ]}{ledigt ? "" : " (upptaget)"}</option>;
            })}
          </select>
          <p className="hint">Lediga områden det dygnet: {lediga.map((o) => o.namn).join(", ") || "inga"}.</p>
        </div>
        <div className="field">
          <label>Pris, kr</label>
          <input name="pris" type="number" min={0} defaultValue={b.pris} />
          <p className="hint">{b.pris ? "Fakturaunderlag skapas när du bekräftar." : "0 = ingår."}</p>
        </div>
        <div className="field field--full">
          <label>Till jägaren <small>valfritt</small></label>
          <input name="svar" placeholder="Var på plats senast 15.30, ring mig när du är i tornet…" />
        </div>
        <div className="field--full cta-row">
          <button className="btn btn--sm" type="submit" disabled={pending || !lediga.length}>{pending ? "Sparar…" : "Bekräfta dygnet"}</button>
          <button className="btn btn--sm btn--ghost" type="button" disabled={pending} onClick={(e) => skicka("avboj", e.currentTarget.form!)}>Avböj</button>
          <span className="admin__meta">Önskat {b.skapad.slice(0, 10)}{b.pris ? ` · ${kr(b.pris)}` : ""}</span>
        </div>
      </form>
    </section>
  );
}
