"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { skapaArende } from "@/app/admin/arenden";
import { ARENDETYP, ARENDESTATUS } from "@/lib/arende";
import DelFalt, { type Resurser } from "./DelFalt";
import Konflikter from "./Konflikter";

/** Ny bokning, förfrågan eller intern aktivitet — med första tjänsten direkt. Fler läggs till på bokningen. */
export default function NyBokning({ resurser, intern: startIntern, datum }: { resurser: Resurser; intern?: boolean; datum?: string }) {
  const [typ, setTyp] = useState(startIntern ? "intern" : "konferens");
  const [fel, setFel] = useState<string | null>(null);
  const [krockar, setKrockar] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const router = useRouter();
  const intern = typ === "intern";

  return (
    <form className="form admin__panel" onSubmit={(e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      setFel(null); setKrockar([]);
      start(async () => {
        const r = await skapaArende(fd);
        if (r.ok && r.id) router.push(`/admin/bokningar/${r.id}`);
        else { setFel(r.fel ?? "Kunde inte spara."); setKrockar(r.konflikter ?? []); }
      });
    }}>
      <div className="field"><label>Typ</label>
        <select name="typ" value={typ} onChange={(e) => setTyp(e.target.value)}>
          {Object.entries(ARENDETYP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      {!intern && (
        <div className="field"><label>Status</label>
          <select name="status" defaultValue="forfragan">
            {Object.entries(ARENDESTATUS).filter(([k]) => k !== "avbokad").map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      )}
      <div className="field field--full"><label>{intern ? "Rubrik" : "Rubrik (valfritt)"}</label>
        <input name="rubrik" required={intern} placeholder={intern ? "T.ex. Personalmöte, fotografering, storstädning" : "T.ex. Ledningsgruppens höstdag"} /></div>

      {!intern && (
        <>
          <div className="field"><label>Kontaktperson</label><input name="kund_namn" autoComplete="off" /></div>
          <div className="field"><label>Företag / sällskap</label><input name="kund_foretag" autoComplete="off" /></div>
          <div className="field"><label>E-post</label><input name="kund_epost" type="email" autoComplete="off" /></div>
          <div className="field"><label>Telefon</label><input name="kund_telefon" type="tel" autoComplete="off" /></div>
          <div className="field"><label>Antal gäster</label><input name="antal_gaster" type="number" min={0} /></div>
          <div className="field"><label>Sista svarsdatum</label><input name="svara_senast" type="date" /><p className="hint">För preliminära bokningar — markeras när det är dags att följa upp.</p></div>
          <div className="field field--full"><label>Särskilda önskemål</label><textarea name="onskemal" className="ta--s" placeholder="Kost, allergier, upplägg, teknik …" /></div>
        </>
      )}
      <div className="field field--full"><label>Interna anteckningar</label><textarea name="anteckningar" className="ta--s" placeholder="Syns bara i admin" /></div>

      <h3 className="admin__h3 field--full" style={{ margin: "8px 0 0" }}>{intern ? "När och var" : "Första tjänsten"}</h3>
      <p className="hint field--full" style={{ marginTop: 0 }}>{intern ? "Välj lokaler eller boenden om aktiviteten tar dem i anspråk." : "Fler tjänster — till exempel middag och övernattning — lägger du till på bokningen efteråt. Lämna datum tomt om det inte är bestämt."}</p>
      <DelFalt key={typ} valfritt={!intern} resurser={resurser} intern={intern} standardTyp={intern ? "intern" : typ === "privat" ? "evenemang" : typ} del={datum ? { id: "", arende_id: "", typ: intern ? "intern" : typ, fran: datum, till: datum, tid_fran: null, tid_till: null, enhet_ids: [], lokal_ids: [], antal: null, beskrivning: null, blockerar: true } : undefined} />

      {fel && <Konflikter fel={fel} konflikter={krockar} />}
      <div className="field--full cta-row">
        <button className="btn" type="submit" disabled={pending}>{pending ? "Sparar…" : intern ? "Lägg in aktiviteten" : "Spara bokningen"}</button>
      </div>
    </form>
  );
}
