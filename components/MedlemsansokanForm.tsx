"use client";

import { useState, useTransition } from "react";
import { skapaMedlemsansokan } from "@/app/actions";
import { site } from "@/lib/site";

export type Niva = { id: string; namn: string; beskrivning: string | null; avgift: number; platser: number; kvar: number };

/** Ansökan om medlemskap i jaktklubben: kontaktuppgifter, jakterfarenhet och eventuell hund. */
export default function MedlemsansokanForm({ nivaer }: { nivaer: Niva[] }) {
  const [klar, setKlar] = useState(false);
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const flera = nivaer.length > 1;

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setFel(null);
    start(async () => {
      const r = await skapaMedlemsansokan(fd);
      if (r.ok) setKlar(true); else setFel(r.fel);
    });
  }

  if (klar) {
    return (
      <div className="notice notice--lg">
        <strong>Tack för din ansökan.</strong> Vi har tagit emot den och hör av oss personligen inom några dagar. Frågor under tiden: <a href={site.phoneHref}>{site.phone}</a>.
      </div>
    );
  }

  return (
    <form className="form" onSubmit={submit} id="ansokan">
      <div className="field">
        <label htmlFor="m-namn">Namn</label>
        <input type="text" id="m-namn" name="namn" required autoComplete="name" />
      </div>
      <div className="field">
        <label htmlFor="m-ort">Bostadsort</label>
        <input type="text" id="m-ort" name="ort" autoComplete="address-level2" />
      </div>
      <div className="field">
        <label htmlFor="m-epost">E-post</label>
        <input type="email" id="m-epost" name="epost" required autoComplete="email" />
      </div>
      <div className="field">
        <label htmlFor="m-telefon">Telefon</label>
        <input type="tel" id="m-telefon" name="telefon" required autoComplete="tel" />
      </div>

      {flera && (
        <div className="field field--full">
          <span className="field-label">Önskad nivå</span>
          {nivaer.map((n) => (
            <label key={n.id} className="checkfield">
              <input type="radio" name="onskad_niva" value={n.id} required />
              <span>{n.namn} — {n.avgift.toLocaleString("sv-SE")} kr per år</span>
            </label>
          ))}
        </div>
      )}

      <div className="field field--full">
        <label htmlFor="m-jakterfarenhet">Din jakterfarenhet</label>
        <textarea id="m-jakterfarenhet" name="jakterfarenhet" required minLength={20} className="ta--m"
          placeholder="Hur länge har du jagat, vilken jakt jagar du helst, har du jägarexamen och vapenlicens?" />
      </div>
      <div className="field field--full">
        <label htmlFor="m-hund">Hund <span className="hint">valfritt</span></label>
        <input type="text" id="m-hund" name="hund" placeholder="Ras och vad hunden används till" />
      </div>
      <div className="field field--full">
        <label htmlFor="m-meddelande">Något mer du vill berätta <span className="hint">valfritt</span></label>
        <textarea id="m-meddelande" name="meddelande" className="ta--s" placeholder="Varför just Westsura?" />
      </div>

      {fel && <div className="notice notice--fel field--full" role="alert">{fel}</div>}
      <div className="field--full cta-row">
        <button className="btn" type="submit" disabled={pending}>{pending ? "Skickar…" : "Skicka ansökan"}</button>
        <a className="btn btn--ghost" href={site.phoneHref}>Ring {site.phone}</a>
      </div>
      <p className="field--full hint">Uppgifterna används bara för att pröva din ansökan och sparas inte längre än nödvändigt.</p>
    </form>
  );
}
