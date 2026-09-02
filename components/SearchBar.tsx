"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function plusDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x.toISOString().slice(0, 10);
}

export default function SearchBar({ inline = false, onSearch }: { inline?: boolean; onSearch?: (q: { in: string; out: string; guests: string; dog: boolean }) => void }) {
  const router = useRouter();
  const today = new Date();
  const [inD, setIn] = useState(plusDays(today, 7));
  const [outD, setOut] = useState(plusDays(today, 9));
  const [guests, setGuests] = useState("2");
  const [dog, setDog] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = { in: inD, out: outD, guests, dog };
    if (onSearch) return onSearch(q);
    const p = new URLSearchParams({ in: inD, out: outD, guests, dog: dog ? "1" : "0" });
    router.push(`/boende?${p.toString()}#bokning`);
  }

  return (
    <form className={`searchbar${inline ? " searchbar--inline" : ""}`} onSubmit={submit}>
      <div className="field">
        <label htmlFor="s-in">Ankomst</label>
        <input type="date" id="s-in" value={inD} onChange={(e) => setIn(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="s-out">Avresa</label>
        <input type="date" id="s-out" value={outD} onChange={(e) => setOut(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="s-guests">Gäster</label>
        <select id="s-guests" value={guests} onChange={(e) => setGuests(e.target.value)}>
          <option value="1">1 gäst</option>
          <option value="2">2 gäster</option>
          <option value="3">3 gäster</option>
          <option value="4">4 gäster</option>
          <option value="8">5–8 gäster</option>
          <option value="16">9 gäster eller fler</option>
        </select>
      </div>
      <div className="field">
        <span className="field-label">Hund</span>
        <label className="checkfield" htmlFor="s-dog">
          <input type="checkbox" id="s-dog" checked={dog} onChange={(e) => setDog(e.target.checked)} />
          <span>Vi har med hund</span>
        </label>
      </div>
      <button className="btn" type="submit">Sök ledigt</button>
    </form>
  );
}
