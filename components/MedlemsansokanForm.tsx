"use client";

import { useState, useTransition } from "react";
import { skapaMedlemsansokan } from "@/app/actions";
import { site } from "@/lib/site";

/** Ansökan om medlemskap i jaktklubben: kontaktuppgifter och en fri text om den sökande. */
export default function MedlemsansokanForm() {
  const [nummer, setNummer] = useState<number | null>(null);
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setFel(null);
    start(async () => {
      const r = await skapaMedlemsansokan(fd);
      if (r.ok) setNummer(r.data.nummer); else setFel(r.fel);
    });
  }

  if (nummer) {
    return (
      <div className="notice" style={{ fontSize: 18 }}>
        <strong>Tack för din ansökan.</strong> Vi har tagit emot den (nummer {nummer}) och hör av oss personligen inom några dagar. Frågor under tiden: <a href={site.phoneHref}>{site.phone}</a>.
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
      <div className="field field--full">
        <label htmlFor="m-text">Berätta om dig själv</label>
        <textarea id="m-text" name="text" required minLength={20} style={{ minHeight: 160 }}
          placeholder="Hur länge har du jagat, vilken jakt tycker du om, har du hund, vilket medlemskap tänker du dig — och varför just Westsura?" />
      </div>
      {fel && <div className="notice field--full" style={{ borderLeftColor: "#a33" }}>{fel}</div>}
      <div className="field--full cta-row">
        <button className="btn" type="submit" disabled={pending}>{pending ? "Skickar…" : "Skicka ansökan"}</button>
        <a className="btn btn--ghost" href={site.phoneHref}>Ring {site.phone}</a>
      </div>
      <p className="field--full" style={{ fontSize: 14, color: "var(--ws-ink-40)", margin: 0 }}>Uppgifterna används bara för att pröva din ansökan och sparas inte längre än nödvändigt.</p>
    </form>
  );
}
