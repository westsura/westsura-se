"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sparaKurs, skapaKurs, taBortKurs } from "@/app/admin/actions";

export type KursRad = {
  id: string; namn: string; datum_text: string; datum_fran: string | null; datum_till: string | null; platser: number;
  pris_dubbel: number; pris_enkel: number; earlybird_dubbel: number | null; earlybird_enkel: number | null; earlybird_till: string | null; oppen: boolean;
  med_boende: boolean; publicerad: boolean; ingress: string | null; beskrivning: string | null; bild: string | null; bild_alt: string | null;
  kursledare: string | null; ingar: string | null; villkor: string | null; fakturatext: string | null;
};

/** Redigera en kurs: datum, platser och priser — och sidans innehåll för kurser med egen sida. */
export default function KursForm({ k }: { k: KursRad }) {
  const [medd, setMedd] = useState<string | null>(null);
  const [boende, setBoende] = useState(k.med_boende);
  const [visaSida, setVisaSida] = useState(!k.publicerad && k.id !== "naturfoto");
  const [pending, start] = useTransition();
  const router = useRouter();
  const egenSida = k.id !== "naturfoto";

  return (
    <form className="admin__panel form" onSubmit={(e) => {
      e.preventDefault(); const fd = new FormData(e.currentTarget); setMedd(null);
      start(async () => { const r = await sparaKurs(k.id, fd); setMedd(r.ok ? "Sparat — kurssidan är uppdaterad." : r.fel ?? "Kunde inte spara."); });
    }}>
      <div className="field"><label>Namn</label><input name="namn" defaultValue={k.namn} required /></div>
      {egenSida && (
        <div className="field"><label>Typ av kurs</label>
          <select name="med_boende" value={boende ? "1" : "0"} onChange={(e) => setBoende(e.target.value === "1")}>
            <option value="1">Helgkurs med boende (pris per rumstyp)</option>
            <option value="0">Dagskurs utan boende (pris per person)</option>
          </select></div>
      )}
      <div className="field"><label>Datum som visas på sajten</label><input name="datum_text" defaultValue={k.datum_text} required placeholder="T.ex. 14–16 maj 2027" /></div>
      <div className="field"><label>Från <span className="hint">när datumet är bestämt</span></label><input type="date" name="datum_fran" defaultValue={k.datum_fran ?? ""} /></div>
      <div className="field"><label>Till</label><input type="date" name="datum_till" defaultValue={k.datum_till ?? ""} /></div>
      <div className="field"><label>Platser</label><input type="number" name="platser" min={0} defaultValue={k.platser} required /></div>
      <div className="field"><label className="checkfield checkfield--bare"><input type="checkbox" name="oppen" defaultChecked={k.oppen} /><span>Öppen för bokning</span></label></div>
      {boende ? (
        <>
          <div className="field"><label>Ordinarie, delat dubbelrum (kr/pers)</label><input type="number" name="pris_dubbel" min={0} defaultValue={k.pris_dubbel} required /></div>
          <div className="field"><label>Ordinarie, enkelrum (kr/pers)</label><input type="number" name="pris_enkel" min={0} defaultValue={k.pris_enkel} required /></div>
          <div className="field"><label>Early Bird, delat dubbelrum</label><input type="number" name="earlybird_dubbel" min={0} defaultValue={k.earlybird_dubbel ?? ""} /></div>
          <div className="field"><label>Early Bird, enkelrum</label><input type="number" name="earlybird_enkel" min={0} defaultValue={k.earlybird_enkel ?? ""} /></div>
        </>
      ) : (
        <>
          <div className="field"><label>Pris per person (kr)</label><input type="number" name="pris_dubbel" min={0} defaultValue={k.pris_dubbel} required /></div>
          <div className="field"><label>Early Bird per person</label><input type="number" name="earlybird_dubbel" min={0} defaultValue={k.earlybird_dubbel ?? ""} /></div>
        </>
      )}
      <div className="field"><label>Early Bird gäller t.o.m.</label><input type="date" name="earlybird_till" defaultValue={k.earlybird_till ?? ""} /></div>

      {egenSida && (
        <>
          <div className="field field--full" style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 14 }}>
            <button type="button" className="linkbtn" onClick={() => setVisaSida(!visaSida)}>{visaSida ? "Dölj sidans innehåll" : "Visa sidans innehåll — text, bild och vad som ingår"}</button>
          </div>
          <div className={visaSida ? "field--full form" : "field--full"} style={visaSida ? { padding: 0 } : { display: "none" }}>
            <div className="field field--full"><label className="checkfield checkfield--bare"><input type="checkbox" name="publicerad" defaultChecked={k.publicerad} /><span>Publicerad — sidan syns på westsura.se/kurser/{k.id} och under Paket</span></label></div>
            <div className="field field--full"><label>Ingress</label><input name="ingress" defaultValue={k.ingress ?? ""} placeholder="En mening som lockar — visas överst på sidan och på kortet under Paket" /></div>
            <div className="field"><label>Kursledare</label><input name="kursledare" defaultValue={k.kursledare ?? ""} placeholder="Namn — och gärna en rad om personen" /></div>
            <div className="field"><label>Bild</label>
              {k.bild && /* eslint-disable-next-line @next/next/no-img-element */ <img src={k.bild} alt="" style={{ width: 160, height: 107, objectFit: "cover", marginBottom: 8 }} />}
              <input type="file" name="bildfil" accept="image/jpeg,image/png,image/webp" /></div>
            <div className="field field--full"><label>Bildtext för syntolkning</label><input name="bild_alt" defaultValue={k.bild_alt ?? ""} /></div>
            <div className="field field--full"><label>Text</label><textarea name="beskrivning" defaultValue={k.beskrivning ?? ""} style={{ minHeight: 200 }} placeholder={"Berätta om kursen. Tom rad mellan styckena. Skriv ## före en rad för mellanrubrik, t.ex. ## Om kursledaren"} /></div>
            <div className="field field--full"><label>Det här ingår</label><textarea name="ingar" defaultValue={k.ingar ?? ""} className="ta--s" placeholder={"En rad per punkt, t.ex.\nKursdag med lunch och fika\nMaterial"} /></div>
            <div className="field field--full"><label>Bokningsvillkor</label><textarea name="villkor" defaultValue={k.villkor ?? ""} className="ta--s" placeholder="Lämnas tomt = bindande bokning mot faktura, platsen kan överlåtas, återbetalning om kursen ställs in." /></div>
            <div className="field field--full"><label>Text på fakturaraden</label><input name="fakturatext" defaultValue={k.fakturatext ?? ""} placeholder={boende ? "T.ex. kurs, två nätter och alla måltider" : "T.ex. kursdag med lunch och fika"} /></div>
          </div>
        </>
      )}

      <div className="field--full cta-row">
        <button className="btn btn--sm" type="submit" disabled={pending}>{pending ? "Sparar…" : "Spara kursen"}</button>
        <a className="btn btn--sm btn--ghost" href={egenSida ? `/kurser/${k.id}` : "/paket/naturfoto"} target="_blank" rel="noopener">Visa sidan</a>
        {egenSida && <button type="button" className="linkbtn" disabled={pending} onClick={() => {
          if (!confirm(`Ta bort kursen ${k.namn}? Det går bara om den saknar bokningar.`)) return;
          start(async () => { const r = await taBortKurs(k.id); if (r.ok) router.refresh(); else setMedd(r.fel ?? "Kunde inte ta bort."); });
        }}>Ta bort kursen</button>}
        {medd && <span className="admin__meta" role="status">{medd}</span>}
      </div>
    </form>
  );
}

/** Ny kurs: grunduppgifterna. Den sparas som utkast — sidan fylls i och publiceras sedan. */
export function NyKurs() {
  const [oppen, setOppen] = useState(false);
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  if (!oppen) return <p style={{ marginBottom: 20 }}><button className="btn btn--sm" onClick={() => setOppen(true)}>+ Ny kurs</button></p>;
  return (
    <form className="admin__panel form" style={{ marginBottom: 24 }} onSubmit={(e) => {
      e.preventDefault(); const fd = new FormData(e.currentTarget); setFel(null);
      start(async () => { const r = await skapaKurs(fd); if (r.ok) { setOppen(false); router.refresh(); setTimeout(() => document.getElementById(`kurs-${r.id}`)?.scrollIntoView({ behavior: "smooth" }), 400); } else setFel(r.fel ?? "Kunde inte skapa."); });
    }}>
      <h2 className="admin__h2 field--full" style={{ margin: 0 }}>Ny kurs</h2>
      <div className="field"><label>Namn</label><input name="namn" required placeholder="T.ex. Akvarellhelg med …" /></div>
      <div className="field"><label>Typ</label>
        <select name="med_boende" defaultValue="1"><option value="1">Helgkurs med boende</option><option value="0">Dagskurs utan boende</option></select></div>
      <div className="field"><label>Datum som visas</label><input name="datum_text" required placeholder="T.ex. 12–14 mars 2027" /></div>
      <div className="field"><label>Platser</label><input name="platser" type="number" min={1} defaultValue={12} /></div>
      <div className="field"><label>Pris per person (kr)</label><input name="pris" type="number" min={0} required /><p className="hint">För helgkurser: priset i delat dubbelrum. Enkelrum och Early Bird ställer du in efteråt.</p></div>
      {fel && <div className="notice notice--fel field--full" role="alert">{fel}</div>}
      <div className="field--full cta-row">
        <button className="btn btn--sm" type="submit" disabled={pending}>{pending ? "Skapar…" : "Skapa kursen"}</button>
        <button className="btn btn--sm btn--ghost" type="button" onClick={() => setOppen(false)}>Avbryt</button>
      </div>
      <p className="hint field--full">Kursen sparas som utkast: stängd för bokning och inte publicerad. Fyll i sidans text och bild, och kryssa sedan i Publicerad och Öppen för bokning.</p>
    </form>
  );
}
