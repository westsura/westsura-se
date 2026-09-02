"use client";

import { useState } from "react";
import { site } from "@/lib/site";

/** Förfrågan för event, firande och konferens. Skickas till inkorgen i admin i etapp II — tills dess öppnas ett färdigt mejl. */
export default function InquiryForm({ typ = "Firande", alternativ }: { typ?: string; alternativ?: string[] }) {
  const [sent, setSent] = useState(false);
  const val = alternativ ?? ["Bröllop", "Födelsedag eller jubileum", "Lunch eller middag för förening", "Minnesstund", "Företagsevent eller kick off", "Annat"];

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const rader = [
      `Typ av tillställning: ${f.get("typ")}`,
      `Önskat datum: ${f.get("datum") || "ej bestämt"}`,
      `Antal gäster: ${f.get("antal")}`,
      `Hundar: ${f.get("hund") ? "ja" : "nej"}`,
      `Namn: ${f.get("namn")}`,
      `Telefon: ${f.get("telefon")}`,
      `E-post: ${f.get("epost")}`,
      "",
      `${f.get("meddelande") || ""}`,
    ];
    const body = encodeURIComponent(rader.join("\n"));
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent("Förfrågan: " + f.get("typ"))}&body=${body}`;
    setSent(true);
  }

  if (sent) {
    return (
      <div className="notice" style={{ fontSize: 18 }}>
        <strong>Tack för din förfrågan.</strong> Vi hör av oss inom en vardag. Vill du hellre prata direkt: <a href={site.phoneHref}>{site.phone}</a>.
      </div>
    );
  }

  return (
    <form className="form" onSubmit={submit} id="forfragan">
      <div className="field field--full">
        <label htmlFor="f-typ">Vad vill ni fira eller samlas kring?</label>
        <select id="f-typ" name="typ" defaultValue={typ === "Firande" ? "" : typ} required>
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
        <input type="text" id="f-antal" name="antal" placeholder="t.ex. 25" required inputMode="numeric" />
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
        <textarea id="f-medd" name="meddelande" placeholder="Önskemål om mat, lokal, övernattning, hundar — allt är bra att veta." />
      </div>
      <div className="field field--full">
        <label className="checkfield checkfield--bare" htmlFor="f-hund">
          <input type="checkbox" id="f-hund" name="hund" />
          <span>Det kommer hundar till festen</span>
        </label>
      </div>
      <div className="field--full cta-row">
        <button className="btn" type="submit">Skicka förfrågan</button>
        <a className="btn btn--ghost" href={site.phoneHref}>Ring {site.phone}</a>
      </div>
    </form>
  );
}
