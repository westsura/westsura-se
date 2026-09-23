"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { loggaInMedlem, skickaMedlemslank } from "@/app/jaktklubb/actions";

export default function LoginForm({ fel: felFranLanken }: { fel?: string }) {
  const [lage, setLage] = useState<"login" | "glomt">("login");
  const [fel, setFel] = useState<string | null>(felFranLanken ?? null);
  const [pending, start] = useTransition();
  const router = useRouter();

  if (lage === "glomt") {
    return (
      <form className="form form--1" onSubmit={(e) => {
        e.preventDefault(); const fd = new FormData(e.currentTarget); setFel(null);
        start(async () => {
          const r = await skickaMedlemslank(fd);
          if (r.ok) router.push(`/jaktklubb/login/skickat?e=${encodeURIComponent(String(fd.get("epost") ?? ""))}`);
          else setFel(r.fel ?? "Kunde inte skicka länken.");
        });
      }}>
        <div className="field">
          <label htmlFor="jk-epost">E-postadress</label>
          <input type="email" id="jk-epost" name="epost" required autoComplete="username" placeholder="Din e-postadress" />
        </div>
        {fel && <div className="notice notice--fel" role="alert">{fel}</div>}
        <button className="btn btn--block" type="submit" disabled={pending}>{pending ? "Skickar…" : "Skicka länk för nytt lösenord"}</button>
        <button type="button" className="jk-lank jk-lank--knapp" onClick={() => { setFel(null); setLage("login"); }}>← Tillbaka till inloggningen</button>
      </form>
    );
  }

  return (
    <form className="form form--1" onSubmit={(e) => {
      e.preventDefault(); const fd = new FormData(e.currentTarget); setFel(null);
      start(async () => {
        const r = await loggaInMedlem(fd);
        if (r.ok) { router.push("/jaktklubb/medlem"); router.refresh(); } else setFel(r.fel ?? "Kunde inte logga in.");
      });
    }}>
      <div className="field">
        <label htmlFor="jk-epost">E-postadress</label>
        <input type="email" id="jk-epost" name="epost" required autoComplete="username" placeholder="Din e-postadress" />
      </div>
      <div className="field">
        <label htmlFor="jk-losen">Lösenord</label>
        <input type="password" id="jk-losen" name="losenord" required autoComplete="current-password" />
      </div>
      {fel && <div className="notice notice--fel" role="alert">{fel}</div>}
      <button className="btn btn--block" type="submit" disabled={pending}>{pending ? "Loggar in…" : "Logga in"}</button>
      <button type="button" className="jk-lank jk-lank--knapp" onClick={() => { setFel(null); setLage("glomt"); }}>Glömt lösenordet?</button>
    </form>
  );
}
