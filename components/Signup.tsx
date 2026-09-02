"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { anmalVan } from "@/app/actions";

/** Anmälan till Westsuras Vänner. Sparas i databasen i etapp III — tills dess visas bara bekräftelsen. */
export default function Signup() {
  const [done, setDone] = useState(false);
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (done) {
    return (
      <p style={{ margin: "8px auto 0", color: "var(--accent-strong)", fontFamily: "var(--font-serif)", fontSize: 22, fontStyle: "italic" }}>
        Tack! Ett välkomstbrev är på väg till din inkorg.
      </p>
    );
  }

  return (
    <>
      <form className="signup signup--light" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); setFel(null); start(async () => { const r = await anmalVan(fd); if (r.ok) setDone(true); else setFel(r.fel); }); }}>
        <input type="text" name="namn" placeholder="Ditt namn" aria-label="Ditt namn" required autoComplete="name" />
        <input type="email" name="epost" placeholder="Din e-postadress" aria-label="Din e-postadress" required autoComplete="email" />
        <button className="btn" type="submit" disabled={pending}>{pending ? "Skickar…" : "Prenumerera"}</button>
      </form>
      {fel && <p style={{ color: "#a33", fontSize: 15, marginTop: 12 }}>{fel}</p>}
      <p style={{ fontSize: 14, marginTop: 18, marginBottom: 0, color: "var(--ws-ink-40)" }}>
        Några brev om året. Avsluta när du vill. Vi följer vår <Link href="/integritetspolicy">integritetspolicy</Link>.
      </p>
    </>
  );
}
