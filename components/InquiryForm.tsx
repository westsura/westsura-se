"use client";

import { useState, useTransition } from "react";
import { skapaForfragan } from "@/app/actions";
import { site } from "@/lib/site";
import Fakturafalt from "@/components/Fakturafalt";

/**
 * Hur formuläret ser ut för varje sorts förfrågan: vad som frågas efter i fritexten,
 * om hundrutan visas och hur den i så fall är formulerad. Hittar vi ingen träff
 * används standardtexterna.
 */
type Anpassning = { hund: string | null; medd: string; antal: string };
function anpassning(val: string): Anpassning {
  const v = val.toLowerCase();
  if (v.includes("bröllop")) return { hund: "Det kommer hundar till bröllopet", medd: "Vigsel, middag, dans, övernattning för gästerna — berätta hur ni tänker er dagen.", antal: "t.ex. 60" };
  if (v.includes("minnesstund")) return { hund: null, medd: "Tid på dagen, förtäring och annat som är bra för oss att veta. Vi hjälper gärna till med det praktiska.", antal: "t.ex. 30" };
  if (v.includes("konferens") || v.includes("seminarium") || v.includes("möte") || v.includes("kick off")) {
    return { hund: null, medd: "Tider, program, lunch och fika, specialkost, teknik — och om någon vill övernatta.", antal: "t.ex. 15" };
  }
  if (v.includes("förening")) return { hund: null, medd: "Lunch eller middag, årsmöte, specialkost och annat som är bra att veta.", antal: "t.ex. 25" };
  if (v.includes("födelsedag") || v.includes("jubileum") || v.includes("släkt") || v.includes("firande") || v.includes("fest")) {
    return { hund: "Det kommer hundar till festen", medd: "Middag eller buffé, tal, dans, övernattning — allt är bra att veta.", antal: "t.ex. 40" };
  }
  return { hund: "Vi har med hund", medd: "Önskemål om mat, lokal, övernattning — allt är bra att veta.", antal: "t.ex. 25" };
}

/** Förfrågan för event, firande, konferens och minnesstund. Sparas i databasen och bekräftas per mejl. */
export default function InquiryForm({ typ = "Firande", alternativ }: { typ?: string; alternativ?: string[] }) {
  const [nummer, setNummer] = useState<number | null>(null);
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const val = alternativ ?? ["Bröllop", "Födelsedag eller jubileum", "Lunch eller middag för förening", "Minnesstund", "Företagsevent eller kick off", "Annat"];
  const [vald, setVald] = useState(val.length === 1 ? val[0] : typ === "Firande" ? "" : val.includes(typ) ? typ : "");
  const a = anpassning(vald || typ);
  const fraga = typ === "Konferens" ? "Vad för slags möte?" : typ === "Minnesstund" ? "Vad gäller det?" : "Vad vill ni fira eller samlas kring?";

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setFel(null);
    start(async () => {
      const r = await skapaForfragan(fd);
      if (r.ok) setNummer(r.data.nummer); else setFel(r.fel);
    });
  }

  if (nummer) {
    return (
      <div className="notice notice--lg">
        <strong>Tack för din förfrågan.</strong> Vi har tagit emot den (nummer {nummer}) och hör av oss inom en vardag. Vill du hellre prata direkt: <a href={site.phoneHref}>{site.phone}</a>.
      </div>
    );
  }

  return (
    <form className="form" onSubmit={submit} id="forfragan">
      <div className="field field--full">
        <label htmlFor="f-typ">{fraga}</label>
        <select id="f-typ" name="typ" value={vald} onChange={(e) => setVald(e.target.value)} required>
          <option value="" disabled>Välj…</option>
          {val.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="f-datum">Önskat datum, ungefär</label>
        <input type="text" id="f-datum" name="datum" placeholder="t.ex. en lördag i maj" />
      </div>
      <div className="field">
        <label htmlFor="f-antal">Antal gäster, ungefär</label>
        <input type="text" id="f-antal" name="antal" placeholder={a.antal} required inputMode="numeric" />
      </div>
      <div className="field">
        <label htmlFor="f-namn">Ditt namn</label>
        <input type="text" id="f-namn" name="namn" required autoComplete="name" />
      </div>
      <div className="field">
        <label htmlFor="f-telefon">Telefon</label>
        <input type="tel" id="f-telefon" name="telefon" required autoComplete="tel" />
      </div>
      <div className="field field--full">
        <label htmlFor="f-epost">E-post</label>
        <input type="email" id="f-epost" name="epost" required autoComplete="email" />
      </div>
      <div className="field field--full">
        <label htmlFor="f-medd">Berätta gärna lite mer</label>
        <textarea id="f-medd" name="meddelande" placeholder={a.medd} />
      </div>
      {a.hund && (
        <div className="field field--full">
          <label className="checkfield checkfield--bare" htmlFor="f-hund">
            <input type="checkbox" id="f-hund" name="hund" />
            <span>{a.hund}</span>
          </label>
        </div>
      )}
      <Fakturafalt prefix="ff" full />
      {fel && <div className="notice notice--fel field--full" role="alert">{fel}</div>}
      <div className="field--full cta-row">
        <button className="btn" type="submit" disabled={pending}>{pending ? "Skickar…" : "Skicka förfrågan"}</button>
        <a className="btn btn--ghost" href={site.phoneHref}>Ring {site.phone}</a>
      </div>
    </form>
  );
}
