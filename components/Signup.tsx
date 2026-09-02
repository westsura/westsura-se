"use client";

import Link from "next/link";
import { useState } from "react";

/** Anmälan till Westsuras Vänner. Sparas i databasen i etapp III — tills dess visas bara bekräftelsen. */
export default function Signup() {
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <p style={{ margin: "8px auto 0", color: "var(--accent-strong)", fontFamily: "var(--font-serif)", fontSize: 22, fontStyle: "italic" }}>
        Tack! Ett välkomstbrev är på väg till din inkorg.
      </p>
    );
  }

  return (
    <>
      <form className="signup signup--light" onSubmit={(e) => { e.preventDefault(); setDone(true); }}>
        <input type="text" name="namn" placeholder="Ditt namn" aria-label="Ditt namn" required autoComplete="name" />
        <input type="email" name="epost" placeholder="Din e-postadress" aria-label="Din e-postadress" required autoComplete="email" />
        <button className="btn" type="submit">Prenumerera</button>
      </form>
      <p style={{ fontSize: 14, marginTop: 18, marginBottom: 0, color: "var(--ws-ink-40)" }}>
        Några brev om året. Avsluta när du vill. Vi följer vår <Link href="/integritetspolicy">integritetspolicy</Link>.
      </p>
    </>
  );
}
