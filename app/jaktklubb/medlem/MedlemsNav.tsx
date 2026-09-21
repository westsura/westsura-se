"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Vapen } from "@/components/Blocks";
import { FLIKAR } from "./delar";

/** Sidhuvud, navigationsrad och den fästa bottennavigationen på mobil. */
export default function MedlemsNav({ sasong }: { sasong: string }) {
  const p = usePathname();
  const [meny, setMeny] = useState(false);
  const aktiv = (href: string) => (href === "/jaktklubb/medlem" ? p === href : p.startsWith(href));

  return (
    <>
      <header className="jk-head">
        <Link className="jk-marke" href="/jaktklubb/medlem">
          <Vapen variant="skold" size={30} className="jk-marke__skold" />
          <span>
            <span className="jk-marke__ord">WESTSURA</span>
            <span className="jk-marke__under">Herrgårdens jaktklubb</span>
          </span>
        </Link>
        <span className="jk-head__luft" />
        <span className="jk-head__etikett">Medlemsklubben</span>
        {sasong && <span className="jk-head__sasong">Säsong {sasong}</span>}
        <Link className="jk-head__profil" href="/jaktklubb/medlem/medlemskap">Min profil&nbsp; →</Link>
        <button type="button" className="jk-head__meny" aria-expanded={meny} onClick={() => setMeny(!meny)}>
          {meny ? "Stäng" : "Meny"}
        </button>
      </header>

      <nav className={`jk-nav${meny ? " jk-nav--oppen" : ""}`} aria-label="Medlemsklubben">
        {FLIKAR.map((f) => (
          <Link key={f.href} href={f.href} aria-current={aktiv(f.href) ? "page" : undefined} onClick={() => setMeny(false)}>{f.label}</Link>
        ))}
      </nav>

      <nav className="jk-botten" aria-label="Genvägar">
        {FLIKAR.filter((f) => f.kort).map((f) => (
          <Link key={f.href} href={f.href} aria-current={aktiv(f.href) ? "page" : undefined}>{f.kort}</Link>
        ))}
      </nav>
    </>
  );
}
