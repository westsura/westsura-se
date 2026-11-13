"use client";

import { useState, useTransition } from "react";
import { bokaKurs } from "@/app/actions";
import Fakturafalt from "@/components/Fakturafalt";
import { site } from "@/lib/site";
import { barnAlderText } from "@/lib/aktivitet";

export type Kurs = {
  id: string; namn: string; datum_text: string; platser: number; kvar: number; oppen: boolean;
  pris_dubbel: number; pris_enkel: number; earlybird_dubbel: number | null; earlybird_enkel: number | null; earlybird_till: string | null;
  /** Helgkurs med boende (rumstyp väljs) eller dagskurs (ett pris per person). */
  med_boende?: boolean;
  benamning?: string;
  barnpris?: number | null; earlybird_barnpris?: number | null; barn_alder_fran?: number | null; barn_alder_till?: number | null;
  betalning?: string;
};

const kr = (n: number) => n.toLocaleString("sv-SE") + " kr";

/** Bokning av kurs eller aktivitet: antal (ev. barn), rumstyp, deltagare och kost. Faktura eller Swish i förskott. */
export default function KursBokning({ kurs }: { kurs: Kurs }) {
  const [antal, setAntal] = useState(1);
  const [barn, setBarn] = useState(0);
  const harBarn = kurs.barnpris != null;
  const swish = kurs.betalning === "swish";
    const [rum, setRum] = useState<"dubbel" | "enkel">("dubbel");
  const boende = kurs.med_boende !== false;
  const [klar, setKlar] = useState<{ nummer: number; summa: number; swish: boolean } | null>(null);
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const idag = new Date().toISOString().slice(0, 10);
  const eb = !!kurs.earlybird_till && idag <= kurs.earlybird_till;
  const nBarn = harBarn ? Math.min(barn, antal) : 0;
  const bp = (eb ? kurs.earlybird_barnpris ?? kurs.barnpris : kurs.barnpris) ?? 0;
  const pp = rum === "enkel" ? (eb ? kurs.earlybird_enkel ?? kurs.pris_enkel : kurs.pris_enkel) : (eb ? kurs.earlybird_dubbel ?? kurs.pris_dubbel : kurs.pris_dubbel);

  if (klar) {
    return (
      <div className="notice notice--lg">
        {klar.swish
          ? <><strong>Tack — din plats är reserverad.</strong> Säkra den genom att swisha <b>{kr(klar.summa)}</b> till <b>{site.swish}</b> och skriv ditt namn och bokningsnummer {klar.nummer} i meddelandet. Instruktionerna finns också i mejlet du just fått. När betalningen kommit in får du en bekräftelse. Frågor: <a href={site.phoneHref}>{site.phone}</a>.</>
          : <><strong>Tack — din plats är bokad.</strong> Bokningsnummer {klar.nummer}, totalt {kr(klar.summa)}. En bekräftelse är på väg till din e-post, och fakturan kommer separat. Frågor: <a href={site.phoneHref}>{site.phone}</a>.</>}
      </div>
    );
  }
  if (!kurs.oppen || kurs.kvar <= 0) {
    return (
      <div className="notice notice--lg">
        <strong>Det är fullbokat.</strong> Ring <a href={site.phoneHref}>{site.phone}</a> eller mejla <a href={`mailto:${site.email}`}>{site.email}</a> så sätter vi upp dig på reservlistan.
      </div>
    );
  }

  return (
    <form className="form" onSubmit={(e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      fd.set("kurs", kurs.id); fd.set("antal", String(antal)); fd.set("rumstyp", rum); fd.set("antal_barn", String(harBarn ? Math.min(barn, antal) : 0));
      setFel(null);
      start(async () => { const r = await bokaKurs(fd); if (r.ok) setKlar(r.data); else setFel(r.fel); });
    }}>
      <div className="field">
        <label htmlFor="k-antal">Antal deltagare</label>
        <select id="k-antal" value={antal} onChange={(e) => setAntal(Number(e.target.value))}>
          {Array.from({ length: harBarn ? 8 : 4 }, (_, i) => i + 1).filter((n) => n <= kurs.kvar).map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      {harBarn && (
        <div className="field">
          <label htmlFor="k-barn">Varav {barnAlderText(kurs.barn_alder_fran ?? null, kurs.barn_alder_till ?? null)}</label>
          <select id="k-barn" value={Math.min(barn, antal)} onChange={(e) => setBarn(Number(e.target.value))}>
            {Array.from({ length: antal + 1 }, (_, i) => i).map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      )}
      {boende && (
        <div className="field">
          <label htmlFor="k-rum">Boende</label>
          <select id="k-rum" value={rum} onChange={(e) => setRum(e.target.value as "dubbel" | "enkel")}>
            <option value="dubbel">Delat dubbelrum</option>
            <option value="enkel">Enkelrum</option>
          </select>
        </div>
      )}
      <p className="field--full hint">
        {boende ? (rum === "dubbel" ? "Bokar du ensam i delat dubbelrum delar du rum med en annan deltagare." : "Enkelrum — eget rum hela helgen.") : ""}
        {kurs.kvar <= Math.max(4, Math.ceil(kurs.platser * 0.2)) ? " Få platser kvar." : ""}
      </p>

      <div className="field"><label htmlFor="k-namn">Namn</label><input id="k-namn" name="namn" required autoComplete="name" /></div>
      <div className="field"><label htmlFor="k-tel">Telefon</label><input id="k-tel" name="telefon" type="tel" required autoComplete="tel" /></div>
      <div className="field"><label htmlFor="k-epost">E-post</label><input id="k-epost" name="epost" type="email" required autoComplete="email" /></div>
      {!swish && <div className="field"><label htmlFor="k-adress">Postadress för fakturan</label><input id="k-adress" name="adress" autoComplete="street-address" placeholder="Valfritt — annars skickas den till din e-post" /></div>}
      {antal > 1 && (
        <div className="field field--full"><label htmlFor="k-delt">Övriga deltagares namn</label><input id="k-delt" name="deltagare" required placeholder="Namn på de du bokar för" /></div>
      )}
      <div className="field field--full"><label htmlFor="k-kost">Kost och allergier</label><input id="k-kost" name="kost" placeholder="Valfritt — t.ex. vegetarian, glutenfritt" /></div>
      <div className="field field--full"><label htmlFor="k-medd">Meddelande</label><textarea id="k-medd" name="meddelande" className="ta--xs" placeholder={boende ? "Valfritt — vill du dela rum med någon särskild? Något vi bör veta?" : "Valfritt — något vi bör veta?"} /></div>
      {!swish && <Fakturafalt prefix="kf" full />}

      <div className="field--full sumrow sumrow--total" style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
        <span>{nBarn ? `${antal - nBarn} × ${kr(pp)} + ${nBarn} × ${kr(bp)}` : `${antal} × ${kr(pp)}`}{eb ? " · Early Bird" : ""}</span>
        <span>{kr(pp * (antal - nBarn) + bp * nBarn)}</span>
      </div>

      <label className="checkfield field--full">
        <input type="checkbox" name="villkor" value="1" required />
        <span>{swish
          ? `Jag förstår att platsen är reserverad tills betalningen med Swish har kommit in, och att bokningen då är bindande. Platsen kan överlåtas till någon annan utan kostnad.`
          : "Jag förstår att bokningen är bindande och att betalning sker mot faktura i samband med bokningen. Platsen kan överlåtas till någon annan utan kostnad."}</span>
      </label>

      {fel && <div className="notice notice--fel field--full" role="alert">{fel}</div>}
      <div className="field--full cta-row">
        <button className="btn" type="submit" disabled={pending}>{pending ? "Bokar…" : `${swish ? "Reservera" : "Boka"} ${antal === 1 ? "din plats" : `${antal} platser`}`}</button>
      </div>
    </form>
  );
}
