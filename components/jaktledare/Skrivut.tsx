"use client";

export default function Skrivut() {
  return <button type="button" className="btn btn--sm btn--ghost" onClick={() => window.print()}>Skriv ut passlista</button>;
}
