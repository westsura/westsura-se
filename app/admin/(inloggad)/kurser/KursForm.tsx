"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sparaKurs, skapaKurs, taBortKurs } from "@/app/admin/actions";
import { standardMejlBokning, STANDARD_BEKRAFTELSE, standardVillkor, MEJLPLATSHALLARE } from "@/lib/aktivitet";

export type KursRad = {
  id: string; namn: string; datum_text: string; datum_fran: string | null; datum_till: string | null; platser: number;
  pris_dubbel: number; pris_enkel: number; earlybird_dubbel: number | null; earlybird_enkel: number | null; earlybird_till: string | null; oppen: boolean;
  med_boende: boolean; publicerad: boolean; ingress: string | null; beskrivning: string | null; bild: string | null; bild_alt: string | null;
  kursledare: string | null; ingar: string | null; villkor: string | null; fakturatext: string | null;
  benamning: string; barnpris: number | null; barn_alder_fran: number | null; barn_alder_till: number | null;
  betalning: string; mejl_bokning: string | null; mejl_bekraftelse: string | null; bilder: { src: string; alt: string }[];
};

/** Redigera en kurs/aktivitet: datum, platser, priser (även barn), betalsätt, mejltexter — och sidans innehåll. */
export default function KursForm({ k }: { k: KursRad }) {
  const [medd, setMedd] = useState<string | null>(null);
  const [boende, setBoende] = useState(k.med_boende);
  const [betalning, setBetalning] = useState(k.betalning);
  const [barn, setBarn] = useState(k.barnpris != null);
  const [visaTexter, setVisaTexter] = useState(false);
  const [visaSida, setVisaSida] = useState(!k.publicerad && k.id !== "naturfoto");
  const [pending, start] = useTransition();
  const router = useRouter();
  const egenSida = k.id !== "naturfoto";

  return (
    <form className="admin__panel form" onSubmit={(e) => {
      e.preventDefault(); const fd = new FormData(e.currentTarget); setMedd(null);
      start(async () => { const r = await sparaKurs(k.id, fd); setMedd(r.ok ? "Sparat — sidan är uppdaterad." : r.fel ?? "Kunde inte spara."); if (r.ok) router.refresh(); });
    }}>
      <div className="field"><label>Namn</label><input name="namn" defaultValue={k.namn} required /></div>
      {egenSida && (
        <div className="field"><label>Typ</label>
          <select name="med_boende" value={boende ? "1" : "0"} onChange={(e) => setBoende(e.target.value === "1")}>
            <option value="1">Med boende (pris per rumstyp)</option>
            <option value="0">Utan boende (pris per person)</option>
          </select></div>
      )}
      <div className="field"><label>Benämning på sajten</label><input name="benamning" defaultValue={k.benamning} placeholder="T.ex. kurs, workshop, provning, aktivitet" />
        <p className="hint">Används i texterna, t.ex. ”Om {k.benamning || "aktiviteten"}” och etiketten på kortet under Paket.</p></div>
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
      <div className="field field--full"><label className="checkfield checkfield--bare"><input type="checkbox" checked={barn} onChange={(e) => setBarn(e.target.checked)} /><span>Eget pris för barn</span></label></div>
      {barn ? (
        <>
          <div className="field"><label>Barnpris (kr/barn)</label><input type="number" name="barnpris" min={0} defaultValue={k.barnpris ?? ""} required /></div>
          <div className="field"><label>Ålder från</label><input type="number" name="barn_alder_fran" min={0} max={17} defaultValue={k.barn_alder_fran ?? ""} placeholder="T.ex. 4" /></div>
          <div className="field"><label>Ålder till och med</label><input type="number" name="barn_alder_till" min={0} max={17} defaultValue={k.barn_alder_till ?? ""} placeholder="T.ex. 12" /></div>
        </>
      ) : <input type="hidden" name="barnpris" value="" />}
      <div className="field"><label>Betalning vid bokning</label>
        <select name="betalning" value={betalning} onChange={(e) => setBetalning(e.target.value)}>
          <option value="faktura">Faktura — bindande bokning, fakturaunderlag skapas direkt</option>
          <option value="swish">Swish i förskott — platsen säkras när betalningen kommit in</option>
        </select></div>

      <div className="field field--full" style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 14 }}>
        <button type="button" className="linkbtn" onClick={() => setVisaTexter(!visaTexter)}>{visaTexter ? "Dölj mejl och villkor" : "Mejl och bokningsvillkor — redigera texterna"}</button>
      </div>
      <div className={visaTexter ? "field--full form" : "field--full"} style={visaTexter ? { padding: 0 } : { display: "none" }}>
        <p className="hint field--full" style={{ margin: 0 }}>Platshållare som fylls i: {MEJLPLATSHALLARE.map(([p]) => p).join(" ")}</p>
        <div className="field field--full"><label>Mejl vid bokning</label>
          <textarea name="mejl_bokning" key={"b" + (k.mejl_bokning ? "" : betalning)} defaultValue={k.mejl_bokning ?? standardMejlBokning(betalning)} style={{ minHeight: 220 }} />
          <p className="hint">{betalning === "swish" ? "Går ut direkt när någon bokar — med Swishnumret och summan." : "Går ut direkt när någon bokar."}</p></div>
        {betalning === "swish" && (
          <div className="field field--full"><label>Mejl när betalningen kommit in</label>
            <textarea name="mejl_bekraftelse" defaultValue={k.mejl_bekraftelse ?? STANDARD_BEKRAFTELSE} style={{ minHeight: 180 }} />
            <p className="hint">Går ut när du klickar ”Betalning mottagen” — du kan ändra texten igen innan den skickas.</p></div>
        )}
        {betalning !== "swish" && <input type="hidden" name="mejl_bekraftelse" value={k.mejl_bekraftelse ?? ""} />}
        {egenSida && (
          <div className="field field--full"><label>Bokningsvillkor</label>
            <textarea name="villkor" key={"v" + (k.villkor ? "" : betalning)} defaultValue={k.villkor ?? standardVillkor(betalning)} style={{ minHeight: 140 }} /></div>
        )}
      </div>

      {egenSida && (
        <>
          <div className="field field--full" style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 14 }}>
            <button type="button" className="linkbtn" onClick={() => setVisaSida(!visaSida)}>{visaSida ? "Dölj sidans innehåll" : "Visa sidans innehåll — text, bild och vad som ingår"}</button>
          </div>
          <div className={visaSida ? "field--full form" : "field--full"} style={visaSida ? { padding: 0 } : { display: "none" }}>
            <div className="field field--full"><label className="checkfield checkfield--bare"><input type="checkbox" name="publicerad" defaultChecked={k.publicerad} /><span>Publicerad — sidan syns på westsura.se/aktiviteter/{k.id} och under Paket</span></label></div>
            <div className="field field--full"><label>Ingress</label><input name="ingress" defaultValue={k.ingress ?? ""} placeholder="En mening som lockar — visas överst på sidan och på kortet under Paket" /></div>
            <div className="field"><label>Ledare / värd</label><input name="kursledare" defaultValue={k.kursledare ?? ""} placeholder="Namn — och gärna en rad om personen" /></div>
            <div className="field"><label>Bild</label>
              {k.bild && /* eslint-disable-next-line @next/next/no-img-element */ <img src={k.bild} alt="" style={{ width: 160, height: 107, objectFit: "cover", marginBottom: 8 }} />}
              <input type="file" name="bildfil" accept="image/jpeg,image/png,image/webp" /></div>
            <div className="field field--full"><label>Bildtext för syntolkning</label><input name="bild_alt" defaultValue={k.bild_alt ?? ""} /></div>
            <div className="field field--full"><label>Text</label><textarea name="beskrivning" defaultValue={k.beskrivning ?? ""} style={{ minHeight: 200 }} placeholder={"Berätta om aktiviteten. Tom rad mellan styckena. Skriv ## före en rad för mellanrubrik, t.ex. ## Om kursledaren"} /></div>
            <div className="field field--full"><label>Det här ingår</label><textarea name="ingar" defaultValue={k.ingar ?? ""} className="ta--s" placeholder={"En rad per punkt, t.ex.\nKursdag med lunch och fika\nMaterial"} /></div>
            <div className="field field--full"><label>Fler bilder</label>
              {!!k.bilder.length && (
                <div className="valrad" style={{ marginBottom: 8 }}>
                  {k.bilder.map((b) => (
                    <label key={b.src} className="checkfield checkfield--bare" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={b.src} alt="" style={{ width: 120, height: 80, objectFit: "cover" }} />
                      <span><input type="checkbox" name="ta_bort_bild" value={b.src} /> ta bort</span>
                    </label>
                  ))}
                </div>
              )}
              <input type="file" name="galleri" accept="image/jpeg,image/png,image/webp" multiple />
              <p className="hint">Visas som bildgalleri på sidan. Välj flera på en gång. Huvudbilden ovan används högst upp och på kortet under Paket.</p></div>
            <div className="field field--full"><label>Text på fakturaraden</label><input name="fakturatext" defaultValue={k.fakturatext ?? ""} placeholder={boende ? "T.ex. kurs, två nätter och alla måltider" : "T.ex. kursdag med lunch och fika"} /></div>
          </div>
        </>
      )}

      <div className="field--full cta-row">
        <button className="btn btn--sm" type="submit" disabled={pending}>{pending ? "Sparar…" : "Spara"}</button>
        <a className="btn btn--sm btn--ghost" href={egenSida ? `/aktiviteter/${k.id}` : "/paket/naturfoto"} target="_blank" rel="noopener">Visa sidan</a>
        {egenSida && <button type="button" className="linkbtn" disabled={pending} onClick={() => {
          if (!confirm(`Ta bort ${k.namn}? Det går bara om den saknar bokningar.`)) return;
          start(async () => { const r = await taBortKurs(k.id); if (r.ok) router.refresh(); else setMedd(r.fel ?? "Kunde inte ta bort."); });
        }}>Ta bort</button>}
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
  if (!oppen) return <p style={{ marginBottom: 20 }}><button className="btn btn--sm" onClick={() => setOppen(true)}>+ Ny kurs eller aktivitet</button></p>;
  return (
    <form className="admin__panel form" style={{ marginBottom: 24 }} onSubmit={(e) => {
      e.preventDefault(); const fd = new FormData(e.currentTarget); setFel(null);
      start(async () => { const r = await skapaKurs(fd); if (r.ok) { setOppen(false); router.refresh(); setTimeout(() => document.getElementById(`kurs-${r.id}`)?.scrollIntoView({ behavior: "smooth" }), 400); } else setFel(r.fel ?? "Kunde inte skapa."); });
    }}>
      <h2 className="admin__h2 field--full" style={{ margin: 0 }}>Ny kurs eller aktivitet</h2>
      <div className="field"><label>Namn</label><input name="namn" required placeholder="T.ex. Akvarellhelg, Vinprovning, Barnens jul …" /></div>
      <div className="field"><label>Typ</label>
        <select name="med_boende" defaultValue="0"><option value="0">Utan boende</option><option value="1">Med boende (t.ex. helgkurs)</option></select></div>
      <div className="field"><label>Benämning</label><input name="benamning" defaultValue="aktivitet" placeholder="kurs, workshop, provning …" /></div>
      <div className="field"><label>Betalning</label>
        <select name="betalning" defaultValue="swish"><option value="swish">Swish i förskott</option><option value="faktura">Faktura</option></select></div>
      <div className="field"><label>Datum som visas</label><input name="datum_text" required placeholder="T.ex. 12–14 mars 2027" /></div>
      <div className="field"><label>Platser</label><input name="platser" type="number" min={1} defaultValue={12} /></div>
      <div className="field"><label>Pris per person (kr)</label><input name="pris" type="number" min={0} required /><p className="hint">Med boende: priset i delat dubbelrum. Enkelrum, barnpris och Early Bird ställer du in efteråt.</p></div>
      {fel && <div className="notice notice--fel field--full" role="alert">{fel}</div>}
      <div className="field--full cta-row">
        <button className="btn btn--sm" type="submit" disabled={pending}>{pending ? "Skapar…" : "Skapa kursen"}</button>
        <button className="btn btn--sm btn--ghost" type="button" onClick={() => setOppen(false)}>Avbryt</button>
      </div>
      <p className="hint field--full">Sparas som utkast: stängd för bokning och inte publicerad. Fyll i sidans text och bilder, och kryssa sedan i Publicerad och Öppen för bokning.</p>
    </form>
  );
}
