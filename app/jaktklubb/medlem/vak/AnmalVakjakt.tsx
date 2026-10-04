"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { anmalVakjakt } from "@/app/jaktklubb/actions";
import { OMRADETYP, VAKVILT, type Omrade } from "@/lib/vak";

/** Medlemmens egen vakjakt — eget datum, godkänns av herrgården. */
export default function AnmalVakjakt({ omraden, dokumentKlara }: { omraden: Omrade[]; dokumentKlara: boolean }) {
  const [kvitto, setKvitto] = useState<string | null>(null);
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const idag = new Date().toISOString().slice(0, 10);

  return (
    <section className="jk-kort jk-kort--ljus jk-kort--bred">
      <p className="jk-etikett">Anmäl vakjakt</p>
      <p className="jk-lede">Vill du sitta på vak en annan dag — framför allt efter bäver eller vildsvin? Anmäl datumet här. Herrgården stämmer av mot annan planerad jakt och bekräftar, så att det kan ske säkert. Anmäld vakjakt räknas inte mot dina dygn.</p>
      <form className="form" onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        setFel(null); setKvitto(null);
        start(async () => {
          const r = await anmalVakjakt(fd);
          if (!r.ok) { setFel(r.fel ?? "Det gick inte att skicka anmälan."); return; }
          setKvitto("Anmälan är skickad — du får besked när herrgården har godkänt den.");
          form.reset(); router.refresh();
        });
      }}>
        <div className="field">
          <label htmlFor="av-datum">Datum</label>
          <input id="av-datum" name="datum" type="date" min={idag} required />
        </div>
        <div className="field">
          <label htmlFor="av-vilt">Vilt</label>
          <select id="av-vilt" name="vilt" defaultValue="baver" required>
            {Object.entries(VAKVILT).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          </select>
        </div>
        {omraden.length > 0 && (
          <div className="field">
            <label htmlFor="av-omrade">Önskat torn eller plats <small>valfritt</small></label>
            <select id="av-omrade" name="omrade" defaultValue="">
              <option value="">Herrgården föreslår</option>
              {omraden.map((o) => <option key={o.id} value={o.id}>{o.namn} · {OMRADETYP[o.typ]}</option>)}
            </select>
          </div>
        )}
        <div className="field">
          <label htmlFor="av-medd">Tid och övrigt <small>valfritt</small></label>
          <input id="av-medd" name="meddelande" placeholder="T.ex. kvällen, från 18" />
        </div>
        {kvitto && <p className="notice field--full">{kvitto}</p>}
        {fel && <p className="notice notice--fel field--full" role="alert">{fel}</p>}
        <div className="field--full cta-row">
          <button className="btn" type="submit" disabled={pending || !dokumentKlara}>{pending ? "Skickar…" : "Anmäl vakjakt"}</button>
          {!dokumentKlara && <span className="jk-hjalp">Dina dokument behöver vara godkända först.</span>}
        </div>
      </form>
    </section>
  );
}
