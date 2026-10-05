"use client";

import { useState, useTransition } from "react";
import { bokaKurs } from "@/app/actions";
import Fakturafalt from "@/components/Fakturafalt";
import { site } from "@/lib/site";

export type Kurs = {
  id: string; namn: string; datum_text: string; platser: number; kvar: number; oppen: boolean;
  pris_dubbel: number; pris_enkel: number; earlybird_dubbel: number | null; earlybird_enkel: number | null; earlybird_till: string | null;
};

const kr = (n: number) => n.toLocaleString("sv-SE") + " kr";

/** Bindande bokning av kursplatser: antal, rumstyp, deltagare och kost. Priset räknas som i databasen. */
export default function KursBokning({ kurs }: { kurs: Kurs }) {
  const [antal, setAntal] = useState(1);
  const [rum, setRum] = useState<"dubbel" | "enkel">("dubbel");
  const [klar, setKlar] = useState<{ nummer: number; summa: number } | null>(null);
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const idag = new Date().toISOString().slice(0, 10);
  const eb = !!kurs.earlybird_till && idag <= kurs.earlybird_till;
  const pp = rum === "enkel" ? (eb ? kurs.earlybird_enkel ?? kurs.pris_enkel : kurs.pris_enkel) : (eb ? kurs.earlybird_dubbel ?? kurs.pris_dubbel : kurs.pris_dubbel);

  if (klar) {
    return (
      <div className="notice notice--lg">
        <strong>Tack — din plats är bokad.</strong> Bokningsnummer {klar.nummer}, totalt {kr(klar.summa)}. En bekräftelse är på väg till din e-post, och fakturan kommer separat. Frågor: <a href={site.phoneHref}>{site.phone}</a>.
      </div>
    );
  }
  if (!kurs.oppen || kurs.kvar <= 0) {
    return (
      <div className="notice notice--lg">
        <strong>Kursen är fullbokad.</strong> Ring <a href={site.phoneHref}>{site.phone}</a> eller mejla <a href={`mailto:${site.email}`}>{site.email}</a> så sätter vi upp dig på reservlistan.
      </div>
    );
  }

  return (
    <form className="form" onSubmit={(e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      fd.set("kurs", kurs.id); fd.set("antal", String(antal)); fd.set("rumstyp", rum);
      setFel(null);
      start(async () => { const r = await bokaKurs(fd); if (r.ok) setKlar(r.data); else setFel(r.fel); });
    }}>
      <div className="field">
        <label htmlFor="k-antal">Antal deltagare</label>
        <select id="k-antal" value={antal} onChange={(e) => setAntal(Number(e.target.value))}>
          {[1, 2, 3, 4].filter((n) => n <= kurs.kvar).map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="k-rum">Boende</label>
        <select id="k-rum" value={rum} onChange={(e) => setRum(e.target.value as "dubbel" | "enkel")}>
          <option value="dubbel">Delat dubbelrum</option>
          <option value="enkel">Enkelrum</option>
        </select>
      </div>
      <p className="field--full hint">
        {rum === "dubbel" ? "Bokar du ensam i delat dubbelrum delar du rum med en annan kursdeltagare." : "Enkelrum — eget rum hela helgen."}
        {kurs.kvar <= 6 ? ` Bara ${kurs.kvar} platser kvar.` : ""}
      </p>

      <div className="field"><label htmlFor="k-namn">Namn</label><input id="k-namn" name="namn" required autoComplete="name" /></div>
      <div className="field"><label htmlFor="k-tel">Telefon</label><input id="k-tel" name="telefon" type="tel" required autoComplete="tel" /></div>
      <div className="field"><label htmlFor="k-epost">E-post</label><input id="k-epost" name="epost" type="email" required autoComplete="email" /></div>
      <div className="field"><label htmlFor="k-adress">Postadress för fakturan</label><input id="k-adress" name="adress" autoComplete="street-address" placeholder="Valfritt — annars skickas den till din e-post" /></div>
      {antal > 1 && (
        <div className="field field--full"><label htmlFor="k-delt">Övriga deltagares namn</label><input id="k-delt" name="deltagare" required placeholder="Namn på de du bokar för" /></div>
      )}
      <div className="field field--full"><label htmlFor="k-kost">Kost och allergier</label><input id="k-kost" name="kost" placeholder="Valfritt — t.ex. vegetarian, glutenfritt" /></div>
      <div className="field field--full"><label htmlFor="k-medd">Meddelande</label><textarea id="k-medd" name="meddelande" className="ta--xs" placeholder="Valfritt — vill du dela rum med någon särskild? Vilken kamera har du?" /></div>
      <Fakturafalt prefix="kf" full />

      <div className="field--full sumrow sumrow--total" style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
        <span>{antal} × {kr(pp)}{eb ? " · Early Bird" : ""}</span>
        <span>{kr(pp * antal)}</span>
      </div>

      <label className="checkfield field--full">
        <input type="checkbox" name="villkor" value="1" required />
        <span>Jag förstår att bokningen är bindande och att betalning sker mot faktura i samband med bokningen. Platsen kan överlåtas till någon annan utan kostnad.</span>
      </label>

      {fel && <div className="notice notice--fel field--full" role="alert">{fel}</div>}
      <div className="field--full cta-row">
        <button className="btn" type="submit" disabled={pending}>{pending ? "Bokar…" : `Boka ${antal === 1 ? "din plats" : `${antal} platser`}`}</button>
      </div>
    </form>
  );
}
